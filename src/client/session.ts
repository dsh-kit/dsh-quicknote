import { NAME } from "../shared/constants.ts";

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

/** The composer the user is most likely writing in. */
export function focusedSessionId(): string | undefined {
  try {
    const fromFocus = sessionIdNear(document.activeElement);
    if (fromFocus !== undefined) return fromFocus;
  } catch {
    // Fall back to a mounted conversation below.
  }
  try {
    const mounted = document.querySelector("[data-conversation-session]");
    return sessionIdNear(mounted);
  } catch {
    return undefined;
  }
}

/** Insert a note into the active draft, preserving anything already typed. */
export function insertIntoComposer(text: string): boolean {
  const sessionId = focusedSessionId();
  const composer = composerOf(sessionId);
  if (!composer || !sessionId) return false;
  try {
    const current = draftOf(sessionId);
    const next = current.trim() === "" ? text : `${current.replace(/\s+$/, "")}\n\n${text}`;
    composer.actions.setDraft(next);
    return true;
  } catch {
    return false;
  }
}

/** Provenance for a note captured from a Session. */
export function originOf(sessionId: string | undefined): { sessionId: string; title: string } {
  if (!sessionId) return { sessionId: "", title: "" };
  try {
    const row = clientCtx?.sessions?.list?.getSnapshot?.()?.byId?.[sessionId];
    return {
      sessionId,
      title: typeof row?.title === "string" ? row.title : "",
    };
  } catch {
    return { sessionId, title: "" };
  }
}

/** Show the notes page in the main column. */
export function openPanel(): void {
  try {
    clientCtx?.layout?.selectPanel?.(NAME);
  } catch {
    // The layout service is optional during early boot.
  }
}
