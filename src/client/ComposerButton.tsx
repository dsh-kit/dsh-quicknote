import { sessionIdNear, draftOf } from "./session.ts";

/** A labelled button in the composer toolbar. No icon-only destructive control. */
export function ComposerButton({ t }: { t: (key: string) => string }) {
  function open(event: any) {
    const sessionId = sessionIdNear(event.currentTarget);
    window.dispatchEvent(
      new CustomEvent("dsh-quicknote:open", { detail: { sessionId, text: draftOf(sessionId) } }),
    );
  }
  return (
    <button
      type="button"
      onClick={open}
      data-testid="quicknote-composer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 9px",
        borderRadius: 8,
        border: "1px solid var(--dsw-alias-line, #d9dce1)",
        background: "transparent",
        color: "inherit",
        font: "inherit",
        cursor: "pointer",
      }}
    >
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
        <rect x="2.75" y="2.75" width="10.5" height="10.5" rx="2" stroke="currentColor" />
        <path d="M5.5 8h5" stroke="currentColor" strokeLinecap="round" />
      </svg>
      {t("toolbar.capture")}
    </button>
  );
}
