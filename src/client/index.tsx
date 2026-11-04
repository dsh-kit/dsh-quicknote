/**
 * Browser half of the Quick Note example. React is provided by DSH at runtime.
 *
 * @module dsh-quicknote/client
 */
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import { API, NAME, NS } from "../shared/constants.ts";
import { ComposerButton } from "./ComposerButton.tsx";
import { collectTags, extractTags, filterNotes, formatTime, notesToMarkdown } from "./notes.ts";
import type { Filter, Note } from "./notes.ts";
import { Overlay } from "./Overlay.tsx";
import {
  focusedSessionId,
  insertIntoComposer,
  openCapture,
  originOf,
  setClientContext,
} from "./session.ts";
import { ParkedBar } from "./ParkedBar.tsx";
import { PAGE_CSS } from "./styles.ts";

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

const UNDO_WINDOW = 8_000;

function previewOf(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > 80 ? `${flat.slice(0, 80)}…` : flat;
}

function Page({ t }: { t: (key: string) => string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [tag, setTag] = useState<string | null>(null);
  const [undo, setUndo] = useState<Note[]>([]);

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

  useEffect(() => {
    if (undo.length === 0) return;
    const timer = window.setTimeout(() => setUndo([]), UNDO_WINDOW);
    return () => window.clearTimeout(timer);
  }, [undo]);

  async function add(event: FormEvent) {
    event.preventDefault();
    if (text.trim() === "") return;
    try {
      await request("/notes/create", {
        method: "POST",
        body: JSON.stringify({ text, origin: originOf(focusedSessionId()) }),
      });
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
      const data = await request<{ note: Note | null }>("/notes/delete", {
        method: "POST",
        body: JSON.stringify({ id: note.id }),
      });
      const removed = data.note;
      if (removed) setUndo((current) => [...current, removed]);
      setError("");
      await load();
    } catch (cause) {
      setError(String((cause as Error).message));
    }
  }

  async function undoDelete() {
    if (undo.length === 0) return;
    try {
      await Promise.all(
        undo.map((note) =>
          request("/notes/restore", {
            method: "POST",
            body: JSON.stringify({ note }),
          }),
        ),
      );
      setNotice(t(undo.length > 1 ? "panel.deletesUndone" : "panel.deleteUndone"));
      setUndo([]);
      setError("");
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

  const tags = useMemo(() => collectTags(notes), [notes]);
  useEffect(() => {
    if (tag === null) return;
    const wanted = tag.toLowerCase();
    if (!tags.some((entry) => entry.tag.toLowerCase() === wanted)) setTag(null);
  }, [tag, tags]);

  const needle = query.trim().toLowerCase();
  const counts = {
    all: notes.length,
    open: notes.filter((note) => !note.done).length,
    done: notes.filter((note) => note.done).length,
  };
  const visible = filterNotes(notes, { filter, query: needle, tag });

  function activateTag(next: string) {
    setTag((current) => (current?.toLowerCase() === next.toLowerCase() ? null : next));
  }

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(notesToMarkdown(visible, t("panel.title")));
      setNotice(t("panel.copyAllDone"));
    } catch {
      setError(t("panel.copyFailed"));
    }
  }

  return (
    <>
      <style data-dsh-quicknote="">{PAGE_CSS}</style>
      <div className="qn-page">
        <h1 className="qn-title">{t("panel.title")}</h1>
        <p className="qn-lede">{t("panel.body")}</p>
        <form className="qn-compose" onSubmit={add}>
          <textarea
            data-testid="note-input"
            className="qn-textarea"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t("panel.placeholder")}
            rows={3}
          />
          <button
            data-testid="note-add"
            className="qn-button qn-primary"
            type="submit"
            disabled={text.trim() === ""}
          >
            {t("panel.add")}
          </button>
        </form>
        {notes.length === 0 ? null : (
          <>
            <div className="qn-toolbar">
              <div className="qn-filters" role="group" aria-label={t("panel.filters")}>
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
                    className="qn-button"
                    aria-pressed={filter === id}
                    onClick={() => setFilter(id)}
                  >
                    {t(label)} {counts[id]}
                  </button>
                ))}
              </div>
              <input
                type="search"
                className="qn-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("panel.search")}
                aria-label={t("panel.search")}
              />
              <button
                type="button"
                className="qn-button"
                onClick={() => void copyAll()}
                disabled={visible.length === 0}
              >
                {t("panel.copyAll")}
              </button>
            </div>
            {tags.length === 0 ? null : (
              <div className="qn-tags" role="group" aria-label={t("panel.tags")}>
                <span className="qn-tags-label">{t("panel.tags")}</span>
                <button
                  type="button"
                  className="qn-button qn-tag"
                  aria-pressed={tag === null}
                  onClick={() => setTag(null)}
                >
                  {t("panel.allTags")}
                </button>
                {tags.map((entry) => (
                  <button
                    key={entry.tag.toLowerCase()}
                    type="button"
                    className="qn-button qn-tag"
                    aria-pressed={tag?.toLowerCase() === entry.tag.toLowerCase()}
                    onClick={() => activateTag(entry.tag)}
                  >
                    #{entry.tag} {entry.count}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        {error === "" ? null : (
          <p role="alert" className="qn-alert">
            {error}
          </p>
        )}
        {notice === "" ? null : (
          <p role="status" className="qn-status">
            {notice}
          </p>
        )}
        {notes.length === 0 ? (
          <p className="qn-empty">{t("panel.empty")}</p>
        ) : visible.length === 0 ? (
          <p className="qn-empty">{t("panel.noMatches")}</p>
        ) : (
          <ul className="qn-list">
            {visible.map((note) => {
              const noteTags = extractTags(note.text);
              return (
                <li key={note.id} data-testid="note-item" className="qn-note">
                  <div className="qn-note-body">
                    <p className={`qn-note-text${note.done ? " qn-note-text-done" : ""}`}>
                      {note.text}
                    </p>
                    {noteTags.length === 0 ? null : (
                      <div className="qn-note-tags">
                        {noteTags.map((label) => (
                          <button
                            key={label.toLowerCase()}
                            type="button"
                            className="qn-button qn-tag"
                            aria-pressed={tag?.toLowerCase() === label.toLowerCase()}
                            onClick={() => activateTag(label)}
                          >
                            #{label}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="qn-note-meta">
                      <time dateTime={new Date(note.createdAt).toISOString()}>
                        {formatTime(note.createdAt)}
                      </time>
                      {note.origin?.title ? ` · ${note.origin.title}` : ""}
                    </div>
                  </div>
                  <div className="qn-note-actions">
                    <button type="button" className="qn-button" onClick={() => void copy(note)}>
                      {t("panel.copy")}
                    </button>
                    <button type="button" className="qn-button" onClick={() => insert(note)}>
                      {t("panel.insert")}
                    </button>
                    <button type="button" className="qn-button" onClick={() => void toggle(note)}>
                      {note.done ? t("panel.reopen") : t("panel.done")}
                    </button>
                    <button
                      type="button"
                      className="qn-button"
                      title={t("panel.deleteHint")}
                      onClick={() => void remove(note)}
                    >
                      {t("panel.delete")}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {undo.length === 0 ? null : (
          <div className="qn-toast" role="status" aria-live="polite">
            <span className="qn-toast-text">
              {undo.length === 1
                ? t("panel.deleted")
                : t("panel.deletedCount").replace("{count}", String(undo.length))}{" "}
              {previewOf(undo[undo.length - 1].text)}
            </span>
            <div className="qn-toast-actions">
              <button type="button" className="qn-button" onClick={() => void undoDelete()}>
                {undo.length > 1 ? t("panel.undoAll") : t("panel.undo")}
              </button>
              <button
                type="button"
                className="qn-button"
                aria-label={t("panel.dismiss")}
                onClick={() => setUndo([])}
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </>
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
          "panel.placeholder": "Write a note… Use #tags to group it.",
          "panel.add": "Add note",
          "panel.empty": "No notes yet.",
          "panel.noMatches": "No matching notes.",
          "panel.search": "Search notes",
          "panel.filters": "Filter notes",
          "panel.tags": "Tags",
          "panel.allTags": "All tags",
          "panel.filterAll": "All",
          "panel.filterOpen": "Open",
          "panel.filterDone": "Done",
          "panel.copy": "Copy",
          "panel.copied": "Copied.",
          "panel.copyFailed": "Could not copy this note.",
          "panel.copyAll": "Copy all",
          "panel.copyAllDone": "Copied the visible notes as Markdown.",
          "panel.insert": "Insert",
          "panel.inserted": "Inserted into the draft.",
          "panel.insertUnavailable": "No composer is open.",
          "panel.done": "Done",
          "panel.reopen": "Reopen",
          "panel.delete": "Delete",
          "panel.deleteHint": "Delete this note. You can undo it right after.",
          "panel.deleted": "Note deleted.",
          "panel.deletedCount": "Deleted {count} notes.",
          "panel.deleteUndone": "Note restored.",
          "panel.deletesUndone": "Notes restored.",
          "panel.undoAll": "Undo all",
          "panel.dismiss": "Dismiss",
          "panel.completed": "Note updated.",
          "panel.undo": "Undo",
          "toolbar.capture": "Quick Note",
          "overlay.title": "Save a quick note",
          "overlay.viewAll": "View all",
          "overlay.viewAllCount": "View all ({count})",
          "overlay.cancel": "Cancel",
          "overlay.save": "Save note",
          "overlay.saveClear": "Save and clear draft",
          "overlay.empty": "Nothing to save.",
          "parked.saved": "Moved into Quick Note",
          "parked.open": "Open the list",
          "parked.undo": "Undo",
          "parked.dismiss": "Dismiss",
          "shortcut.open": "Open Quick Note",
        },
        zh: {
          "panel.title": "随手记",
          "panel.body": "记下一条笔记，标记完成，在一页里管理。",
          "panel.placeholder": "写一条笔记… 用 #标签 归类。",
          "panel.add": "添加",
          "panel.empty": "还没有笔记。",
          "panel.noMatches": "没有匹配的笔记。",
          "panel.search": "搜索笔记",
          "panel.filters": "筛选笔记",
          "panel.tags": "标签",
          "panel.allTags": "全部标签",
          "panel.filterAll": "全部",
          "panel.filterOpen": "未完成",
          "panel.filterDone": "已完成",
          "panel.copy": "复制",
          "panel.copied": "已复制。",
          "panel.copyFailed": "复制失败。",
          "panel.copyAll": "复制全部",
          "panel.copyAllDone": "已复制当前可见的笔记为 Markdown。",
          "panel.insert": "插入",
          "panel.inserted": "已插入草稿。",
          "panel.insertUnavailable": "当前没有可用的输入框。",
          "panel.done": "完成",
          "panel.reopen": "重新打开",
          "panel.delete": "删除",
          "panel.deleteHint": "删除这条笔记，随后可以撤销。",
          "panel.deleted": "笔记已删除。",
          "panel.deletedCount": "已删除 {count} 条笔记。",
          "panel.deleteUndone": "笔记已恢复。",
          "panel.deletesUndone": "笔记已恢复。",
          "panel.undoAll": "全部撤销",
          "panel.dismiss": "关闭提示",
          "panel.completed": "笔记已更新。",
          "panel.undo": "撤销",
          "toolbar.capture": "随手记",
          "overlay.title": "保存随手记",
          "overlay.viewAll": "查看全部",
          "overlay.viewAllCount": "查看全部（{count}）",
          "overlay.cancel": "取消",
          "overlay.save": "保存笔记",
          "overlay.saveClear": "保存并清空输入框",
          "overlay.empty": "没有可保存的内容。",
          "parked.saved": "已收进随手记",
          "parked.open": "打开列表",
          "parked.undo": "撤销",
          "parked.dismiss": "关闭提示",
          "shortcut.open": "打开随手记",
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
  ctx.slots.inject("conversation.input.dock", () =>
    ctx.slots.register(
      {
        name: "conversation.input.dock",
        id: "quicknote.parked",
        order: 20,
        locale: NS,
        inject: (sessionId: string) => ({ captureSessionId: sessionId }),
      },
      ParkedBar,
    ),
  );
  ctx.slots.inject("shell.overlay", () =>
    ctx.slots.register(
      { name: "shell.overlay", id: "quicknote.overlay", order: 40, locale: NS },
      Overlay,
    ),
  );

  if (typeof ctx.inject !== "function") return;
  ctx.inject(["shortcuts"], (scope: any) => {
    let shortcuts: any;
    try {
      shortcuts = scope.get("shortcuts");
    } catch {
      return;
    }
    if (typeof shortcuts?.register !== "function") return;
    scope.effect(() => {
      const binding = { code: "KeyS", modifiers: ["primary", "alt"] };
      return shortcuts.register({
        id: "quicknote.open",
        label: () => ctx.locale.bind(NS)("shortcut.open"),
        aliases: ["capture", "note", "quicknote", "随手记", "备忘"],
        defaults: {
          "desktop:macos": binding,
          "desktop:windows": binding,
          "desktop:linux": binding,
          "web:macos": binding,
          "web:windows": binding,
        },
        regions: ["page", "editable", "terminal"],
        modals: [],
        resolve: () => ({ status: "handled", run: openCapture }),
      });
    }, "dsh-quicknote: shortcut");
  });
}
