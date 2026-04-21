import { AsyncLocalStorage } from "node:async_hooks";

export type RequestContext = {
    requestId: string;
    method: string;
    url: string;
    traceparent?: string;
    amznTraceId?: string;
    requestStartNs?: bigint;
};

const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(
    context: RequestContext,
    fn: () => T
): T {
    return requestContextStorage.run(context, fn);
}

export function getRequestContext(): RequestContext | undefined {
    return requestContextStorage.getStore();
}

export function getRequestContextLogFields():
    | Partial<RequestContext>
    | Record<string, never> {
    const context = getRequestContext();
    if (!context) {
        return {};
    }

    const { requestStartNs: _requestStartNs, ...publicFields } = context;
    void _requestStartNs;
    return publicFields;
}

export function getMonotonicTimeNs(): bigint {
    return process.hrtime.bigint();
}

export function elapsedMsBetween(startNs: bigint, endNs: bigint): number {
    return Number((endNs - startNs) / 1000000n);
}

export function elapsedMsSince(startNs: bigint): number {
    return elapsedMsBetween(startNs, getMonotonicTimeNs());
}

export function getRequestStartNs(): bigint | undefined {
    return getRequestContext()?.requestStartNs;
}

export function elapsedMsFromRequestStart(
    markNs: bigint | undefined
): number | undefined {
    const requestStartNs = getRequestStartNs();
    if (requestStartNs === undefined || markNs === undefined) {
        return undefined;
    }

    return elapsedMsBetween(requestStartNs, markNs);
}

export function getElapsedMsSinceRequestStart(): number | undefined {
    const requestStartNs = getRequestStartNs();
    if (requestStartNs === undefined) {
        return undefined;
    }

    return elapsedMsSince(requestStartNs);
}
