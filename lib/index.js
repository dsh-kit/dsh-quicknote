import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
// src/shared/constants.ts
/** Package name; must equal package.json `name` (the client bundle id). */
const NAME = "dsh-quicknote";
/** Host JSON API used by the page. */
const API = "/api/quicknote";
// src/host/paths.ts
/** Keep the example's data separate from other plugins. */
function resolveNotesFile(ctx) {
	try {
		const dshHomePath = typeof ctx.get === "function" ? ctx.get("dshHomePath") : void 0;
		if (typeof dshHomePath === "function") {
			const dir = dshHomePath("quicknote");
			if (typeof dir === "string" && dir !== "") return join(dir, "notes.json");
		}
	} catch {}
	const home = (process.env.DSH_HOME ?? "").trim() || join(homedir(), ".dsh");
	return join(home, "quicknote", "notes.json");
}
// src/host/routes.ts
var HttpError = class extends Error {
	status;
	constructor(status, message) {
		super(message);
		this.status = status;
	}
};
function json(status, body) {
	return new Response(`${JSON.stringify(body)}\n`, {
		status,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "no-store"
		}
	});
}
async function body(request) {
	try {
		const value = await request.json();
		return value && typeof value === "object" ? value : {};
	} catch {
		throw new HttpError(400, "invalid-json");
	}
}
function registerRoutes(ctx, store) {
	ctx.inject(["connection"], (scope) => {
		const registry = scope.get("connection")?.fetch;
		if (typeof registry?.register !== "function") {
			ctx.logger?.warn?.("dsh-quicknote: no fetch registry; the page will not load notes");
			return;
		}
		const wrap = (handler) => async (request) => {
			try {
				return await handler(request);
			} catch (error) {
				return json(error instanceof HttpError ? error.status : 500, {
					ok: false,
					error: error instanceof HttpError ? error.message : String(error?.message ?? error)
				});
			}
		};
		const routes = [
			{
				path: `${API}/notes`,
				methods: ["GET"],
				fetch: wrap(async () => json(200, {
					ok: true,
					notes: await store.list()
				}))
			},
			{
				path: `${API}/notes/create`,
				methods: ["POST"],
				fetch: wrap(async (request) => {
					const input = await body(request);
					return json(200, {
						ok: true,
						note: await store.add(input.text, input.origin)
					});
				})
			},
			{
				path: `${API}/notes/update`,
				methods: ["POST"],
				fetch: wrap(async (request) => {
					const input = await body(request);
					const note = await store.update(input.id, input.done === true);
					return note ? json(200, {
						ok: true,
						note
					}) : json(404, {
						ok: false,
						error: "unknown-note"
					});
				})
			},
			{
				path: `${API}/notes/delete`,
				methods: ["POST"],
				fetch: wrap(async (request) => json(200, {
					ok: true,
					removed: await store.remove((await body(request)).id)
				}))
			}
		];
		for (const route of routes) scope.effect(() => registry.register({
			path: route.path,
			methods: route.methods,
			requestBody: "buffered",
			fetch: route.fetch
		}), `dsh-quicknote: ${route.path}`);
	});
}
// src/host/store.ts
const MAX_TEXT = 2e4;
function parseOrigin(value) {
	if (value === null || typeof value !== "object") return void 0;
	const sessionId = String(value.sessionId ?? "");
	const title = String(value.title ?? "");
	if (sessionId === "" && title === "") return void 0;
	return {
		sessionId,
		title
	};
}
/** A small durable store: one JSON file, atomic whole-file writes, newest first. */
function createStore(file) {
	let cache = null;
	async function load() {
		if (cache) return cache;
		try {
			const parsed = JSON.parse(await readFile(file, "utf8"));
			cache = Array.isArray(parsed.notes) ? parsed.notes.filter((note) => typeof note === "object" && note !== null && typeof note.id === "string" && typeof note.text === "string" && note.text.trim() !== "") : [];
		} catch {
			cache = [];
		}
		return cache;
	}
	async function save(notes) {
		await mkdir(dirname(file), { recursive: true });
		const temporary = `${file}.${process.pid}.tmp`;
		await writeFile(temporary, `${JSON.stringify({ notes }, null, 2)}\n`, { mode: 384 });
		await rename(temporary, file);
		cache = notes;
	}
	return {
		file,
		async list() {
			return [...await load()];
		},
		async add(text, origin) {
			const value = String(text ?? "").trim();
			if (value === "") throw new Error("empty-note");
			if (value.length > MAX_TEXT) throw new Error("note-too-long");
			const note = {
				id: randomUUID(),
				text: value,
				done: false,
				createdAt: Date.now()
			};
			const cleanOrigin = parseOrigin(origin);
			if (cleanOrigin) note.origin = cleanOrigin;
			await save([note, ...await load()]);
			return note;
		},
		async update(id, done) {
			const notes = await load();
			const current = notes.find((note) => note.id === id);
			if (!current) return null;
			const updated = {
				...current,
				done
			};
			await save(notes.map((note) => note.id === id ? updated : note));
			return updated;
		},
		async remove(id) {
			const notes = await load();
			const next = notes.filter((note) => note.id !== id);
			if (next.length === notes.length) return false;
			await save(next);
			return true;
		}
	};
}
// src/host/tools.ts
function textOutput() {
	return {
		schema: { type: "string" },
		render: (_args, value) => [{
			type: "text",
			text: String(value)
		}]
	};
}
function describe(note) {
	const text = note.text.length > 200 ? `${note.text.slice(0, 200)}…` : note.text;
	return `- ${note.id} (${note.done ? "done" : "open"}): ${text}`;
}
function createTools(store) {
	return [
		{
			name: "quicknote_add",
			description: "Save one note in the user's Quick Note list. Use it when the user asks to remember or park something for later.",
			parameters: {
				type: "object",
				additionalProperties: false,
				required: ["text"],
				properties: { text: {
					type: "string",
					description: "The note body."
				} }
			},
			output: textOutput(),
			async execute(args) {
				const note = await store.add(args?.text);
				return `Saved as ${note.id}.\n${describe(note)}`;
			}
		},
		{
			name: "quicknote_list",
			description: "List notes in the user's Quick Note list, newest first.",
			parameters: {
				type: "object",
				additionalProperties: false,
				properties: {}
			},
			output: textOutput(),
			async execute() {
				const notes = await store.list();
				return notes.length === 0 ? "The Quick Note list is empty." : `${notes.length} note${notes.length === 1 ? "" : "s"}:\n${notes.map(describe).join("\n")}`;
			}
		},
		{
			name: "quicknote_done",
			description: "Mark one Quick Note as done, or reopen it with done=false.",
			parameters: {
				type: "object",
				additionalProperties: false,
				required: ["id"],
				properties: {
					id: { type: "string" },
					done: { type: "boolean" }
				}
			},
			output: textOutput(),
			async execute(args) {
				const note = await store.update(args?.id, args?.done === false ? false : true);
				return note ? `Note ${note.id} is ${note.done ? "done" : "open"}.` : `No note with id "${args?.id}".`;
			}
		},
		{
			name: "quicknote_delete",
			description: "Delete one Quick Note permanently. Only when the user explicitly asks.",
			parameters: {
				type: "object",
				additionalProperties: false,
				required: ["id"],
				properties: { id: { type: "string" } }
			},
			output: textOutput(),
			async execute(args) {
				return await store.remove(args?.id) ? `Deleted ${args?.id}.` : `No note with id "${args?.id}".`;
			}
		}
	];
}
// src/host/index.ts
/**
* Host half of the Quick Note example: one JSON file, four routes, four tools.
*
* @module dsh-quicknote/host
*/
const name = NAME;
function apply(ctx) {
	const store = createStore(resolveNotesFile(ctx));
	ctx.effect(() => {
		store.list().catch((error) => {
			ctx.logger?.warn?.(`${NAME}: could not read notes: ${String(error)}`);
		});
	}, `${NAME}: warm the note store`);
	registerRoutes(ctx, store);
	ctx.inject(["tools"], (scope) => {
		for (const definition of createTools(store)) scope.effect(() => scope.tools.register(definition), `${NAME}: tool ${definition.name}`);
	});
}
export { apply, createStore, name, resolveNotesFile };
