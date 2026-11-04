import { NAME } from "../shared/constants.ts";

/** Access to the per-Session composer owned by the conversation service. */
let clientCtx: any = null;

export function setClientContext(ctx: any): void {
  clientCtx = ctx;
}

/**
 * Read an optional client service. Cordis throws on `ctx.<service>` for a
 * service the plugin did not declare in `inject`, while `ctx.get(name)`
 * returns `undefined` instead — so resolve through `get` first and keep the
 * property path only as a fallback for older shells.
 */
function service(name: string): any {
  try {
    const resolved = clientCtx?.get?.(name);
    if (resolved !== undefined) return resolved;
  } catch {
    // Fall back to the property below.
  }
  try {
    return clientCtx?.[name];
  } catch {
    return undefined;
  }
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
    const input = service("conversation")?.input;
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

/**
 * The Session the main column points at, even while a global panel covers it.
 * The shell unmounts the Conversation for a panel, so the DOM carries no
 * `data-conversation-session`; the workspace selection and the retained
 * main-view reference still name it.
 */
export function mainSessionId(): string | undefined {
  try {
    const selected = service("uiWorkspace")?.selection?.getSnapshot?.()?.sessionId;
    if (typeof selected === "string" && selected !== "") return selected;
  } catch {
    // An older shell may not expose uiWorkspace; try the retention snapshot.
  }
  try {
    const byId = service("sessions")?.list?.getSnapshot?.()?.byId ?? {};
    for (const row of Object.values(byId) as Array<{
      id?: unknown;
      retainedBy?: { mainView?: number };
    }>) {
      if ((row?.retainedBy?.mainView ?? 0) > 0 && typeof row?.id === "string" && row.id !== "") {
        return row.id;
      }
    }
  } catch {
    // No Session is known yet.
  }
  return undefined;
}

/** The composer to act on: the focused one, else the Session the main column retained. */
export function targetSessionId(): string | undefined {
  return focusedSessionId() ?? mainSessionId();
}

/** Insert a note into the active draft, preserving anything already typed. */
export function insertIntoComposer(text: string): boolean {
  const sessionId = targetSessionId();
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
    const row = service("sessions")?.list?.getSnapshot?.()?.byId?.[sessionId];
    return {
      sessionId,
      title: typeof row?.title === "string" ? row.title : "",
    };
  } catch {
    return { sessionId, title: "" };
  }
}

/** Show the notes page in the main column; false when the shell has no layout. */
export function openPanel(): boolean {
  try {
    const layout = service("layout");
    if (typeof layout?.selectPanel !== "function") return false;
    layout.selectPanel(NAME);
    return true;
  } catch {
    return false;
  }
}

/** Return the main column to the Conversation; false when the shell has no layout. */
export function showConversation(): boolean {
  try {
    const layout = service("layout");
    if (typeof layout?.selectPanel !== "function") return false;
    layout.selectPanel(null);
    return true;
  } catch {
    return false;
  }
}

/** Open the capture card for the active composer. */
export function openCapture(): void {
  const sessionId = focusedSessionId();
  window.dispatchEvent(
    new CustomEvent("dsh-quicknote:open", { detail: { sessionId, text: draftOf(sessionId) } }),
  );
}
