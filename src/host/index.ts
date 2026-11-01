/**
 * Host half of the Quick Note example: one JSON file, four routes, four tools.
 *
 * @module dsh-quicknote/host
 */
import { NAME } from "../shared/constants.ts";
import { resolveNotesFile } from "./paths.ts";
import { registerRoutes } from "./routes.ts";
import { createStore } from "./store.ts";
import { createTools } from "./tools.ts";

export const name = NAME;

export function apply(ctx: any): void {
  const store = createStore(resolveNotesFile(ctx));

  ctx.effect(() => {
    void store.list().catch((error: unknown) => {
      ctx.logger?.warn?.(`${NAME}: could not read notes: ${String(error)}`);
    });
  }, `${NAME}: warm the note store`);

  registerRoutes(ctx, store);

  ctx.inject(["tools"], (scope: any) => {
    for (const definition of createTools(store)) {
      scope.effect(() => scope.tools.register(definition), `${NAME}: tool ${definition.name}`);
    }
  });
}

export { createStore } from "./store.ts";
export { resolveNotesFile } from "./paths.ts";
