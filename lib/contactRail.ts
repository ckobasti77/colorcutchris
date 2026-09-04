"use client";

import { useSyncExternalStore } from "react";

/**
 * Sitan spoljni store: ko god hoće da skloni mobilnu kontakt-traku (npr. wizard
 * na koraku „Podaci", da traka ne prekrije dugmad) pozove `setContactRailSuppressed`.
 * ContactRail sluša preko `useContactRailSuppressed`.
 */
let suppressed = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setContactRailSuppressed(value: boolean): void {
  if (suppressed === value) return;
  suppressed = value;
  for (const l of listeners) l();
}

export function useContactRailSuppressed(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => suppressed,
    () => false,
  );
}
