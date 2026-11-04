/**
 * Note model and pure list helpers shared by the page and its tests.
 *
 * @module dsh-quicknote/client/notes
 */

export interface NoteOrigin {
  sessionId: string;
  title: string;
}

export interface Note {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
  origin?: NoteOrigin;
}

export type Filter = "all" | "open" | "done";

/**
 * `#tag` must not continue a word, so `example.com#fragment` and `#` alone are not tags.
 * Letters, marks, numbers, `_` and `-` are allowed, which covers `#工作` and `#release-1`.
 */
const TAG_PATTERN = /(?<![\p{L}\p{M}\p{N}_/.#&-])#([\p{L}\p{M}\p{N}_-]{1,32})/gu;

/** Tags in first-seen order, de-duplicated case-insensitively. */
export function extractTags(text: string): string[] {
  const tags: string[] = [];
  const seen = new Set<string>();
  for (const match of text.matchAll(TAG_PATTERN)) {
    const tag = match[1];
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }
  return tags;
}

export interface TagCount {
  tag: string;
  count: number;
}

/** Every tag in the list, most-used first; ties sort alphabetically. */
export function collectTags(notes: Note[]): TagCount[] {
  const counts = new Map<string, TagCount>();
  for (const note of notes) {
    for (const tag of extractTags(note.text)) {
      const key = tag.toLowerCase();
      const current = counts.get(key);
      if (current) current.count += 1;
      else counts.set(key, { tag, count: 1 });
    }
  }
  return [...counts.values()].sort(
    (left, right) => right.count - left.count || left.tag.localeCompare(right.tag),
  );
}

export interface NoteQuery {
  filter: Filter;
  query: string;
  tag: string | null;
}

/** Apply the done filter, free-text search and active tag together. */
export function noteMatches(note: Note, options: NoteQuery): boolean {
  if (options.filter === "open" && note.done) return false;
  if (options.filter === "done" && !note.done) return false;
  const needle = options.query.trim().toLowerCase();
  if (needle !== "" && !note.text.toLowerCase().includes(needle)) return false;
  if (options.tag !== null) {
    const wanted = options.tag.toLowerCase();
    if (!extractTags(note.text).some((tag) => tag.toLowerCase() === wanted)) return false;
  }
  return true;
}

export function filterNotes(notes: Note[], options: NoteQuery): Note[] {
  return notes.filter((note) => noteMatches(note, options));
}

export function formatTime(value: number): string {
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

/** Markdown export keeps the text literal, so tags already survive the round trip. */
export function notesToMarkdown(notes: Note[], title: string): string {
  if (notes.length === 0) return "";
  const lines = [`# ${title}`, ""];
  for (const note of notes) {
    lines.push(`- [${note.done ? "x" : " "}] ${note.text.replace(/\n/g, "\n  ")}`);
    lines.push(`  <sub>${formatTime(note.createdAt)}</sub>`);
    lines.push("");
  }
  return lines.join("\n");
}
