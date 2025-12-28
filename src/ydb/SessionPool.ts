import type { Driver } from "@ydbjs/core";
import { StatusIds_StatusCode, type IssueMessage } from "@ydbjs/api/operation";
import { QueryServiceDefinition } from "@ydbjs/api/query";
import { YDBError } from "@ydbjs/error";
import { logger } from "../logging/logger.js";
import {
  SESSION_KEEPALIVE_PERIOD_MS,
  SESSION_POOL_MAX_SIZE,
  SESSION_POOL_MIN_SIZE,
  STARTUP_PROBE_SESSION_TIMEOUT_MS,
} from "../config/env.js";

export type PooledQuerySession = {
  nodeId: bigint;
  sessionId: string;
};

type InternalSession = PooledQuerySession & {
  lastUsedAtMs: number;
  lastCheckedAtMs: number;
};

function isSuccessStatus(
  status: unknown
): status is StatusIds_StatusCode.SUCCESS {
  return status === StatusIds_StatusCode.SUCCESS;
}

type AttachSessionResponse = { status?: unknown; issues?: unknown };

function asAttachSessionResponse(value: unknown): AttachSessionResponse {
  if (typeof value === "object" && value !== null) {
    return value as AttachSessionResponse;
  }
  return {};
}

function toStatusCode(status: unknown): StatusIds_StatusCode {
  return typeof status === "number"
    ? (status as StatusIds_StatusCode)
    : (StatusIds_StatusCode.STATUS_CODE_UNSPECIFIED as StatusIds_StatusCode);
}

const EMPTY_ISSUES: IssueMessage[] = [];

function nowMs(): number {
  return Date.now();
}

export class SessionPool {
  private readonly available: InternalSession[] = [];
  private readonly inUse = new Set<string>();
  private readonly waiters: Array<(s: InternalSession) => void> = [];

  private keepaliveTimer: NodeJS.Timeout | null = null;
  private isClosed = false;

  constructor(private readonly driver: Driver) {}

  start(): void {
    if (this.keepaliveTimer) return;
    this.keepaliveTimer = setInterval(() => {
      void this.keepaliveTick();
    }, SESSION_KEEPALIVE_PERIOD_MS);
    // Don't keep the Node process alive just because of keepalive.
    this.keepaliveTimer.unref();
  }

  async close(): Promise<void> {
    this.isClosed = true;
    if (this.keepaliveTimer) {
      clearInterval(this.keepaliveTimer);
      this.keepaliveTimer = null;
    }
    for (const w of this.waiters.splice(0)) {
      // Unblock waiters with a fresh session if possible; otherwise they will fail on use.
      // Best-effort: ignore.
      void w as unknown;
    }
    const toDelete = this.available.splice(0);
    for (const s of toDelete) {
      await this.deleteSessionBestEffort(s);
    }
    this.inUse.clear();
  }

  async warmup(signal: AbortSignal): Promise<void> {
    const target = SESSION_POOL_MIN_SIZE;
    if (target <= 0) return;
    while (!this.isClosed && this.totalSize() < target) {
      const s = await this.createAndAttachSession(signal);
      this.available.push({
        ...s,
        lastUsedAtMs: nowMs(),
        lastCheckedAtMs: 0,
      });
    }
  }

  async acquire(signal: AbortSignal): Promise<PooledQuerySession> {
    if (this.isClosed) {
      throw new Error("SessionPool is closed");
    }

    // Prefer an existing idle session.
    const existing = this.available.pop();
    if (existing) {
      this.inUse.add(existing.sessionId);
      existing.lastUsedAtMs = nowMs();
      return { nodeId: existing.nodeId, sessionId: existing.sessionId };
    }

    // Create a new one if we are under the max.
    if (this.totalSize() < SESSION_POOL_MAX_SIZE) {
      const created = await this.createAndAttachSession(signal);
      const internal: InternalSession = {
        ...created,
        lastUsedAtMs: nowMs(),
        lastCheckedAtMs: 0,
      };
      this.inUse.add(internal.sessionId);
      return { nodeId: internal.nodeId, sessionId: internal.sessionId };
    }

    // Otherwise, wait for a release.
    return await new Promise<PooledQuerySession>((resolve, reject) => {
      const onAbort = () => {
        cleanup();
        reject(new Error("SessionPool acquire aborted"));
      };
      const cleanup = () => {
        signal.removeEventListener("abort", onAbort);
      };
      if (signal.aborted) return onAbort();
      signal.addEventListener("abort", onAbort);
      this.waiters.push((s) => {
        cleanup();
        this.inUse.add(s.sessionId);
        s.lastUsedAtMs = nowMs();
        resolve({ nodeId: s.nodeId, sessionId: s.sessionId });
      });
    });
  }

