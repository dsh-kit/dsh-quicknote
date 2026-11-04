/**
 * Scoped page styles. Colours stay on DSH theme tokens so light and dark mode
 * come from the shell; the media queries handle narrow main columns.
 *
 * @module dsh-quicknote/client/styles
 */

export const PAGE_CSS = `
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
@media (max-width: 720px) {
  .qn-page { padding: 16px 14px 40px; }
  .qn-compose { flex-direction: column; align-items: stretch; }
  .qn-compose .qn-primary { width: 100%; }
  .qn-toolbar { grid-template-columns: minmax(0, 1fr) auto; }
  .qn-filters { grid-column: 1 / -1; overflow-x: auto; padding-bottom: 2px; }
  .qn-note { grid-template-columns: minmax(0, 1fr); gap: 8px; }
  .qn-note-actions { justify-content: flex-start; }
}
@media (max-width: 420px) {
  .qn-note-actions { gap: 6px; }
}
`;
