window.__ModuleLoader__.load({
	id: "dsh-quicknote",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		// src/shared/constants.ts
		/** Package name; must equal package.json `name` (the client bundle id). */
		const NAME = "dsh-quicknote";
		/** Locale namespace owned by this plugin. */
		const NS = "dsh-quicknote";
		/** Host JSON API used by the page. */
		const API = "/api/quicknote";
		// src/client/session.ts
		/** Access to the per-Session composer owned by the conversation service. */
		let clientCtx = null;
		function setClientContext(ctx) {
			clientCtx = ctx;
		}
		function sessionIdNear(node) {
			try {
				const id = (typeof node?.closest === "function" ? node.closest("[data-conversation-session]") : null)?.getAttribute("data-conversation-session");
				return typeof id === "string" && id !== "" ? id : void 0;
			} catch {
				return;
			}
		}
		function composerOf(sessionId) {
			if (sessionId === void 0) return void 0;
			try {
				const input = clientCtx?.get("conversation")?.input;
				if (typeof input?.shell !== "function") return void 0;
				const shell = input.shell(sessionId);
				if (!shell?.state || !shell?.actions) return void 0;
				return shell;
			} catch {
				return;
			}
		}
		function draftOf(sessionId) {
			try {
				return String(composerOf(sessionId)?.state.getSnapshot().draft ?? "");
			} catch {
				return "";
			}
		}
		// src/client/ComposerButton.tsx
		/** A labelled button in the composer toolbar. No icon-only destructive control. */
		function ComposerButton({ t }) {
			function open(event) {
				const sessionId = sessionIdNear(event.currentTarget);
				window.dispatchEvent(new CustomEvent("dsh-quicknote:open", { detail: {
					sessionId,
					text: draftOf(sessionId)
				} }));
			}
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: open,
				"data-testid": "quicknote-composer",
				style: {
					display: "inline-flex",
					alignItems: "center",
					gap: 6,
					padding: "5px 9px",
					borderRadius: 8,
					border: "1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24))",
					background: "transparent",
					color: "var(--dsw-alias-label-secondary, inherit)",
					font: "inherit",
					cursor: "pointer",
					whiteSpace: "nowrap"
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
					viewBox: "0 0 24 24",
					width: "16",
					height: "16",
					fill: "none",
					"aria-hidden": "true",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
						x: "4",
						y: "3.5",
						width: "16",
						height: "17",
						rx: "3",
						stroke: "currentColor",
						strokeWidth: "1.6"
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M8 8h8M8 12h8M8 16h5",
						stroke: "currentColor",
						strokeWidth: "1.6",
						strokeLinecap: "round"
					})]
				}), t("toolbar.capture")]
			});
		}
		// src/client/Overlay.tsx
		/** Capture card in the shell overlay; saves a note and optionally clears the draft. */
		function Overlay({ t }) {
			const [open, setOpen] = (0, react.useState)(false);
			const [text, setText] = (0, react.useState)("");
			const [sessionId, setSessionId] = (0, react.useState)(void 0);
			const [error, setError] = (0, react.useState)("");
			const [saving, setSaving] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				const onOpen = (event) => {
					const detail = event.detail;
					setText(detail?.text ?? "");
					setSessionId(detail?.sessionId);
					setError("");
					setOpen(true);
				};
				window.addEventListener("dsh-quicknote:open", onOpen);
				return () => window.removeEventListener("dsh-quicknote:open", onOpen);
			}, []);
			(0, react.useEffect)(() => {
				if (!open) return;
				const onKey = (event) => {
					if (event.key === "Escape") setOpen(false);
				};
				window.addEventListener("keydown", onKey);
				return () => window.removeEventListener("keydown", onKey);
			}, [open]);
			async function save(clearDraft) {
				if (text.trim() === "" || saving) return;
				setSaving(true);
				setError("");
				try {
					const response = await fetch(`${API}/notes/create`, {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({ text })
					});
					const result = await response.json();
					if (!response.ok || !result.ok) throw new Error(result.error ?? "save-failed");
					if (clearDraft && sessionId !== void 0) try {
						composerOf(sessionId)?.actions.setDraft("");
					} catch {}
					setOpen(false);
					window.dispatchEvent(new Event("dsh-quicknote:changed"));
				} catch (cause) {
					setError(String(cause.message));
				} finally {
					setSaving(false);
				}
			}
			if (!open) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: {
					position: "fixed",
					inset: 0,
					zIndex: 50,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background: "rgba(15,17,21,.45)",
					padding: 24
				},
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					role: "dialog",
					"aria-modal": "true",
					"aria-label": t("overlay.title"),
					style: {
						width: "min(560px, 100%)",
						padding: 20,
						borderRadius: 14,
						background: "var(--dsw-alias-bg-overlay, #fff)",
						boxShadow: "var(--dsw-elevation-panel, 0 24px 70px rgba(0,0,0,.3))",
						color: "var(--dsw-alias-label-primary, inherit)",
						colorScheme: "light dark"
					},
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
							style: {
								margin: 0,
								fontSize: 18
							},
							children: t("overlay.title")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
							"data-testid": "quicknote-overlay-input",
							autoFocus: true,
							value: text,
							onChange: (event) => setText(event.target.value),
							rows: 5,
							style: {
								width: "100%",
								boxSizing: "border-box",
								marginTop: 12,
								padding: 10,
								borderRadius: 8,
								border: "1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24))",
								background: "var(--dsw-alias-bg-layer-1, transparent)",
								color: "var(--dsw-alias-label-primary, inherit)",
								font: "inherit",
								resize: "vertical"
							}
						}),
						error === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							role: "alert",
							style: {
								color: "var(--dsw-alias-state-error-primary, #c0392b)",
								margin: "8px 0 0"
							},
							children: error
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								display: "flex",
								justifyContent: "flex-end",
								gap: 8,
								marginTop: 14,
								flexWrap: "wrap"
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setOpen(false),
									style: {
										padding: "7px 12px",
										borderRadius: 8,
										border: "1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24))",
										background: "var(--dsw-alias-bg-layer-1, transparent)",
										color: "var(--dsw-alias-label-primary, inherit)",
										font: "inherit",
										cursor: "pointer"
									},
									children: t("overlay.cancel")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: saving,
									onClick: () => void save(false),
									style: {
										padding: "7px 12px",
										borderRadius: 8,
										border: "1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24))",
										background: "var(--dsw-alias-bg-layer-1, transparent)",
										color: "var(--dsw-alias-label-primary, inherit)",
										font: "inherit",
										cursor: "pointer"
									},
									children: t("overlay.save")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: saving || sessionId === void 0,
									onClick: () => void save(true),
									style: {
										padding: "7px 12px",
										borderRadius: 8,
										border: "1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24))",
										background: "var(--dsw-alias-bg-layer-1, transparent)",
										color: "var(--dsw-alias-label-primary, inherit)",
										font: "inherit",
										cursor: "pointer"
									},
									children: t("overlay.saveClear")
								})
							]
						})
					]
				})
			});
		}
		// src/client/index.tsx
		/**
		* Browser half of the Quick Note example. React is provided by DSH at runtime.
		*
		* @module dsh-quicknote/client
		*/
		async function request(path, init) {
			const response = await fetch(`${API}${path}`, {
				headers: { "content-type": "application/json" },
				...init
			});
			const data = await response.json();
			if (!response.ok || !data.ok) throw new Error(data.error ?? `request-failed-${response.status}`);
			return data;
		}
		function Icon({ size = 18 }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 24 24",
				width: size,
				height: size,
				fill: "none",
				"aria-hidden": "true",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
					x: "4",
					y: "3.5",
					width: "16",
					height: "17",
					rx: "3",
					stroke: "currentColor",
					strokeWidth: "1.6"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M8 8h8M8 12h8M8 16h5",
					stroke: "currentColor",
					strokeWidth: "1.6",
					strokeLinecap: "round"
				})]
			});
		}
		function Page({ t }) {
			const [notes, setNotes] = (0, react.useState)([]);
			const [text, setText] = (0, react.useState)("");
			const [error, setError] = (0, react.useState)("");
			const [undo, setUndo] = (0, react.useState)(null);
			async function load() {
				try {
					const data = await request("/notes");
					setNotes(data.notes);
				} catch (cause) {
					setError(String(cause.message));
				}
			}
			(0, react.useEffect)(() => {
				load();
				const changed = () => void load();
				window.addEventListener("dsh-quicknote:changed", changed);
				return () => window.removeEventListener("dsh-quicknote:changed", changed);
			}, []);
			(0, react.useEffect)(() => {
				if (!undo) return;
				const timer = window.setTimeout(() => setUndo(null), 8e3);
				return () => window.clearTimeout(timer);
			}, [undo]);
			async function add(event) {
				event.preventDefault();
				if (text.trim() === "") return;
				try {
					await request("/notes/create", {
						method: "POST",
						body: JSON.stringify({ text })
					});
					setText("");
					setError("");
					await load();
				} catch (cause) {
					setError(String(cause.message));
				}
			}
			async function toggle(note) {
				try {
					await request("/notes/update", {
						method: "POST",
						body: JSON.stringify({
							id: note.id,
							done: !note.done
						})
					});
					await load();
				} catch (cause) {
					setError(String(cause.message));
				}
			}
			async function remove(note) {
				try {
					await request("/notes/delete", {
						method: "POST",
						body: JSON.stringify({ id: note.id })
					});
					await load();
				} catch (cause) {
					setError(String(cause.message));
				}
			}
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					boxSizing: "border-box",
					minHeight: "100%",
					padding: "24px 28px",
					maxWidth: 760,
					background: "var(--dsw-alias-bg-base, transparent)",
					color: "var(--dsw-alias-label-primary, inherit)",
					colorScheme: "light dark"
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h1", {
						style: {
							fontSize: 22,
							margin: 0
						},
						children: t("panel.title")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						style: {
							margin: "6px 0 18px",
							color: "var(--dsw-alias-label-secondary)"
						},
						children: t("panel.body")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("form", {
						onSubmit: add,
						style: {
							display: "flex",
							gap: 8,
							alignItems: "flex-start"
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
							"data-testid": "note-input",
							value: text,
							onChange: (event) => setText(event.target.value),
							placeholder: t("panel.placeholder"),
							rows: 3,
							style: {
								flex: 1,
								resize: "vertical",
								padding: 10,
								borderRadius: 8,
								border: "1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24))",
								background: "var(--dsw-alias-bg-layer-1, transparent)",
								color: "var(--dsw-alias-label-primary, inherit)",
								colorScheme: "light dark",
								font: "inherit"
							}
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							"data-testid": "note-add",
							type: "submit",
							disabled: text.trim() === "",
							style: {
								padding: "9px 14px",
								borderRadius: 8,
								border: "1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24))",
								background: "var(--dsw-alias-bg-layer-1, transparent)",
								color: "var(--dsw-alias-label-primary, inherit)",
								font: "inherit",
								cursor: text.trim() === "" ? "default" : "pointer",
								opacity: text.trim() === "" ? .5 : 1
							},
							children: t("panel.add")
						})]
					}),
					error === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						role: "alert",
						style: { color: "var(--dsw-alias-state-error-primary, #c0392b)" },
						children: error
					}),
					notes.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						style: {
							marginTop: 24,
							color: "var(--dsw-alias-label-secondary)"
						},
						children: t("panel.empty")
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
						style: {
							listStyle: "none",
							padding: 0,
							margin: "24px 0 0",
							display: "grid",
							gap: 8
						},
						children: notes.map((note) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
							"data-testid": "note-item",
							style: {
								display: "flex",
								gap: 8,
								alignItems: "center",
								padding: 12,
								border: "1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24))",
								borderRadius: 10,
								background: "var(--dsw-alias-bg-layer-1, transparent)"
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: {
										flex: 1,
										textDecoration: note.done ? "line-through" : "none",
										opacity: note.done ? .6 : 1
									},
									children: note.text
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => void toggle(note),
									style: {
										padding: "5px 9px",
										borderRadius: 7,
										border: "1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24))",
										background: "var(--dsw-alias-bg-layer-1, transparent)",
										color: "var(--dsw-alias-label-primary, inherit)",
										font: "inherit",
										cursor: "pointer"
									},
									children: note.done ? t("panel.reopen") : t("panel.done")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => void remove(note),
									style: {
										padding: "5px 9px",
										borderRadius: 7,
										border: "1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24))",
										background: "var(--dsw-alias-bg-layer-1, transparent)",
										color: "var(--dsw-alias-label-primary, inherit)",
										font: "inherit",
										cursor: "pointer"
									},
									children: t("panel.delete")
								})
							]
						}, note.id))
					})
				]
			});
		}
		const name = NAME;
		const inject = ["slots", "locale"];
		function apply(ctx) {
			setClientContext(ctx);
			ctx.effect(() => ctx.locale.register(NS, {
				en: {
					"panel.title": "Quick Note",
					"panel.body": "Capture a note, mark it done, keep the list on one page.",
					"panel.placeholder": "Write a note…",
					"panel.add": "Add note",
					"panel.empty": "No notes yet.",
					"panel.done": "Done",
					"panel.reopen": "Reopen",
					"panel.delete": "Delete",
					"panel.deleted": "Note deleted.",
					"panel.completed": "Note updated.",
					"panel.undo": "Undo",
					"toolbar.capture": "Quick Note",
					"overlay.title": "Save a quick note",
					"overlay.cancel": "Cancel",
					"overlay.save": "Save note",
					"overlay.saveClear": "Save and clear draft",
					"overlay.empty": "Nothing to save."
				},
				zh: {
					"panel.title": "随手记",
					"panel.body": "记下一条笔记，标记完成，在一页里管理。",
					"panel.placeholder": "写一条笔记…",
					"panel.add": "添加",
					"panel.empty": "还没有笔记。",
					"panel.done": "完成",
					"panel.reopen": "重新打开",
					"panel.delete": "删除",
					"panel.deleted": "笔记已删除。",
					"panel.completed": "笔记已更新。",
					"panel.undo": "撤销",
					"toolbar.capture": "随手记",
					"overlay.title": "保存随手记",
					"overlay.cancel": "取消",
					"overlay.save": "保存笔记",
					"overlay.saveClear": "保存并清空输入框",
					"overlay.empty": "没有可保存的内容。"
				}
			}), `${NAME}: dictionaries`);
			ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
				name: "sidebar.panellist",
				id: NAME,
				order: 60,
				label: () => ctx.locale.bind(NS)("panel.title"),
				locale: NS
			}, Icon));
			ctx.slots.inject("main", () => ctx.slots.register({
				name: "main",
				key: NAME,
				locale: NS
			}, Page));
			ctx.slots.inject("conversation.input.left", () => ctx.slots.register({
				name: "conversation.input.left",
				id: "quicknote.toolbar",
				order: 10,
				locale: NS
			}, ComposerButton));
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "quicknote.overlay",
				order: 40,
				locale: NS
			}, Overlay));
		}
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});
