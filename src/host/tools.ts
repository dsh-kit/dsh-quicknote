import type { Note } from "./store.ts";

function textOutput() {
  return {
    schema: { type: "string" },
    render: (_args: unknown, value: unknown) => [{ type: "text", text: String(value) }],
  };
}

function describe(note: Note): string {
  const text = note.text.length > 200 ? `${note.text.slice(0, 200)}…` : note.text;
  return `- ${note.id} (${note.done ? "done" : "open"}): ${text}`;
}

export function createTools(store: ReturnType<typeof import("./store.ts").createStore>) {
  return [
    {
      name: "quicknote_add",
      description:
        "Save one note in the user's Quick Note list. Use it when the user asks to remember or park something for later.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["text"],
        properties: { text: { type: "string", description: "The note body." } },
      },
      output: textOutput(),
      async execute(args: any) {
        const note = await store.add(args?.text);
        return `Saved as ${note.id}.\n${describe(note)}`;
      },
    },
    {
      name: "quicknote_list",
      description: "List notes in the user's Quick Note list, newest first.",
      parameters: { type: "object", additionalProperties: false, properties: {} },
      output: textOutput(),
      async execute() {
        const notes = await store.list();
        return notes.length === 0
          ? "The Quick Note list is empty."
          : `${notes.length} note${notes.length === 1 ? "" : "s"}:\n${notes.map(describe).join("\n")}`;
      },
    },
    {
      name: "quicknote_done",
      description: "Mark one Quick Note as done, or reopen it with done=false.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["id"],
        properties: { id: { type: "string" }, done: { type: "boolean" } },
      },
      output: textOutput(),
      async execute(args: any) {
        const note = await store.update(args?.id, args?.done === false ? false : true);
        return note
          ? `Note ${note.id} is ${note.done ? "done" : "open"}.`
          : `No note with id "${args?.id}".`;
      },
    },
    {
      name: "quicknote_delete",
      description: "Delete one Quick Note permanently. Only when the user explicitly asks.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["id"],
        properties: { id: { type: "string" } },
      },
      output: textOutput(),
      async execute(args: any) {
        return (await store.remove(args?.id))
          ? `Deleted ${args?.id}.`
          : `No note with id "${args?.id}".`;
      },
    },
  ];
}
