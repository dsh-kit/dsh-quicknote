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
        border: "1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24))",
        background: "transparent",
        color: "var(--dsw-alias-label-secondary, inherit)",
        font: "inherit",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
        <rect x="4" y="3.5" width="16" height="17" rx="3" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M8 8h8M8 12h8M8 16h5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      {t("toolbar.capture")}
    </button>
  );
}
