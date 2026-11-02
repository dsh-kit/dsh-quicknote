import { useState } from "react";

import { API } from "../shared/constants.ts";
import { setParked, useParkedDraft } from "./parked.ts";
import { composerOf, draftOf, openPanel } from "./session.ts";

/** Receipt above the composer after a draft has been moved into Quick Note. */
export function ParkedBar({
  t,
  captureSessionId,
}: {
  t: (key: string) => string;
  captureSessionId?: string;
}) {
  const parked = useParkedDraft();
  const [busy, setBusy] = useState(false);
  if (!parked) return null;
  if (captureSessionId !== undefined && parked.sessionId !== captureSessionId) return null;

  const preview = parked.text.length > 72 ? `${parked.text.slice(0, 72)}…` : parked.text;

  async function undo() {
    if (!parked || busy) return;
    setBusy(true);
    try {
      const response = await fetch(`${API}/notes/delete`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: parked.noteId }),
      });
      if (!response.ok) throw new Error(`undo-failed-${response.status}`);
      const composer = composerOf(parked.sessionId);
      if (composer) {
        const current = draftOf(parked.sessionId);
        const next =
          current.trim() === ""
            ? parked.draftText
            : `${current.replace(/\s+$/, "")}\n\n${parked.draftText}`;
        composer.actions.setDraft(next);
      }
      setParked(null);
      window.dispatchEvent(new Event("dsh-quicknote:changed"));
    } catch {
      // Leave the receipt in place; the note still exists and can be retried.
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="status"
      style={{
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
        lineHeight: "18px",
      }}
    >
      <span
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {t("parked.saved")} · {preview}
      </span>
      <button
        type="button"
        onClick={openPanel}
        style={{
          border: 0,
          background: "none",
          color: "var(--dsw-alias-brand-primary, #4d6bfe)",
          font: "inherit",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {t("parked.open")}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => void undo()}
        style={{
          border: 0,
          background: "none",
          color: "var(--dsw-alias-label-secondary, inherit)",
          font: "inherit",
          cursor: busy ? "default" : "pointer",
          whiteSpace: "nowrap",
          opacity: busy ? 0.5 : 1,
        }}
      >
        {t("parked.undo")}
      </button>
      <button
        type="button"
        onClick={() => setParked(null)}
        aria-label={t("parked.dismiss")}
        style={{
          border: 0,
          background: "none",
          color: "var(--dsw-alias-label-tertiary, inherit)",
          font: "inherit",
          fontSize: 14,
          cursor: "pointer",
          padding: "0 2px",
        }}
      >
        ×
      </button>
    </div>
  );
}
