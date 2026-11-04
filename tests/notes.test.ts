import { describe, expect, it } from "vitest";

import { collectTags, extractTags, filterNotes, notesToMarkdown } from "../src/client/notes.ts";
import type { Note } from "../src/client/notes.ts";

function note(id: string, text: string, done = false, createdAt = 1): Note {
  return { id, text, done, createdAt };
}

describe("quicknote tags", () => {
  it("finds word-start tags and de-duplicates them case-insensitively", () => {
    expect(extractTags("buy milk #shopping, then #工作 and #shopping again")).toEqual([
      "shopping",
      "工作",
    ]);
    expect(extractTags("call (#phone) about #release-1")).toEqual(["phone", "release-1"]);
    expect(extractTags('say "#shipit" then “#工作”')).toEqual(["shipit", "工作"]);
  });

  it("does not treat fragments, bare hashes or markdown headings as tags", () => {
    expect(extractTags("see example.com#fragment and #  spaced")).toEqual([]);
    expect(extractTags("# Heading\nplain text")).toEqual([]);
    expect(extractTags("mail me@example.com")).toEqual([]);
  });

  it("counts tags per note, most-used first", () => {
    const tags = collectTags([
      note("1", "#work and #home"),
      note("2", "#work"),
      note("3", "#home #work"),
    ]);
    expect(tags).toEqual([
      { tag: "work", count: 3 },
      { tag: "home", count: 2 },
    ]);
  });

  it("combines the done filter, search and active tag", () => {
    const notes = [
      note("1", "ship the release #work"),
      note("2", "water the plants #home"),
      note("3", "ship the docs #work", true),
    ];
    expect(filterNotes(notes, { filter: "all", query: "", tag: null })).toHaveLength(3);
    expect(filterNotes(notes, { filter: "open", query: "", tag: "work" })).toEqual([notes[0]]);
    expect(filterNotes(notes, { filter: "all", query: "ship", tag: null })).toEqual([
      notes[0],
      notes[2],
    ]);
    expect(filterNotes(notes, { filter: "done", query: "ship", tag: "work" })).toEqual([notes[2]]);
    expect(filterNotes(notes, { filter: "all", query: "", tag: "WORK" })).toEqual([
      notes[0],
      notes[2],
    ]);
  });

  it("keeps tags in the Markdown export", () => {
    expect(notesToMarkdown([note("1", "ship it #work", false, 0)], "Quick Note")).toContain(
      "ship it #work",
    );
  });
});
