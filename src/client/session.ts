/** Access to the per-Session composer owned by the conversation service. */
let clientCtx: any = null;

export function setClientContext(ctx: any): void {
  clientCtx = ctx;
}

export function sessionIdNear(node: any): string | undefined {
  try {
    const owner =
      typeof node?.closest === "function" ? node.closest("[data-conversation-session]") : null;
    const id = owner?.getAttribute("data-conversation-session");
    return typeof id === "string" && id !== "" ? id : undefined;
  } catch {
    return undefined;
  }
}

export function composerOf(sessionId: string | undefined) {
  if (sessionId === undefined) return undefined;
  try {
    const input = clientCtx?.get("conversation")?.input;
    if (typeof input?.shell !== "function") return undefined;
    const shell = input.shell(sessionId);
    if (!shell?.state || !shell?.actions) return undefined;
    return shell;
  } catch {
    return undefined;
  }
}

export function draftOf(sessionId: string | undefined): string {
  try {
    return String(composerOf(sessionId)?.state.getSnapshot().draft ?? "");
  } catch {
    return "";
  }
}