  release(session: PooledQuerySession): void {
    if (!this.inUse.has(session.sessionId)) {
      return;
    }
    this.inUse.delete(session.sessionId);

    if (this.isClosed) {
      void this.deleteSessionBestEffort(session);
      return;
    }

    const internal: InternalSession = {
      ...session,
      lastUsedAtMs: nowMs(),
      lastCheckedAtMs: 0,
    };

    const waiter = this.waiters.shift();
    if (waiter) {
      waiter(internal);
      return;
    }

    this.available.push(internal);

    // Soft cap: if we exceed max (shouldn't happen), evict extras.
    while (
      this.totalSize() > SESSION_POOL_MAX_SIZE &&
      this.available.length > 0
    ) {
      const victim = this.available.shift();
      if (victim) {
        void this.deleteSessionBestEffort(victim);
      }
    }
  }

  async discard(session: PooledQuerySession): Promise<void> {
    this.inUse.delete(session.sessionId);
    await this.deleteSessionBestEffort(session);
  }

  private totalSize(): number {
    return this.available.length + this.inUse.size;
  }

  private async createAndAttachSession(
    signal: AbortSignal
  ): Promise<PooledQuerySession> {
    await this.driver.ready(signal);
    const client = this.driver.createClient(QueryServiceDefinition);
    const sessionResponse = await client.createSession({}, { signal });
    if (!isSuccessStatus(sessionResponse.status)) {
      throw new YDBError(sessionResponse.status, sessionResponse.issues);
    }
    const nodeId = sessionResponse.nodeId;
    const sessionId = sessionResponse.sessionId;

    const nodeClient = this.driver.createClient(QueryServiceDefinition, nodeId);
    const attachStream = nodeClient.attachSession({ sessionId }, { signal });
    const attach = attachStream[Symbol.asyncIterator]();
    const first = await attach.next();
    const attachResp = asAttachSessionResponse(first.value);
    const code = toStatusCode(attachResp.status);
    if (!isSuccessStatus(code)) {
      throw new YDBError(code, EMPTY_ISSUES);
    }

    return { nodeId, sessionId };
  }

  private async deleteSessionBestEffort(
    session: PooledQuerySession
  ): Promise<void> {
    try {
      const client = this.driver.createClient(
        QueryServiceDefinition,
        session.nodeId
      );
      await client.deleteSession(
        { sessionId: session.sessionId },
        { signal: AbortSignal.timeout(STARTUP_PROBE_SESSION_TIMEOUT_MS) }
      );
    } catch (err) {
      logger.warn({ err }, "SessionPool: failed to delete session (ignored)");
    }
  }

  private async keepaliveTick(): Promise<void> {
    if (this.isClosed) return;
    if (this.available.length === 0) return;

    // Probe at most one idle session per tick to bound overhead.
    const idx = this.available.reduce((best, cur, i, arr) => {
      const bestAt = arr[best]?.lastCheckedAtMs ?? 0;
      return cur.lastCheckedAtMs < bestAt ? i : best;
    }, 0);
    const s = this.available[idx];
    if (!s) return;

    const now = nowMs();
    if (now - s.lastCheckedAtMs < SESSION_KEEPALIVE_PERIOD_MS) {
      return;
    }
    s.lastCheckedAtMs = now;

    try {
      const signal = AbortSignal.timeout(STARTUP_PROBE_SESSION_TIMEOUT_MS);
      const client = this.driver.createClient(QueryServiceDefinition, s.nodeId);
      const attachStream = client.attachSession(
        { sessionId: s.sessionId },
        { signal }
      );
      const attach = attachStream[Symbol.asyncIterator]();
      const first = await attach.next();
      const attachResp = asAttachSessionResponse(first.value);
      const code = toStatusCode(attachResp.status);
      if (!isSuccessStatus(code)) {
        throw new YDBError(code, EMPTY_ISSUES);
      }
    } catch {
      // Session likely dead; evict from pool and delete best-effort.
      this.available.splice(idx, 1);
      void this.deleteSessionBestEffort(s);
    }
  }
}
