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
		/** The composer the user is most likely writing in. */
		function focusedSessionId() {
			try {
				const fromFocus = sessionIdNear(document.activeElement);
				if (fromFocus !== void 0) return fromFocus;
			} catch {}
			try {
				return sessionIdNear(document.querySelector("[data-conversation-session]"));
			} catch {
				return;
			}
		}
		/**
		* The Session the main column points at, even while a global panel covers it.
		* The shell unmounts the Conversation for a panel, so the DOM carries no
		* `data-conversation-session`; the workspace selection and the retained
		* main-view reference still name it.
		*/
		function mainSessionId() {
			try {
				const selected = clientCtx?.get?.("uiWorkspace")?.selection?.getSnapshot?.()?.sessionId;
				if (typeof selected === "string" && selected !== "") return selected;
			} catch {}
			try {
				const byId = clientCtx?.sessions?.list?.getSnapshot?.()?.byId ?? {};
				for (const row of Object.values(byId)) if ((row?.retainedBy?.mainView ?? 0) > 0 && typeof row?.id === "string" && row.id !== "") return row.id;
			} catch {}
		}
		/** The composer to act on: the focused one, else the Session the main column retained. */
		function targetSessionId() {
			return focusedSessionId() ?? mainSessionId();
		}
		/** Insert a note into the active draft, preserving anything already typed. */
		function insertIntoComposer(text) {
			const sessionId = targetSessionId();
			const composer = composerOf(sessionId);
			if (!composer || !sessionId) return false;
			try {
				const current = draftOf(sessionId);
				const next = current.trim() === "" ? text : `${current.replace(/\s+$/, "")}\n\n${text}`;
				composer.actions.setDraft(next);
				return true;
			} catch {
				return false;
			}
		}
		/** Provenance for a note captured from a Session. */
		function originOf(sessionId) {
			if (!sessionId) return {
				sessionId: "",
				title: ""
			};
			try {
				const row = clientCtx?.sessions?.list?.getSnapshot?.()?.byId?.[sessionId];
				return {
					sessionId,
					title: typeof row?.title === "string" ? row.title : ""
				};
			} catch {
				return {
					sessionId,
					title: ""
				};
			}
		}
		/** Show the notes page in the main column. */
		function openPanel() {
			try {
				clientCtx?.layout?.selectPanel?.(NAME);
			} catch {}
		}
		/** Open the capture card for the active composer. */
		function openCapture() {
			const sessionId = focusedSessionId();
			window.dispatchEvent(new CustomEvent("dsh-quicknote:open", { detail: {
				sessionId,
				text: draftOf(sessionId)
			} }));
		}
		// src/client/ComposerButton.tsx
		/** A labelled button in the composer toolbar. No icon-only destructive control. */
		function ComposerButton({ t }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: openCapture,
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
		// src/client/notes.ts
		/**
		* `#tag` must not continue a word, so `example.com#fragment` and `#` alone are not tags.
		* Letters, marks, numbers, `_` and `-` are allowed, which covers `#工作` and `#release-1`.
		*/
		const TAG_PATTERN = /(?<![\p{L}\p{M}\p{N}_/.#&-])#([\p{L}\p{M}\p{N}_-]{1,32})/gu;
		/** Tags in first-seen order, de-duplicated case-insensitively. */
		function extractTags(text) {
			const tags = [];
			const seen = /* @__PURE__ */ new Set();
			for (const match of text.matchAll(TAG_PATTERN)) {
				const tag = match[1];
				const key = tag.toLowerCase();
				if (seen.has(key)) continue;
				seen.add(key);
				tags.push(tag);
			}
			return tags;
		}
		/** Every tag in the list, most-used first; ties sort alphabetically. */
		function collectTags(notes) {
			const counts = /* @__PURE__ */ new Map();
			for (const note of notes) for (const tag of extractTags(note.text)) {
				const key = tag.toLowerCase();
				const current = counts.get(key);
				if (current) current.count += 1;
				else counts.set(key, {
					tag,
					count: 1
				});
			}
			return [...counts.values()].sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag));
		}
		/** Apply the done filter, free-text search and active tag together. */
		function noteMatches(note, options) {
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
		function filterNotes(notes, options) {
			return notes.filter((note) => noteMatches(note, options));
		}
		function formatTime(value) {
			const date = new Date(value);
			if (Number.isNaN(date.getTime())) return "";
			const now = /* @__PURE__ */ new Date();
			const clock = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
			if (date.toDateString() === now.toDateString()) return clock;
			const monthDay = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
			return date.getFullYear() === now.getFullYear() ? `${monthDay} ${clock}` : `${date.getFullYear()}-${monthDay}`;
		}
		/** Markdown export keeps the text literal, so tags already survive the round trip. */
		function notesToMarkdown(notes, title) {
			if (notes.length === 0) return "";
			const lines = [`# ${title}`, ""];
			for (const note of notes) {
				lines.push(`- [${note.done ? "x" : " "}] ${note.text.replace(/\n/g, "\n  ")}`);
				lines.push(`  <sub>${formatTime(note.createdAt)}</sub>`);
				lines.push("");
			}
			return lines.join("\n");
		}
		// src/client/capture.ts
		/**
		* Unsaved capture text parked while the card sends the user to the notes page.
		*
		* @module dsh-quicknote/client/capture
		*/
		let stashed = null;
		/** Remember the text the user typed before leaving the card for the notes page. */
		function stashCaptureText(sessionId, text) {
			stashed = {
				sessionId,
				text
			};
		}
		/**
		* The text to show when the card opens again: the stashed edit for the same
		* Session, otherwise the composer draft. Reading consumes the stash.
		*/
		function takeCaptureText(sessionId, draft) {
			const entry = stashed;
			stashed = null;
			return entry !== null && entry.sessionId === sessionId ? entry.text : draft;
		}
		// src/client/parked.ts
		let current = null;
		const listeners = /* @__PURE__ */ new Set();
		function emit() {
			for (const listener of listeners) listener();
		}
		function setParked(next) {
			current = next;
			emit();
		}
		function parkedDraft() {
			return current;
		}
		function useParkedDraft() {
			return (0, react.useSyncExternalStore)((listener) => {
				listeners.add(listener);
				return () => listeners.delete(listener);
			}, parkedDraft, parkedDraft);
		}
		// src/client/Overlay.tsx
		/** Capture card in the shell overlay; saves a note and optionally clears the draft. */
		function Overlay({ t }) {
			const [open, setOpen] = (0, react.useState)(false);
			const [text, setText] = (0, react.useState)("");
			const [sessionId, setSessionId] = (0, react.useState)(void 0);
			const [draftText, setDraftText] = (0, react.useState)("");
			const [error, setError] = (0, react.useState)("");
			const [saving, setSaving] = (0, react.useState)(false);
			const [total, setTotal] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				const onOpen = (event) => {
					const detail = event.detail;
					const draft = detail?.text ?? "";
					setText(takeCaptureText(detail?.sessionId, draft));
					setDraftText(draft);
					setSessionId(detail?.sessionId);
					setError("");
					setTotal(null);
					setOpen(true);
					refreshTotal();
				};
				window.addEventListener("dsh-quicknote:open", onOpen);
				return () => window.removeEventListener("dsh-quicknote:open", onOpen);
			}, []);
			/** The count is decoration for the link; a failed read just hides it. */
			async function refreshTotal() {
				try {
					const response = await fetch(`${API}/notes`);
					if (!response.ok) return;
					const data = await response.json();
					if (Array.isArray(data.notes)) setTotal(data.notes.length);
				} catch {}
			}
			/** Leave the card for the notes page, keeping what the user typed for the next open. */
			function viewAll() {
				stashCaptureText(sessionId, text);
				setOpen(false);
				openPanel();
			}
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
						body: JSON.stringify({
							text,
							origin: originOf(sessionId)
						})
					});
					const result = await response.json();
					if (!response.ok || !result.ok) throw new Error(result.error ?? "save-failed");
					if (clearDraft && sessionId !== void 0 && result.note?.id) {
						setParked({
							noteId: result.note.id,
							text,
							draftText,
							sessionId
						});
						try {
							composerOf(sessionId)?.actions.setDraft("");
						} catch {}
					}
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
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								display: "flex",
								alignItems: "baseline",
								justifyContent: "space-between",
								gap: 12
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
								style: {
									margin: 0,
									fontSize: 18
								},
								children: t("overlay.title")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								"data-testid": "quicknote-overlay-view-all",
								onClick: viewAll,
								style: {
									padding: 0,
									border: 0,
									background: "none",
									color: "var(--dsw-alias-brand-primary, #4d6bfe)",
									font: "inherit",
									fontSize: 13,
									whiteSpace: "nowrap",
									cursor: "pointer"
								},
								children: total === null ? t("overlay.viewAll") : t("overlay.viewAllCount").replace("{count}", String(total))
							})]
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
		// src/client/ParkedBar.tsx
		/** Receipt above the composer after a draft has been moved into Quick Note. */
		function ParkedBar({ t, captureSessionId }) {
			const parked = useParkedDraft();
			const [busy, setBusy] = (0, react.useState)(false);
			if (!parked) return null;
			if (captureSessionId !== void 0 && parked.sessionId !== captureSessionId) return null;
			const preview = parked.text.length > 72 ? `${parked.text.slice(0, 72)}…` : parked.text;
			async function undo() {
				if (!parked || busy) return;
				setBusy(true);
				try {
					const response = await fetch(`${API}/notes/delete`, {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({ id: parked.noteId })
					});
					if (!response.ok) throw new Error(`undo-failed-${response.status}`);
					const composer = composerOf(parked.sessionId);
					if (composer) {
						const current = draftOf(parked.sessionId);
						const next = current.trim() === "" ? parked.draftText : `${current.replace(/\s+$/, "")}\n\n${parked.draftText}`;
						composer.actions.setDraft(next);
					}
					setParked(null);
					window.dispatchEvent(new Event("dsh-quicknote:changed"));
				} catch {} finally {
					setBusy(false);
				}
			}
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				role: "status",
				style: {
					display: "flex",
					alignItems: "center",
					gap: 8,
					margin: "0 0 6px",
					padding: "6px 10px",
					borderRadius: 8,
					borderLeft: "3px solid var(--dsw-alias-brand-primary, #4d6bfe)",
					background: "var(--dsw-alias-bg-layer-2, rgba(127,127,127,.1))",
					color: "var(--dsw-alias-label-secondary, inherit)",
					fontSize: 12,
					lineHeight: "18px"
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						style: {
							flex: 1,
							minWidth: 0,
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap"
						},
						children: [
							t("parked.saved"),
							" · ",
							preview
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: openPanel,
						style: {
							border: 0,
							background: "none",
							color: "var(--dsw-alias-brand-primary, #4d6bfe)",
							font: "inherit",
							cursor: "pointer",
							whiteSpace: "nowrap"
						},
						children: t("parked.open")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: busy,
						onClick: () => void undo(),
						style: {
							border: 0,
							background: "none",
							color: "var(--dsw-alias-label-secondary, inherit)",
							font: "inherit",
							cursor: busy ? "default" : "pointer",
							whiteSpace: "nowrap",
							opacity: busy ? .5 : 1
						},
						children: t("parked.undo")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setParked(null),
						"aria-label": t("parked.dismiss"),
						style: {
							border: 0,
							background: "none",
							color: "var(--dsw-alias-label-tertiary, inherit)",
							font: "inherit",
							fontSize: 14,
							cursor: "pointer",
							padding: "0 2px"
						},
						children: "×"
					})
				]
			});
		}
		// src/client/styles.ts
		/**
		* Scoped page styles. Colours stay on DSH theme tokens so light and dark mode
		* come from the shell; the media queries handle narrow main columns.
		*
		* @module dsh-quicknote/client/styles
		*/
		const PAGE_CSS = `
.qn-page {
  box-sizing: border-box;
  min-height: 100%;
  max-width: 760px;
  padding: 24px 28px 48px;
  background: var(--dsw-alias-bg-base, transparent);
  color: var(--dsw-alias-label-primary, inherit);
  color-scheme: light dark;
}
.qn-title { margin: 0; font-size: 22px; line-height: 1.3; }
.qn-lede { margin: 6px 0 18px; color: var(--dsw-alias-label-secondary, inherit); }
.qn-compose { display: flex; gap: 8px; align-items: flex-start; }
.qn-textarea {
  flex: 1;
  min-width: 0;
  resize: vertical;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l1, rgba(127, 127, 127, 0.24));
  background: var(--dsw-alias-bg-layer-1, transparent);
  color: var(--dsw-alias-label-primary, inherit);
  color-scheme: light dark;
  font: inherit;
}
.qn-button {
  padding: 5px 9px;
  border-radius: 7px;
  border: 1px solid var(--dsw-alias-border-l1, rgba(127, 127, 127, 0.24));
  background: var(--dsw-alias-bg-layer-1, transparent);
  color: var(--dsw-alias-label-primary, inherit);
  font: inherit;
  line-height: 1.35;
  white-space: nowrap;
  cursor: pointer;
}
.qn-button:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2, rgba(127, 127, 127, 0.12)); }
.qn-button:disabled { cursor: default; opacity: 0.5; }
.qn-button:focus-visible,
.qn-textarea:focus-visible,
.qn-search:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary, #4d6bfe);
  outline-offset: 1px;
}
.qn-button[aria-pressed="true"] {
  border-color: var(--dsw-alias-brand-primary, currentColor);
  background: var(--dsw-alias-bg-layer-2, rgba(127, 127, 127, 0.12));
  color: var(--dsw-alias-brand-primary, currentColor);
}
.qn-primary { padding: 9px 14px; border-radius: 8px; }
.qn-toolbar {
  display: grid;
  grid-template-columns: auto minmax(160px, 1fr) auto;
  gap: 8px;
  align-items: center;
  margin-top: 14px;
}
.qn-filters { display: flex; gap: 6px; }
.qn-search {
  min-width: 0;
  padding: 5px 9px;
  border-radius: 7px;
  border: 1px solid var(--dsw-alias-border-l1, rgba(127, 127, 127, 0.24));
  background: var(--dsw-alias-bg-layer-1, transparent);
  color: var(--dsw-alias-label-primary, inherit);
  font: inherit;
}
.qn-tags { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 10px; }
.qn-tags-label { font-size: 12px; color: var(--dsw-alias-label-tertiary, inherit); }
.qn-tag {
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 1.5;
}
.qn-note-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
.qn-note-tags .qn-tag { padding: 1px 7px; font-size: 11px; }
.qn-list { list-style: none; padding: 0; margin: 20px 0 0; display: grid; gap: 8px; }
.qn-note {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
  padding: 12px;
  border: 1px solid var(--dsw-alias-border-l1, rgba(127, 127, 127, 0.24));
  border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1, transparent);
}
.qn-note-body { min-width: 0; }
.qn-note-text {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.qn-note-text-done { text-decoration: line-through; opacity: 0.6; }
.qn-note-meta { margin-top: 4px; font-size: 11px; color: var(--dsw-alias-label-tertiary, inherit); }
.qn-note-actions { display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-end; }
.qn-alert { color: var(--dsw-alias-state-error-primary, #c0392b); }
.qn-status { margin: 8px 0 0; color: var(--dsw-alias-label-secondary, inherit); }
.qn-empty { margin-top: 24px; color: var(--dsw-alias-label-secondary, inherit); }
.qn-toast {
  position: fixed;
  z-index: 60;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: min(560px, calc(100vw - 32px));
  padding: 10px 12px;
  border: 1px solid var(--dsw-alias-border-l1, rgba(127, 127, 127, 0.24));
  border-radius: 10px;
  background: var(--dsw-alias-bg-overlay, #fff);
  box-shadow: var(--dsw-elevation-panel, 0 18px 50px rgba(0, 0, 0, 0.24));
  color: var(--dsw-alias-label-primary, inherit);
  color-scheme: light dark;
}
.qn-toast-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}
.qn-toast-actions { display: flex; flex: none; gap: 4px; }
@media (max-width: 720px) {
  .qn-page { padding: 16px 14px 40px; }
  .qn-compose { flex-direction: column; align-items: stretch; }
  .qn-compose .qn-primary { width: 100%; }
  .qn-toolbar { grid-template-columns: minmax(0, 1fr) auto; }
  .qn-filters { grid-column: 1 / -1; overflow-x: auto; padding-bottom: 2px; }
  .qn-note { grid-template-columns: minmax(0, 1fr); gap: 8px; }
  .qn-note-actions { justify-content: flex-start; }
  .qn-toast { left: 12px; right: 12px; bottom: 12px; transform: none; max-width: none; }
}
@media (max-width: 420px) {
  .qn-tags { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 2px; }
  .qn-tags-label { flex: none; }
  .qn-tag { flex: none; }
  .qn-note-actions { gap: 6px; }
}
`;
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
		const UNDO_WINDOW = 8e3;
		function previewOf(text) {
			const flat = text.replace(/\s+/g, " ").trim();
			return flat.length > 80 ? `${flat.slice(0, 80)}…` : flat;
		}
		function Page({ t }) {
			const [notes, setNotes] = (0, react.useState)([]);
			const [text, setText] = (0, react.useState)("");
			const [error, setError] = (0, react.useState)("");
			const [notice, setNotice] = (0, react.useState)("");
			const [query, setQuery] = (0, react.useState)("");
			const [filter, setFilter] = (0, react.useState)("all");
			const [tag, setTag] = (0, react.useState)(null);
			const [undo, setUndo] = (0, react.useState)([]);
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
				if (notice === "") return;
				const timer = window.setTimeout(() => setNotice(""), 3e3);
				return () => window.clearTimeout(timer);
			}, [notice]);
			(0, react.useEffect)(() => {
				if (undo.length === 0) return;
				const timer = window.setTimeout(() => setUndo([]), UNDO_WINDOW);
				return () => window.clearTimeout(timer);
			}, [undo]);
			async function add(event) {
				event.preventDefault();
				if (text.trim() === "") return;
				try {
					await request("/notes/create", {
						method: "POST",
						body: JSON.stringify({
							text,
							origin: originOf(focusedSessionId())
						})
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
					const removed = (await request("/notes/delete", {
						method: "POST",
						body: JSON.stringify({ id: note.id })
					})).note;
					if (removed) setUndo((current) => [...current, removed]);
					setError("");
					await load();
				} catch (cause) {
					setError(String(cause.message));
				}
			}
			async function undoDelete() {
				if (undo.length === 0) return;
				try {
					await Promise.all(undo.map((note) => request("/notes/restore", {
						method: "POST",
						body: JSON.stringify({ note })
					})));
					setNotice(t(undo.length > 1 ? "panel.deletesUndone" : "panel.deleteUndone"));
					setUndo([]);
					setError("");
					await load();
				} catch (cause) {
					setError(String(cause.message));
				}
			}
			async function copy(note) {
				try {
					await navigator.clipboard.writeText(note.text);
					setNotice(t("panel.copied"));
				} catch {
					setError(t("panel.copyFailed"));
				}
			}
			function insert(note) {
				setNotice(insertIntoComposer(note.text) ? t("panel.inserted") : t("panel.insertUnavailable"));
			}
			const tags = (0, react.useMemo)(() => collectTags(notes), [notes]);
			(0, react.useEffect)(() => {
				if (tag === null) return;
				const wanted = tag.toLowerCase();
				if (!tags.some((entry) => entry.tag.toLowerCase() === wanted)) setTag(null);
			}, [tag, tags]);
			const needle = query.trim().toLowerCase();
			const counts = {
				all: notes.length,
				open: notes.filter((note) => !note.done).length,
				done: notes.filter((note) => note.done).length
			};
			const visible = filterNotes(notes, {
				filter,
				query: needle,
				tag
			});
			function activateTag(next) {
				setTag((current) => current?.toLowerCase() === next.toLowerCase() ? null : next);
			}
			async function copyAll() {
				try {
					await navigator.clipboard.writeText(notesToMarkdown(visible, t("panel.title")));
					setNotice(t("panel.copyAllDone"));
				} catch {
					setError(t("panel.copyFailed"));
				}
			}
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", {
				"data-dsh-quicknote": "",
				children: PAGE_CSS
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "qn-page",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h1", {
						className: "qn-title",
						children: t("panel.title")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "qn-lede",
						children: t("panel.body")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("form", {
						className: "qn-compose",
						onSubmit: add,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
							"data-testid": "note-input",
							className: "qn-textarea",
							value: text,
							onChange: (event) => setText(event.target.value),
							placeholder: t("panel.placeholder"),
							rows: 3
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							"data-testid": "note-add",
							className: "qn-button qn-primary",
							type: "submit",
							disabled: text.trim() === "",
							children: t("panel.add")
						})]
					}),
					notes.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "qn-toolbar",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "qn-filters",
								role: "group",
								"aria-label": t("panel.filters"),
								children: [
									["all", "panel.filterAll"],
									["open", "panel.filterOpen"],
									["done", "panel.filterDone"]
								].map(([id, label]) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "qn-button",
									"aria-pressed": filter === id,
									onClick: () => setFilter(id),
									children: [
										t(label),
										" ",
										counts[id]
									]
								}, id))
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "search",
								className: "qn-search",
								value: query,
								onChange: (event) => setQuery(event.target.value),
								placeholder: t("panel.search"),
								"aria-label": t("panel.search")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "qn-button",
								onClick: () => void copyAll(),
								disabled: visible.length === 0,
								children: t("panel.copyAll")
							})
						]
					}), tags.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "qn-tags",
						role: "group",
						"aria-label": t("panel.tags"),
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "qn-tags-label",
								children: t("panel.tags")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "qn-button qn-tag",
								"aria-pressed": tag === null,
								onClick: () => setTag(null),
								children: t("panel.allTags")
							}),
							tags.map((entry) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "qn-button qn-tag",
								"aria-pressed": tag?.toLowerCase() === entry.tag.toLowerCase(),
								onClick: () => activateTag(entry.tag),
								children: [
									"#",
									entry.tag,
									" ",
									entry.count
								]
							}, entry.tag.toLowerCase()))
						]
					})] }),
					error === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						role: "alert",
						className: "qn-alert",
						children: error
					}),
					notice === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						role: "status",
						className: "qn-status",
						children: notice
					}),
					notes.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "qn-empty",
						children: t("panel.empty")
					}) : visible.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "qn-empty",
						children: t("panel.noMatches")
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
						className: "qn-list",
						children: visible.map((note) => {
							const noteTags = extractTags(note.text);
							return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
								"data-testid": "note-item",
								className: "qn-note",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "qn-note-body",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
											className: `qn-note-text${note.done ? " qn-note-text-done" : ""}`,
											children: note.text
										}),
										noteTags.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: "qn-note-tags",
											children: noteTags.map((label) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
												type: "button",
												className: "qn-button qn-tag",
												"aria-pressed": tag?.toLowerCase() === label.toLowerCase(),
												onClick: () => activateTag(label),
												children: ["#", label]
											}, label.toLowerCase()))
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "qn-note-meta",
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("time", {
												dateTime: new Date(note.createdAt).toISOString(),
												children: formatTime(note.createdAt)
											}), note.origin?.title ? ` · ${note.origin.title}` : ""]
										})
									]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "qn-note-actions",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "qn-button",
											onClick: () => void copy(note),
											children: t("panel.copy")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "qn-button",
											onClick: () => insert(note),
											children: t("panel.insert")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "qn-button",
											onClick: () => void toggle(note),
											children: note.done ? t("panel.reopen") : t("panel.done")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "qn-button",
											title: t("panel.deleteHint"),
											onClick: () => void remove(note),
											children: t("panel.delete")
										})
									]
								})]
							}, note.id);
						})
					}),
					undo.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "qn-toast",
						role: "status",
						"aria-live": "polite",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "qn-toast-text",
							children: [
								undo.length === 1 ? t("panel.deleted") : t("panel.deletedCount").replace("{count}", String(undo.length)),
								" ",
								previewOf(undo[undo.length - 1].text)
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "qn-toast-actions",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "qn-button",
								onClick: () => void undoDelete(),
								children: undo.length > 1 ? t("panel.undoAll") : t("panel.undo")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "qn-button",
								"aria-label": t("panel.dismiss"),
								onClick: () => setUndo([]),
								children: "×"
							})]
						})]
					})
				]
			})] });
		}
		const name = NAME;
		const inject = ["slots", "locale"];
		function apply(ctx) {
			setClientContext(ctx);
			ctx.effect(() => ctx.locale.register(NS, {
				en: {
					"panel.title": "Quick Note",
					"panel.body": "Capture a note, mark it done, keep the list on one page.",
					"panel.placeholder": "Write a note… Use #tags to group it.",
					"panel.add": "Add note",
					"panel.empty": "No notes yet.",
					"panel.noMatches": "No matching notes.",
					"panel.search": "Search notes",
					"panel.filters": "Filter notes",
					"panel.tags": "Tags",
					"panel.allTags": "All tags",
					"panel.filterAll": "All",
					"panel.filterOpen": "Open",
					"panel.filterDone": "Done",
					"panel.copy": "Copy",
					"panel.copied": "Copied.",
					"panel.copyFailed": "Could not copy this note.",
					"panel.copyAll": "Copy all",
					"panel.copyAllDone": "Copied the visible notes as Markdown.",
					"panel.insert": "Insert",
					"panel.inserted": "Inserted into the draft.",
					"panel.insertUnavailable": "No composer is open.",
					"panel.done": "Done",
					"panel.reopen": "Reopen",
					"panel.delete": "Delete",
					"panel.deleteHint": "Delete this note. You can undo it right after.",
					"panel.deleted": "Note deleted.",
					"panel.deletedCount": "Deleted {count} notes.",
					"panel.deleteUndone": "Note restored.",
					"panel.deletesUndone": "Notes restored.",
					"panel.undoAll": "Undo all",
					"panel.dismiss": "Dismiss",
					"panel.completed": "Note updated.",
					"panel.undo": "Undo",
					"toolbar.capture": "Quick Note",
					"overlay.title": "Save a quick note",
					"overlay.viewAll": "View all",
					"overlay.viewAllCount": "View all ({count})",
					"overlay.cancel": "Cancel",
					"overlay.save": "Save note",
					"overlay.saveClear": "Save and clear draft",
					"overlay.empty": "Nothing to save.",
					"parked.saved": "Moved into Quick Note",
					"parked.open": "Open the list",
					"parked.undo": "Undo",
					"parked.dismiss": "Dismiss",
					"shortcut.open": "Open Quick Note"
				},
				zh: {
					"panel.title": "随手记",
					"panel.body": "记下一条笔记，标记完成，在一页里管理。",
					"panel.placeholder": "写一条笔记… 用 #标签 归类。",
					"panel.add": "添加",
					"panel.empty": "还没有笔记。",
					"panel.noMatches": "没有匹配的笔记。",
					"panel.search": "搜索笔记",
					"panel.filters": "筛选笔记",
					"panel.tags": "标签",
					"panel.allTags": "全部标签",
					"panel.filterAll": "全部",
					"panel.filterOpen": "未完成",
					"panel.filterDone": "已完成",
					"panel.copy": "复制",
					"panel.copied": "已复制。",
					"panel.copyFailed": "复制失败。",
					"panel.copyAll": "复制全部",
					"panel.copyAllDone": "已复制当前可见的笔记为 Markdown。",
					"panel.insert": "插入",
					"panel.inserted": "已插入草稿。",
					"panel.insertUnavailable": "当前没有可用的输入框。",
					"panel.done": "完成",
					"panel.reopen": "重新打开",
					"panel.delete": "删除",
					"panel.deleteHint": "删除这条笔记，随后可以撤销。",
					"panel.deleted": "笔记已删除。",
					"panel.deletedCount": "已删除 {count} 条笔记。",
					"panel.deleteUndone": "笔记已恢复。",
					"panel.deletesUndone": "笔记已恢复。",
					"panel.undoAll": "全部撤销",
					"panel.dismiss": "关闭提示",
					"panel.completed": "笔记已更新。",
					"panel.undo": "撤销",
					"toolbar.capture": "随手记",
					"overlay.title": "保存随手记",
					"overlay.viewAll": "查看全部",
					"overlay.viewAllCount": "查看全部（{count}）",
					"overlay.cancel": "取消",
					"overlay.save": "保存笔记",
					"overlay.saveClear": "保存并清空输入框",
					"overlay.empty": "没有可保存的内容。",
					"parked.saved": "已收进随手记",
					"parked.open": "打开列表",
					"parked.undo": "撤销",
					"parked.dismiss": "关闭提示",
					"shortcut.open": "打开随手记"
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
			ctx.slots.inject("conversation.input.dock", () => ctx.slots.register({
				name: "conversation.input.dock",
				id: "quicknote.parked",
				order: 20,
				locale: NS,
				inject: (sessionId) => ({ captureSessionId: sessionId })
			}, ParkedBar));
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "quicknote.overlay",
				order: 40,
				locale: NS
			}, Overlay));
			if (typeof ctx.inject !== "function") return;
			ctx.inject(["shortcuts"], (scope) => {
				let shortcuts;
				try {
					shortcuts = scope.get("shortcuts");
				} catch {
					return;
				}
				if (typeof shortcuts?.register !== "function") return;
				scope.effect(() => {
					const binding = {
						code: "KeyS",
						modifiers: ["primary", "alt"]
					};
					return shortcuts.register({
						id: "quicknote.open",
						label: () => ctx.locale.bind(NS)("shortcut.open"),
						aliases: [
							"capture",
							"note",
							"quicknote",
							"随手记",
							"备忘"
						],
						defaults: {
							"desktop:macos": binding,
							"desktop:windows": binding,
							"desktop:linux": binding,
							"web:macos": binding,
							"web:windows": binding
						},
						regions: [
							"page",
							"editable",
							"terminal"
						],
						modals: [],
						resolve: () => ({
							status: "handled",
							run: openCapture
						})
					});
				}, "dsh-quicknote: shortcut");
			});
		}
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});
