import http from "node:http";

import type { Express } from "express";

export type HttpResponse<T = unknown> = {
    body: T;
    headers: http.IncomingHttpHeaders;
    statusCode: number;
};

export type StartedHttpServer = {
    baseUrl: string;
    server: http.Server;
};

type RequestParams = {
    baseUrl: string;
    body?: unknown;
    headers?: Record<string, string>;
    method?: "DELETE" | "GET" | "OPTIONS" | "POST" | "PUT";
    path: string;
};

export async function startExpressServer(
    app: Express
): Promise<StartedHttpServer> {
    const server = http.createServer(app);
    await new Promise<void>((resolve) => {
        server.listen(0, "127.0.0.1", () => resolve());
    });

    const address = server.address();
    if (!address || typeof address === "string") {
        throw new Error("unexpected server address");
    }

    return {
        baseUrl: `http://127.0.0.1:${address.port}`,
        server,
    };
}

export async function closeHttpServer(server: http.Server): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
    });
}

function requestBodyAndHeaders(params: RequestParams): {
    body?: string;
    headers: Record<string, string>;
} {
    const body =
        params.body === undefined ? undefined : JSON.stringify(params.body);
    return {
        body,
        headers: {
            ...(params.headers ?? {}),
            ...(body
                ? {
                      "Content-Length": String(Buffer.byteLength(body)),
                      "Content-Type": "application/json",
                  }
                : {}),
        },
    };
}

async function requestRaw(params: RequestParams): Promise<{
    body: string;
    headers: http.IncomingHttpHeaders;
    statusCode: number;
}> {
    const { body, headers } = requestBodyAndHeaders(params);
    return await new Promise((resolve, reject) => {
        const req = http.request(
            new URL(params.path, params.baseUrl),
            {
                headers,
                method: params.method ?? "GET",
            },
            (res) => {
                const chunks: string[] = [];
                res.setEncoding("utf8");
                res.on("data", (chunk: string) => chunks.push(chunk));
                res.on("end", () => {
                    resolve({
                        body: chunks.join(""),
                        headers: res.headers,
                        statusCode: res.statusCode ?? 0,
                    });
                });
            }
        );

        req.on("error", reject);
        if (body) {
            req.write(body);
        }
        req.end();
    });
}

export async function requestJson<T = unknown>(
    params: RequestParams
): Promise<HttpResponse<T>> {
    const response = await requestRaw(params);
    const body =
        response.body.length > 0 ? (JSON.parse(response.body) as T) : (null as T);
    return {
        body,
        headers: response.headers,
        statusCode: response.statusCode,
    };
}

export async function requestText(
    params: RequestParams
): Promise<HttpResponse<string>> {
    const response = await requestRaw(params);
    return {
        body: response.body,
        headers: response.headers,
        statusCode: response.statusCode,
    };
}
