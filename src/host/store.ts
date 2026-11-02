import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

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

const MAX_TEXT = 20_000;

function parseOrigin(value: unknown): NoteOrigin | undefined {
  if (value === null || typeof value !== "object") return undefined;
  const sessionId = String((value as NoteOrigin).sessionId ?? "");
  const title = String((value as NoteOrigin).title ?? "");
  if (sessionId === "" && title === "") return undefined;
  return { sessionId, title };
}

/** A small durable store: one JSON file, atomic whole-file writes, newest first. */
export function createStore(file: string) {
  let cache: Note[] | null = null;

  async function load(): Promise<Note[]> {
    if (cache) return cache;
    try {
      const parsed = JSON.parse(await readFile(file, "utf8")) as { notes?: unknown };
      const notes = Array.isArray(parsed.notes)
        ? parsed.notes.filter(
            (note): note is Note =>
              typeof note === "object" &&
              note !== null &&
              typeof (note as Note).id === "string" &&
              typeof (note as Note).text === "string" &&
              (note as Note).text.trim() !== "",
          )
        : [];
      cache = notes;
    } catch {
      cache = [];
    }
    return cache;
  }

  async function save(notes: Note[]): Promise<void> {
    await mkdir(dirname(file), { recursive: true });
    const temporary = `${file}.${process.pid}.tmp`;
    await writeFile(temporary, `${JSON.stringify({ notes }, null, 2)}\n`, { mode: 0o600 });
    await rename(temporary, file);
    cache = notes;
  }

  return {
    file,
    async list(): Promise<Note[]> {
      return [...(await load())];
    },
    async add(text: string, origin?: unknown): Promise<Note> {
      const value = String(text ?? "").trim();
      if (value === "") throw new Error("empty-note");
      if (value.length > MAX_TEXT) throw new Error("note-too-long");
      const note: Note = { id: randomUUID(), text: value, done: false, createdAt: Date.now() };
      const cleanOrigin = parseOrigin(origin);
      if (cleanOrigin) note.origin = cleanOrigin;
      await save([note, ...(await load())]);
      return note;
    },
    async update(id: string, done: boolean): Promise<Note | null> {
      const notes = await load();
      const current = notes.find((note) => note.id === id);
      if (!current) return null;
      const updated = { ...current, done };
      await save(notes.map((note) => (note.id === id ? updated : note)));
      return updated;
    },
    async remove(id: string): Promise<boolean> {
      const notes = await load();
      const next = notes.filter((note) => note.id !== id);
      if (next.length === notes.length) return false;
      await save(next);
      return true;
    },
  };
}
