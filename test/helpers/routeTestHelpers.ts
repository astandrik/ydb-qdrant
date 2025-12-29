export type MockRequest = {
  method: "PUT" | "GET" | "POST" | "DELETE";
  params: { collection: string };
  body?: unknown;
  header: (name: string) => string | undefined;
};

export type MockBody = {
  status: string;
  result?: unknown;
  error?: unknown;
  message?: string;
};

export type MockResponse = {
  statusCode: number;
  body?: MockBody;
  headersSent?: boolean;
  writableEnded?: boolean;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => MockResponse;
};

export type RouteHandler = (req: MockRequest, res: MockResponse) => unknown;

export type Layer = {
  route?: {
    path?: string;
    methods?: Record<string, boolean>;
    stack?: Array<{ handle: unknown }>;
  };
};

export function findHandler(
  router: unknown,
  method: "get" | "put" | "post" | "delete",
  path: string
): RouteHandler {
  if (
    !router ||
    (typeof router !== "object" && typeof router !== "function")
  ) {
    throw new Error("Router is not an object");
  }
  const r = router as { stack?: unknown };
  if (!Array.isArray(r.stack)) {
    throw new Error("Router has no stack");
  }
  const stack = r.stack as Layer[];
  const layer = stack.find(
    (entry) => entry.route?.path === path && entry.route.methods?.[method]
  );
  const handle = layer?.route?.stack?.[0]?.handle;
  if (typeof handle !== "function") {
    throw new Error(
      `Route handler for ${method.toUpperCase()} ${path} not found`
    );
  }
  return handle as RouteHandler;
}

export function createMockRes(): MockResponse {
  const res: MockResponse = {
    statusCode: 200,
    headersSent: false,
    writableEnded: false,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      res.body = payload as MockBody;
      return res;
    },
  };
  return res;
}

export function createRequest(options: {
  method: "PUT" | "GET" | "POST" | "DELETE";
  collection: string;
  body?: unknown;
  tenantHeader?: string;
}): MockRequest {
  const { method, collection, body, tenantHeader } = options;
  const reqLike: MockRequest = {
    method,
    params: { collection },
    body,
    header(name: string) {
      if (name.toLowerCase() === "x-tenant-id") {
        return tenantHeader;
      }
      return undefined;
    },
  };
  return reqLike;
}
