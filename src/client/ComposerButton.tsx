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
        <rect
          x="2.25"
          y="2.25"
          width="11.5"
          height="11.5"
          rx="3.1"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <path
          d="M5.1 6.1h5.8M5.1 8.1h5.8M5.1 10.1h3.5"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <circle cx="11.4" cy="10.1" r=".8" fill="currentColor" />
      </svg>
      {t("toolbar.capture")}
    </button>
  );
}
