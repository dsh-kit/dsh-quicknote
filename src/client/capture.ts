/**
 * Unsaved capture text parked while the card sends the user to the notes page.
 *
 * @module dsh-quicknote/client/capture
 */

let stashed: { sessionId: string | undefined; text: string } | null = null;

/** Remember the text the user typed before leaving the card for the notes page. */
export function stashCaptureText(sessionId: string | undefined, text: string): void {
  stashed = { sessionId, text };
}

/**
 * The text to show when the card opens again: the stashed edit for the same
 * Session, otherwise the composer draft. Reading consumes the stash.
 */
export function takeCaptureText(sessionId: string | undefined, draft: string): string {
  const entry = stashed;
  stashed = null;
  return entry !== null && entry.sessionId === sessionId ? entry.text : draft;
}
