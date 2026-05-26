import { readSessionCookie } from "./auth.js";
import type {
    CodeIndexerInstallationRecord,
    CodeIndexerRepositoryRecord,
    CodeIndexerSession,
    StoredGitHubUser,
} from "./saasStore.js";

export type CodeIndexerAccessStore = {
    getGitHubUser(githubUserId: number | string): Promise<StoredGitHubUser | null>;
    getRepository(
        repoId: number | string
    ): Promise<CodeIndexerRepositoryRecord | null>;
    getSession(sessionId: string): Promise<CodeIndexerSession | null>;
    listInstallationsForUser(
        githubUserId: number | string
    ): Promise<CodeIndexerInstallationRecord[]>;
};

export type CodeIndexerAccessContext = {
    sessionId: string;
    user: {
        githubUserId: string;
        login: string;
    };
};

export class CodeIndexerAccessError extends Error {
    readonly code: string;
    readonly statusCode: number;

    constructor(params: { code: string; message: string; statusCode: number }) {
        super(params.message);
        this.name = "CodeIndexerAccessError";
        this.code = params.code;
        this.statusCode = params.statusCode;
    }
}

function accessError(
    code: string,
    message: string,
    statusCode: number
): CodeIndexerAccessError {
    return new CodeIndexerAccessError({ code, message, statusCode });
}

function isActiveInstallation(
    installation: CodeIndexerInstallationRecord
): boolean {
    return installation.status === "active";
}

export async function resolveDashboardSession(params: {
    cookieHeader?: string;
    store: CodeIndexerAccessStore;
}): Promise<CodeIndexerAccessContext> {
    const sessionId = readSessionCookie(params.cookieHeader);
    if (!sessionId) {
        throw accessError("unauthenticated", "unauthenticated", 401);
    }
    const session = await params.store.getSession(sessionId);
    if (!session) {
        throw accessError("unauthenticated", "unauthenticated", 401);
    }
    const user = await params.store.getGitHubUser(session.githubUserId);
    if (!user) {
        throw accessError("unauthenticated", "unauthenticated", 401);
    }
    return {
        sessionId,
        user: {
            githubUserId: user.githubUserId,
            login: user.login,
        },
    };
}

export async function requireInstallationAccess(params: {
    context: CodeIndexerAccessContext;
    installationId: number | string;
    store: CodeIndexerAccessStore;
}): Promise<CodeIndexerInstallationRecord> {
    const installationId = String(params.installationId);
    const installations = await params.store.listInstallationsForUser(
        params.context.user.githubUserId
    );
    const installation = installations.find(
        (candidate) =>
            candidate.installationId === installationId &&
            isActiveInstallation(candidate)
    );
    if (!installation) {
        throw accessError(
            "github_installation_forbidden",
            "installation is not accessible to the authenticated user",
            403
        );
    }
    return installation;
}

export async function requireRepositoryAccess(params: {
    context: CodeIndexerAccessContext;
    repoId: number | string;
    store: CodeIndexerAccessStore;
}): Promise<CodeIndexerRepositoryRecord> {
    const repository = await params.store.getRepository(params.repoId);
    if (!repository) {
        throw accessError(
            "github_repository_forbidden",
            "repository is not accessible to the authenticated user",
            403
        );
    }
    const installations = await params.store.listInstallationsForUser(
        params.context.user.githubUserId
    );
    const hasAccess = installations.some(
        (installation) =>
            installation.installationId === repository.installationId &&
            isActiveInstallation(installation)
    );
    if (!hasAccess) {
        throw accessError(
            "github_repository_forbidden",
            "repository is not accessible to the authenticated user",
            403
        );
    }
    return repository;
}
