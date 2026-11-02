/**
 * Browser half of the Quick Note example. React is provided by DSH at runtime.
 *
 * @module dsh-quicknote/client
 */
import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent } from "react";

import { API, NAME, NS } from "../shared/constants.ts";
import { ComposerButton } from "./ComposerButton.tsx";
import { Overlay } from "./Overlay.tsx";
import { insertIntoComposer, setClientContext } from "./session.ts";

interface Note {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
  origin?: { sessionId: string; title: string };
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
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
      <rect x="4" y="3.5" width="16" height="17" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M8 8h8M8 12h8M8 16h5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function formatTime(value: number): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const clock = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  if (date.toDateString() === now.toDateString()) return clock;
  const monthDay = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return date.getFullYear() === now.getFullYear()
    ? `${monthDay} ${clock}`
    : `${date.getFullYear()}-${monthDay}`;
}

type Filter = "all" | "open" | "done";

const border = "1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24))";
const controlStyle: CSSProperties = {
  padding: "5px 9px",
  borderRadius: 7,
  border,
  background: "var(--dsw-alias-bg-layer-1, transparent)",
  color: "var(--dsw-alias-label-primary, inherit)",
  font: "inherit",
  cursor: "pointer",
};

function Page({ t }: { t: (key: string) => string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

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

  useEffect(() => {
    if (notice === "") return;
    const timer = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

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

  async function copy(note: Note) {
    try {
      await navigator.clipboard.writeText(note.text);
      setNotice(t("panel.copied"));
    } catch {
      setError(t("panel.copyFailed"));
    }
  }

  function insert(note: Note) {
    setNotice(insertIntoComposer(note.text) ? t("panel.inserted") : t("panel.insertUnavailable"));
  }

  const needle = query.trim().toLowerCase();
  const counts = {
    all: notes.length,
    open: notes.filter((note) => !note.done).length,
    done: notes.filter((note) => note.done).length,
  };
  const visible = notes.filter((note) => {
    if (filter === "open" && note.done) return false;
    if (filter === "done" && !note.done) return false;
    if (needle === "") return true;
    return note.text.toLowerCase().includes(needle);
  });

  return (
    <div
      style={{
        boxSizing: "border-box",
        minHeight: "100%",
        padding: "24px 28px",
        maxWidth: 760,
        background: "var(--dsw-alias-bg-base, transparent)",
        color: "var(--dsw-alias-label-primary, inherit)",
        colorScheme: "light dark",
      }}
    >
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
            border,
            background: "var(--dsw-alias-bg-layer-1, transparent)",
            color: "var(--dsw-alias-label-primary, inherit)",
            colorScheme: "light dark",
            font: "inherit",
          }}
        />
        <button
          data-testid="note-add"
          type="submit"
          disabled={text.trim() === ""}
          style={{
            padding: "9px 14px",
            borderRadius: 8,
            border,
            background: "var(--dsw-alias-bg-layer-1, transparent)",
            color: "var(--dsw-alias-label-primary, inherit)",
            font: "inherit",
            cursor: text.trim() === "" ? "default" : "pointer",
            opacity: text.trim() === "" ? 0.5 : 1,
          }}
        >
          {t("panel.add")}
        </button>
      </form>
      {notes.length === 0 ? null : (
        <div
          style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 14 }}
        >
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(
              [
                ["all", "panel.filterAll"],
                ["open", "panel.filterOpen"],
                ["done", "panel.filterDone"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
                style={{
                  ...controlStyle,
                  borderColor:
                    filter === id
                      ? "var(--dsw-alias-brand-primary, currentColor)"
                      : "var(--dsw-alias-border-l1, rgba(127,127,127,.24))",
                  color:
                    filter === id
                      ? "var(--dsw-alias-brand-primary, currentColor)"
                      : "var(--dsw-alias-label-secondary, inherit)",
                }}
              >
                {t(label)} {counts[id]}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("panel.search")}
            aria-label={t("panel.search")}
            style={{
              flex: 1,
              minWidth: 160,
              padding: "5px 9px",
              borderRadius: 7,
              border,
              background: "var(--dsw-alias-bg-layer-1, transparent)",
              color: "var(--dsw-alias-label-primary, inherit)",
              font: "inherit",
            }}
          />
        </div>
      )}
      {error === "" ? null : (
        <p role="alert" style={{ color: "var(--dsw-alias-state-error-primary, #c0392b)" }}>
          {error}
        </p>
      )}
      {notice === "" ? null : (
        <p role="status" style={{ color: "var(--dsw-alias-label-secondary)", margin: "8px 0 0" }}>
          {notice}
        </p>
      )}
      {notes.length === 0 ? (
        <p style={{ marginTop: 24, color: "var(--dsw-alias-label-secondary)" }}>
          {t("panel.empty")}
        </p>
      ) : visible.length === 0 ? (
        <p style={{ marginTop: 24, color: "var(--dsw-alias-label-secondary)" }}>
          {t("panel.noMatches")}
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: "24px 0 0", display: "grid", gap: 8 }}>
          {visible.map((note) => (
            <li
              key={note.id}
              data-testid="note-item"
              style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
                padding: 12,
                border,
                borderRadius: 10,
                background: "var(--dsw-alias-bg-layer-1, transparent)",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    textDecoration: note.done ? "line-through" : "none",
                    opacity: note.done ? 0.6 : 1,
                  }}
                >
                  {note.text}
                </div>
                <div
                  style={{ marginTop: 4, fontSize: 11, color: "var(--dsw-alias-label-tertiary)" }}
                >
                  <time dateTime={new Date(note.createdAt).toISOString()}>
                    {formatTime(note.createdAt)}
                  </time>
                  {note.origin?.title ? ` · ${note.origin.title}` : ""}
                </div>
              </div>
              <div
                style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}
              >
                <button type="button" onClick={() => void copy(note)} style={controlStyle}>
                  {t("panel.copy")}
                </button>
                <button type="button" onClick={() => insert(note)} style={controlStyle}>
                  {t("panel.insert")}
                </button>
                <button type="button" onClick={() => void toggle(note)} style={controlStyle}>
                  {note.done ? t("panel.reopen") : t("panel.done")}
                </button>
                <button type="button" onClick={() => void remove(note)} style={controlStyle}>
                  {t("panel.delete")}
                </button>
              </div>
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
          "panel.noMatches": "No matching notes.",
          "panel.search": "Search notes",
          "panel.filterAll": "All",
          "panel.filterOpen": "Open",
          "panel.filterDone": "Done",
          "panel.copy": "Copy",
          "panel.copied": "Copied.",
          "panel.copyFailed": "Could not copy this note.",
          "panel.insert": "Insert",
          "panel.inserted": "Inserted into the draft.",
          "panel.insertUnavailable": "No composer is open.",
          "panel.done": "Done",
          "panel.reopen": "Reopen",
          "panel.delete": "Delete",
          "panel.deleted": "Note deleted.",
          "panel.completed": "Note updated.",
          "panel.undo": "Undo",
          "toolbar.capture": "Quick Note",
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
          "panel.noMatches": "没有匹配的笔记。",
          "panel.search": "搜索笔记",
          "panel.filterAll": "全部",
          "panel.filterOpen": "未完成",
          "panel.filterDone": "已完成",
          "panel.copy": "复制",
          "panel.copied": "已复制。",
          "panel.copyFailed": "复制失败。",
          "panel.insert": "插入",
          "panel.inserted": "已插入草稿。",
          "panel.insertUnavailable": "当前没有可用的输入框。",
          "panel.done": "完成",
          "panel.reopen": "重新打开",
          "panel.delete": "删除",
          "panel.deleted": "笔记已删除。",
          "panel.completed": "笔记已更新。",
          "panel.undo": "撤销",
          "toolbar.capture": "随手记",
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
