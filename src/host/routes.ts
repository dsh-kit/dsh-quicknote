import { API } from "../shared/constants.ts";

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function json(status: number, body: unknown): Response {
  return new Response(`${JSON.stringify(body)}\n`, {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

async function body(request: Request): Promise<any> {
  try {
    const value = await request.json();
    return value && typeof value === "object" ? value : {};
  } catch {
    throw new HttpError(400, "invalid-json");
  }
}

export function registerRoutes(
  ctx: any,
  store: ReturnType<typeof import("./store.ts").createStore>,
): void {
  ctx.inject(["connection"], (scope: any) => {
    const registry = scope.get("connection")?.fetch;
    if (typeof registry?.register !== "function") {
      ctx.logger?.warn?.("dsh-quicknote: no fetch registry; the page will not load notes");
      return;
    }
    const wrap = (handler: (request: Request) => Promise<Response>) => async (request: Request) => {
      try {
        return await handler(request);
      } catch (error) {
        const status = error instanceof HttpError ? error.status : 500;
        const reason =
          error instanceof HttpError ? error.message : String((error as Error)?.message ?? error);
        return json(status, { ok: false, error: reason });
      }
    };
    const routes = [
      {
        path: `${API}/notes`,
        methods: ["GET"],
        fetch: wrap(async () => json(200, { ok: true, notes: await store.list() })),
      },
      {
        path: `${API}/notes/create`,
        methods: ["POST"],
        fetch: wrap(async (request) =>
          json(200, { ok: true, note: await store.add((await body(request)).text) }),
        ),
      },
      {
        path: `${API}/notes/update`,
        methods: ["POST"],
        fetch: wrap(async (request) => {
          const input = await body(request);
          const note = await store.update(input.id, input.done === true);
          return note
            ? json(200, { ok: true, note })
            : json(404, { ok: false, error: "unknown-note" });
        }),
      },
      {
        path: `${API}/notes/delete`,
        methods: ["POST"],
        fetch: wrap(async (request) =>
          json(200, { ok: true, removed: await store.remove((await body(request)).id) }),
        ),
      },
    ];
    for (const route of routes) {
      scope.effect(
        () =>
          registry.register({
            path: route.path,
            methods: route.methods,
            requestBody: "buffered",
            fetch: route.fetch,
          }),
        `dsh-quicknote: ${route.path}`,
      );
    }
  });
}
