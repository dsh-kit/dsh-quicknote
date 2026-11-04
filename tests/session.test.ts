// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";

import {
  insertIntoComposer,
  mainSessionId,
  openPanel,
  originOf,
  setClientContext,
  showConversation,
  targetSessionId,
} from "../src/client/session.ts";

interface Row {
  id: string;
  title?: string;
  retainedBy?: { mainView?: number };
}

function fakeContext(options: {
  drafts?: Record<string, string>;
  selection?: { sessionId?: string };
  rows?: Record<string, Row>;
}) {
  const drafts = options.drafts ?? {};
  const sessions = { list: { getSnapshot: () => ({ byId: options.rows ?? {} }) } };
  return {
    get(name: string) {
      if (name === "sessions") return sessions;
      if (name === "conversation") {
        return {
          input: {
            shell: (sessionId: string) => ({
              state: { getSnapshot: () => ({ draft: drafts[sessionId] ?? "" }) },
              actions: {
                setDraft: (next: string) => {
                  drafts[sessionId] = next;
                },
              },
            }),
          },
        };
      }
      if (name === "uiWorkspace" && options.selection !== undefined) {
        return { selection: { getSnapshot: () => options.selection } };
      }
      return undefined;
    },
  };
}

afterEach(() => {
  setClientContext(null);
  document.body.innerHTML = "";
});

describe("quicknote composer targeting", () => {
  it("inserts into the selected Session while a panel covers the conversation", () => {
    const drafts: Record<string, string> = {};
    setClientContext(
      fakeContext({
        drafts,
        selection: { sessionId: "session-1" },
        rows: { "session-1": { id: "session-1", retainedBy: { mainView: 1 } } },
      }),
    );

    expect(insertIntoComposer("a note")).toBe(true);
    expect(drafts["session-1"]).toBe("a note");
  });

  it("falls back to the retained main-view Session when no selection is exposed", () => {
    const drafts: Record<string, string> = {};
    setClientContext(
      fakeContext({
        drafts,
        rows: {
          other: { id: "other" },
          "session-2": { id: "session-2", retainedBy: { mainView: 1 } },
        },
      }),
    );

    expect(mainSessionId()).toBe("session-2");
    expect(insertIntoComposer("a note")).toBe(true);
    expect(drafts["session-2"]).toBe("a note");
  });

  it("appends to the draft that is already there", () => {
    const drafts = { "session-1": "typed already" };
    setClientContext(fakeContext({ drafts, selection: { sessionId: "session-1" } }));

    expect(insertIntoComposer("a note")).toBe(true);
    expect(drafts["session-1"]).toBe("typed already\n\na note");
  });

  it("prefers a focused composer over the workspace selection", () => {
    const drafts: Record<string, string> = {};
    setClientContext(fakeContext({ drafts, selection: { sessionId: "session-1" } }));

    const host = document.createElement("div");
    host.setAttribute("data-conversation-session", "session-9");
    const button = document.createElement("button");
    host.append(button);
    document.body.append(host);
    button.focus();

    expect(targetSessionId()).toBe("session-9");
    expect(insertIntoComposer("a note")).toBe(true);
    expect(drafts["session-9"]).toBe("a note");
    expect(drafts["session-1"]).toBeUndefined();
  });

  it("reports no composer when no Session is known", () => {
    setClientContext(fakeContext({}));
    expect(mainSessionId()).toBeUndefined();
    expect(insertIntoComposer("a note")).toBe(false);
  });

  it("reads the captured Session title through the service accessor", () => {
    setClientContext(
      fakeContext({ rows: { "session-1": { id: "session-1", title: "Planning" } } }),
    );
    expect(originOf("session-1")).toEqual({ sessionId: "session-1", title: "Planning" });
  });
});

describe("quicknote panel routing", () => {
  it("opens the notes page through ctx.get, as a plugin without the inject must", () => {
    const panels: unknown[] = [];
    setClientContext({
      get: (name: string) =>
        name === "layout" ? { selectPanel: (id: string) => panels.push(id) } : undefined,
    });

    expect(openPanel()).toBe(true);
    expect(panels).toEqual(["dsh-quicknote"]);
  });

  it("keeps a property path for shells without get", () => {
    const panels: unknown[] = [];
    setClientContext({ layout: { selectPanel: (id: string) => panels.push(id) } });

    expect(openPanel()).toBe(true);
    expect(panels).toEqual(["dsh-quicknote"]);
  });

  it("reports a failure instead of throwing when the layout is absent", () => {
    setClientContext({ get: () => undefined });
    expect(openPanel()).toBe(false);
    expect(showConversation()).toBe(false);
  });

  it("returns to the Conversation by clearing the panel selection", () => {
    const panels: unknown[] = [];
    setClientContext({
      get: (name: string) =>
        name === "layout" ? { selectPanel: (id: string | null) => panels.push(id) } : undefined,
    });

    expect(showConversation()).toBe(true);
    expect(panels).toEqual([null]);
  });
});
