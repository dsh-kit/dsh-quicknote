import { homedir } from "node:os";
import { join } from "node:path";

/** Keep the example's data separate from other plugins. */
export function resolveNotesFile(ctx: any): string {
  try {
    const dshHomePath = typeof ctx.get === "function" ? ctx.get("dshHomePath") : undefined;
    if (typeof dshHomePath === "function") {
      const dir = dshHomePath("quicknote");
      if (typeof dir === "string" && dir !== "") return join(dir, "notes.json");
    }
  } catch {
    // Older compositions do not expose the service.
  }
  const home = (process.env.DSH_HOME ?? "").trim() || join(homedir(), ".dsh");
  return join(home, "quicknote", "notes.json");
}
