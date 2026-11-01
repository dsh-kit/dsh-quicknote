/**
 * Browser half of the Quick Note example. React is provided by DSH at runtime.
 *
 * @module dsh-quicknote/client
 */
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { API, NAME, NS } from "../shared/constants.ts";
import { ComposerButton } from "./ComposerButton.tsx";
import { Overlay } from "./Overlay.tsx";
import { setClientContext } from "./session.ts";

interface Note {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    headers: { "content-type": "application/json" },
    ...init,
  });
  const data = (await response.json()) as { ok: boolean; error?: string } & T;
  if (!response.ok || !data.ok) throw new Error(data.error ?? `request-failed-${response.status}`);
  return data;
}

function Icon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="none" aria-hidden="true">
      <rect x="2.75" y="2.75" width="10.5" height="10.5" rx="2" stroke="currentColor" />
      <path d="M5.5 8h5" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

function Page({ t }: { t: (key: string) => string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await request<{ notes: Note[] }>("/notes");
      setNotes(data.notes);
    } catch (cause) {
      setError(String((cause as Error).message));
    }
  }

  useEffect(() => {
    void load();
    const changed = () => void load();
    window.addEventListener("dsh-quicknote:changed", changed);
    return () => window.removeEventListener("dsh-quicknote:changed", changed);
  }, []);

  async function add(event: FormEvent) {
    event.preventDefault();
    if (text.trim() === "") return;
    try {
      await request("/notes/create", { method: "POST", body: JSON.stringify({ text }) });
      setText("");
      setError("");
      await load();
    } catch (cause) {
      setError(String((cause as Error).message));
    }
  }

  async function toggle(note: Note) {
    try {
      await request("/notes/update", {
        method: "POST",
        body: JSON.stringify({ id: note.id, done: !note.done }),
      });
      await load();
    } catch (cause) {
      setError(String((cause as Error).message));
    }
  }

  async function remove(note: Note) {
    try {
      await request("/notes/delete", { method: "POST", body: JSON.stringify({ id: note.id }) });
      await load();
    } catch (cause) {
      setError(String((cause as Error).message));
    }
  }

  return (
    <div style={{ padding: "24px 28px", maxWidth: 760, font: "inherit" }}>
      <h1 style={{ fontSize: 22, margin: 0 }}>{t("panel.title")}</h1>
      <p style={{ margin: "6px 0 18px", color: "var(--dsw-alias-label-secondary)" }}>
        {t("panel.body")}
      </p>
      <form onSubmit={add} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <textarea
          data-testid="note-input"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t("panel.placeholder")}
          rows={3}
          style={{
            flex: 1,
            resize: "vertical",
            padding: 10,
            borderRadius: 8,
            border: "1px solid var(--dsw-alias-line, #d9dce1)",
          }}
        />
        <button
          data-testid="note-add"
          type="submit"
          disabled={text.trim() === ""}
          style={{ padding: "9px 14px", borderRadius: 8 }}
        >
          {t("panel.add")}
        </button>
      </form>
      {error === "" ? null : (
        <p role="alert" style={{ color: "var(--dsw-alias-danger, #c0392b)" }}>
          {error}
        </p>
      )}
      {notes.length === 0 ? (
        <p style={{ marginTop: 24, color: "var(--dsw-alias-label-secondary)" }}>
          {t("panel.empty")}
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: "24px 0 0", display: "grid", gap: 8 }}>
          {notes.map((note) => (
            <li
              key={note.id}
              data-testid="note-item"
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                padding: 12,
                border: "1px solid var(--dsw-alias-line, #d9dce1)",
                borderRadius: 10,
              }}
            >
              <span
                style={{
                  flex: 1,
                  textDecoration: note.done ? "line-through" : "none",
                  opacity: note.done ? 0.6 : 1,
                }}
              >
                {note.text}
              </span>
              <button
                type="button"
                onClick={() => void toggle(note)}
                style={{ padding: "5px 9px", borderRadius: 7 }}
              >
                {note.done ? t("panel.reopen") : t("panel.done")}
              </button>
              <button
                type="button"
                onClick={() => void remove(note)}
                style={{ padding: "5px 9px", borderRadius: 7 }}
              >
                {t("panel.delete")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const name = NAME;
export const inject = ["slots", "locale"];

export function apply(ctx: any): void {
  setClientContext(ctx);
  ctx.effect(
    () =>
      ctx.locale.register(NS, {
        en: {
          "panel.title": "Quick Note",
          "panel.body": "Capture a note, mark it done, keep the list on one page.",
          "panel.placeholder": "Write a note…",
          "panel.add": "Add note",
          "panel.empty": "No notes yet.",
          "panel.done": "Done",
          "panel.reopen": "Reopen",
          "panel.delete": "Delete",
          "toolbar.capture": "Note",
          "overlay.title": "Save a quick note",
          "overlay.cancel": "Cancel",
          "overlay.save": "Save note",
          "overlay.saveClear": "Save and clear draft",
          "overlay.empty": "Nothing to save.",
        },
        zh: {
          "panel.title": "随手记",
          "panel.body": "记下一条笔记，标记完成，在一页里管理。",
          "panel.placeholder": "写一条笔记…",
          "panel.add": "添加",
          "panel.empty": "还没有笔记。",
          "panel.done": "完成",
          "panel.reopen": "重新打开",
          "panel.delete": "删除",
          "toolbar.capture": "记一下",
          "overlay.title": "保存随手记",
          "overlay.cancel": "取消",
          "overlay.save": "保存笔记",
          "overlay.saveClear": "保存并清空输入框",
          "overlay.empty": "没有可保存的内容。",
        },
      }),
    `${NAME}: dictionaries`,
  );

  ctx.slots.inject("sidebar.panellist", () =>
    ctx.slots.register(
      {
        name: "sidebar.panellist",
        id: NAME,
        order: 60,
        label: () => ctx.locale.bind(NS)("panel.title"),
        locale: NS,
      },
      Icon,
    ),
  );
  ctx.slots.inject("main", () => ctx.slots.register({ name: "main", key: NAME, locale: NS }, Page));

  ctx.slots.inject("conversation.input.left", () =>
    ctx.slots.register(
      { name: "conversation.input.left", id: "quicknote.toolbar", order: 10, locale: NS },
      ComposerButton,
    ),
  );
  ctx.slots.inject("shell.overlay", () =>
    ctx.slots.register(
      { name: "shell.overlay", id: "quicknote.overlay", order: 40, locale: NS },
      Overlay,
    ),
  );
}
