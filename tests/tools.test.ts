import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createStore } from "../src/host/store.ts";
import { createTools } from "../src/host/tools.ts";

const dirs: string[] = [];

async function tools() {
  const dir = await mkdtemp(join(tmpdir(), "quicknote-tools-"));
  dirs.push(dir);
  return createTools(createStore(join(dir, "notes.json")));
}

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("quicknote tools", () => {
  it("adds, lists, completes and deletes through the Agent surface", async () => {
    const definitions = await tools();
    const add = definitions.find((tool) => tool.name === "quicknote_add");
    const list = definitions.find((tool) => tool.name === "quicknote_list");
    const done = definitions.find((tool) => tool.name === "quicknote_done");
    const remove = definitions.find((tool) => tool.name === "quicknote_delete");
    expect(add && list && done && remove).toBeTruthy();

    const added = String(await add!.execute({ text: "from tool" }));
    const id = added.match(/[0-9a-f-]{36}/)?.[0];
    expect(id).toBeTruthy();
    expect(String(await list!.execute({}))).toContain("from tool");
    expect(String(await done!.execute({ id, done: true }))).toContain("done");
    expect(String(await remove!.execute({ id }))).toContain("Deleted");
    expect(String(await list!.execute({}))).toContain("empty");
  });
});
