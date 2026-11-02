import { useEffect, useState } from "react";

import { API } from "../shared/constants.ts";
import { setParked } from "./parked.ts";
import { composerOf, originOf } from "./session.ts";

interface OpenDetail {
  sessionId?: string;
  text: string;
}

/** Capture card in the shell overlay; saves a note and optionally clears the draft. */
export function Overlay({ t }: { t: (key: string) => string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [draftText, setDraftText] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<OpenDetail>).detail;
      setText(detail?.text ?? "");
      setDraftText(detail?.text ?? "");
      setSessionId(detail?.sessionId);
      setError("");
      setOpen(true);
    };
    window.addEventListener("dsh-quicknote:open", onOpen);
    return () => window.removeEventListener("dsh-quicknote:open", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function save(clearDraft: boolean) {
    if (text.trim() === "" || saving) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${API}/notes/create`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, origin: originOf(sessionId) }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        note?: { id: string };
      };
      if (!response.ok || !result.ok) throw new Error(result.error ?? "save-failed");
      if (clearDraft && sessionId !== undefined && result.note?.id) {
        setParked({
          noteId: result.note.id,
          text,
          draftText,
          sessionId,
        });
        try {
          composerOf(sessionId)?.actions.setDraft("");
        } catch {
          // The note is already saved; refusing to clear is the safe failure.
        }
      }
      setOpen(false);
      window.dispatchEvent(new Event("dsh-quicknote:changed"));
    } catch (cause) {
      setError(String((cause as Error).message));
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15,17,21,.45)",
        padding: 24,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("overlay.title")}
        style={{
          width: "min(560px, 100%)",
          padding: 20,
          borderRadius: 14,
          background: "var(--dsw-alias-bg-overlay, #fff)",
          boxShadow: "var(--dsw-elevation-panel, 0 24px 70px rgba(0,0,0,.3))",
          color: "var(--dsw-alias-label-primary, inherit)",
          colorScheme: "light dark",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18 }}>{t("overlay.title")}</h2>
        <textarea
          data-testid="quicknote-overlay-input"
          autoFocus
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={5}
          style={{
            width: "100%",
            boxSizing: "border-box",
            marginTop: 12,
            padding: 10,
            borderRadius: 8,
            border: "1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24))",
            background: "var(--dsw-alias-bg-layer-1, transparent)",
            color: "var(--dsw-alias-label-primary, inherit)",
            font: "inherit",
            resize: "vertical",
          }}
        />
        {error === "" ? null : (
          <p
            role="alert"
            style={{ color: "var(--dsw-alias-state-error-primary, #c0392b)", margin: "8px 0 0" }}
          >
            {error}
          </p>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 14,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{
              padding: "7px 12px",
              borderRadius: 8,
              border: "1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24))",
              background: "var(--dsw-alias-bg-layer-1, transparent)",
              color: "var(--dsw-alias-label-primary, inherit)",
              font: "inherit",
              cursor: "pointer",
            }}
          >
            {t("overlay.cancel")}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save(false)}
            style={{
              padding: "7px 12px",
              borderRadius: 8,
              border: "1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24))",
              background: "var(--dsw-alias-bg-layer-1, transparent)",
              color: "var(--dsw-alias-label-primary, inherit)",
              font: "inherit",
              cursor: "pointer",
            }}
          >
            {t("overlay.save")}
          </button>
          <button
            type="button"
            disabled={saving || sessionId === undefined}
            onClick={() => void save(true)}
            style={{
              padding: "7px 12px",
              borderRadius: 8,
              border: "1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24))",
              background: "var(--dsw-alias-bg-layer-1, transparent)",
              color: "var(--dsw-alias-label-primary, inherit)",
              font: "inherit",
              cursor: "pointer",
            }}
          >
            {t("overlay.saveClear")}
          </button>
        </div>
      </div>
    </div>
  );
}
