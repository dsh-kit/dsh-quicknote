import { useSyncExternalStore } from "react";

export interface ParkedDraft {
  noteId: string;
  text: string;
  draftText: string;
  sessionId: string;
}

let current: ParkedDraft | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function setParked(next: ParkedDraft | null): void {
  current = next;
  emit();
}

export function parkedDraft(): ParkedDraft | null {
  return current;
}

export function useParkedDraft(): ParkedDraft | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    parkedDraft,
    parkedDraft,
  );
}
