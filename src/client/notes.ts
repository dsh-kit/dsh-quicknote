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

export interface NoteQuery {
  filter: Filter;
  query: string;
}

/** Apply the done filter and the free-text search. */
export function noteMatches(note: Note, options: NoteQuery): boolean {
  if (options.filter === "open" && note.done) return false;
  if (options.filter === "done" && !note.done) return false;
  const needle = options.query.trim().toLowerCase();
  if (needle !== "" && !note.text.toLowerCase().includes(needle)) return false;
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

/** Markdown export keeps the text literal so notes round-trip unchanged. */
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
