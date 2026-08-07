import { useSyncExternalStore } from "react";

/** App-wide sound preference for feed clips (starts muted for autoplay policies). */
let soundOn = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function setSoundOn(next: boolean) {
  if (soundOn === next) return;
  soundOn = next;
  emit();
}

export function useSoundOn() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => soundOn,
    () => false,
  );
}
