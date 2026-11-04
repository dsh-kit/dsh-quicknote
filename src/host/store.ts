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

function parseNote(value: unknown): Note | null {
  if (value === null || typeof value !== "object") return null;
  const raw = value as Partial<Note>;
  if (typeof raw.id !== "string" || raw.id === "" || raw.id.length > 128) return null;
  if (typeof raw.text !== "string") return null;
  const text = raw.text.trim();
  if (text === "" || text.length > MAX_TEXT) return null;
  const createdAt =
    typeof raw.createdAt === "number" && Number.isFinite(raw.createdAt)
      ? raw.createdAt
      : Date.now();
  const note: Note = { id: raw.id, text, done: raw.done === true, createdAt };
  const origin = parseOrigin(raw.origin);
  if (origin) note.origin = origin;
  return note;
}

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
  // Route handlers can overlap; keep every read and write in one queue so a
  // concurrent restore cannot overwrite another write or share a temp file.
  let tail: Promise<void> = Promise.resolve();
  function serialized<T>(run: () => Promise<T>): Promise<T> {
    const result = tail.then(run);
    tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

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
    const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(temporary, `${JSON.stringify({ notes }, null, 2)}\n`, { mode: 0o600 });
    await rename(temporary, file);
    cache = notes;
  }

  return {
    file,
    list(): Promise<Note[]> {
      return serialized(async () => [...(await load())]);
    },
    add(text: string, origin?: unknown): Promise<Note> {
      return serialized(async () => {
        const value = String(text ?? "").trim();
        if (value === "") throw new Error("empty-note");
        if (value.length > MAX_TEXT) throw new Error("note-too-long");
        const notes = await load();
        // Keep the newest-first order stable even when two notes land in one millisecond.
        const createdAt = Math.max(Date.now(), (notes[0]?.createdAt ?? 0) + 1);
        const note: Note = { id: randomUUID(), text: value, done: false, createdAt };
        const cleanOrigin = parseOrigin(origin);
        if (cleanOrigin) note.origin = cleanOrigin;
        await save([note, ...notes]);
        return note;
      });
    },
    update(id: string, done: boolean): Promise<Note | null> {
      return serialized(async () => {
        const notes = await load();
        const current = notes.find((note) => note.id === id);
        if (!current) return null;
        const updated = { ...current, done };
        await save(notes.map((note) => (note.id === id ? updated : note)));
        return updated;
      });
    },
    remove(id: string): Promise<Note | null> {
      return serialized(async () => {
        const notes = await load();
        const removed = notes.find((note) => note.id === id) ?? null;
        if (!removed) return null;
        await save(notes.filter((note) => note.id !== id));
        return removed;
      });
    },
    restore(value: unknown): Promise<Note> {
      return serialized(async () => {
        const note = parseNote(value);
        if (!note) throw new Error("invalid-note");
        const notes = await load();
        const existing = notes.find((item) => item.id === note.id);
        if (existing) return existing;
        const index = notes.findIndex((item) => item.createdAt <= note.createdAt);
        const next = [...notes];
        next.splice(index === -1 ? notes.length : index, 0, note);
        await save(next);
        return note;
      });
    },
  };
}
