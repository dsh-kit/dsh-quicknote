import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createStore } from "../src/host/store.ts";

const dirs: string[] = [];

async function store() {
  const dir = await mkdtemp(join(tmpdir(), "quicknote-"));
  dirs.push(dir);
  return createStore(join(dir, "notes.json"));
}

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("quicknote store", () => {
  it("adds, lists, updates and removes notes", async () => {
    const notes = await store();
    const first = await notes.add("first note");
    const second = await notes.add("second note");
    expect((await notes.list()).map((note) => note.text)).toEqual(["second note", "first note"]);
    expect((await notes.update(first.id, true))?.done).toBe(true);
    expect((await notes.remove(second.id))?.id).toBe(second.id);
    expect((await notes.list()).map((note) => note.id)).toEqual([first.id]);
  });

  it("returns a removed note so the page can undo the delete", async () => {
    const notes = await store();
    const first = await notes.add("first note");
    const second = await notes.add("second note");

    const removed = await notes.remove(second.id);
    expect(removed?.text).toBe("second note");
    expect(await notes.remove(second.id)).toBeNull();

    expect(await notes.restore(removed)).toEqual(second);
    expect((await notes.list()).map((note) => note.text)).toEqual(["second note", "first note"]);
    expect((await notes.restore(removed)).id).toBe(second.id);
    expect((await notes.list()).map((note) => note.id)).toEqual([second.id, first.id]);
  });

  it("serializes concurrent writes instead of losing notes", async () => {
    const notes = await store();
    await Promise.all([notes.add("one"), notes.add("two"), notes.add("three")]);
    expect((await notes.list()).map((note) => note.text).sort()).toEqual(["one", "three", "two"]);

    const removed = await Promise.all((await notes.list()).map((note) => notes.remove(note.id)));
    expect(removed.every(Boolean)).toBe(true);
    await Promise.all(removed.map((note) => notes.restore(note)));
    expect((await notes.list()).map((note) => note.text).sort()).toEqual(["one", "three", "two"]);
  });

  it("rejects an invalid note on restore", async () => {
    const notes = await store();
    await expect(notes.restore({ id: "", text: "x" })).rejects.toThrow("invalid-note");
    await expect(notes.restore({ id: "a", text: "   " })).rejects.toThrow("invalid-note");
  });

  it("keeps capture provenance when supplied", async () => {
    const notes = await store();
    const note = await notes.add("from a session", { sessionId: "session-1", title: "Planning" });
    expect(note.origin).toEqual({ sessionId: "session-1", title: "Planning" });
    expect((await notes.list())[0].origin).toEqual({ sessionId: "session-1", title: "Planning" });
  });

  it("rejects empty notes", async () => {
    const notes = await store();
    await expect(notes.add("   ")).rejects.toThrow("empty-note");
  });
});
