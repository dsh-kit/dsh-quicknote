import { describe, expect, it } from "vitest";

import { stashCaptureText, takeCaptureText } from "../src/client/capture.ts";

describe("capture text stash", () => {
  it("restores the text typed in the card for the same Session", () => {
    stashCaptureText("session-1", "typed in the card");
    expect(takeCaptureText("session-1", "composer draft")).toBe("typed in the card");
  });

  it("falls back to the draft for another Session", () => {
    stashCaptureText("session-1", "typed in the card");
    expect(takeCaptureText("session-2", "composer draft")).toBe("composer draft");
  });

  it("consumes the stash, so the next open shows the draft again", () => {
    stashCaptureText("session-1", "typed in the card");
    expect(takeCaptureText("session-1", "composer draft")).toBe("typed in the card");
    expect(takeCaptureText("session-1", "composer draft")).toBe("composer draft");
  });

  it("handles a card opened without a Session", () => {
    stashCaptureText(undefined, "typed in the card");
    expect(takeCaptureText(undefined, "")).toBe("typed in the card");
  });
});
