export function expandPathPrefixes(pathPrefix: string): string[] {
    if (pathPrefix === "") {
        return [];
    }

    const parts = pathPrefix.split("/");
    const prefixes: string[] = [];

    for (let index = 1; index <= parts.length; index += 1) {
        prefixes.push(parts.slice(0, index).join("/"));
    }

    return prefixes;
}
