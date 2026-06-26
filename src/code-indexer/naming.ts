import { createHash } from "node:crypto";

import type { IndexedCodeChunk } from "./types.js";

export type CodeChunkPointIdentity = {
    blobSha: string;
    chunkIndex: number;
    path: string;
    ref: string;
    repoId: number;
};

function sanitizeIdentifier(value: string): string {
    const cleaned = value.replace(/[^a-zA-Z0-9_]/g, "_").replace(/_+/g, "_");
    const lowered = cleaned.toLowerCase().replace(/^_+|_+$/g, "");
    return lowered.length > 0 ? lowered : "index";
}

export function userUidForInstallation(installationId: number): string {
    return sanitizeIdentifier(`gh_installation_${installationId}`);
}

export function defaultBranchCollectionForRepo(repoId: number): string {
    return sanitizeIdentifier(`gh_repo_${repoId}_default`);
}

export function repoCollectionPrefixForRepo(repoId: number): string {
    return `${sanitizeIdentifier(`gh_repo_${repoId}`)}_`;
}

export function pullRequestCollectionForRepo(
    repoId: number,
    prNumber: number
): string {
    return sanitizeIdentifier(`gh_repo_${repoId}_pr_${prNumber}`);
}

export function pathSegmentsForPath(path: string): string[] {
    return path.split("/").filter((segment) => segment.length > 0);
}

export function pointIdForChunkIdentity(identity: CodeChunkPointIdentity): string {
    return createHash("sha256")
        .update(String(identity.repoId))
        .update("\0")
        .update(identity.ref)
        .update("\0")
        .update(identity.path)
        .update("\0")
        .update(identity.blobSha)
        .update("\0")
        .update(String(identity.chunkIndex))
        .digest("hex");
}

export function pointIdForChunk(chunk: IndexedCodeChunk): string {
    return pointIdForChunkIdentity(chunk);
}

export function branchNameFromRef(ref: string): string | null {
    const prefix = "refs/heads/";
    if (!ref.startsWith(prefix)) {
        return null;
    }
    const branch = ref.slice(prefix.length);
    return branch.length > 0 ? branch : null;
}

export function isAllZeroSha(sha: string): boolean {
    return /^0+$/.test(sha);
}
