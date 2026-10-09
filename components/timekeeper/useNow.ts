"use client";
import { useSyncExternalStore } from "react";

let now = 0;
let clock: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();
function tick() {
  now = Date.now();
  listeners.forEach((notify) => notify());
}
function subscribe(notify: () => void) {
  listeners.add(notify);
  if (!clock) {
    tick();
    clock = setInterval(tick, 1000);
    window.addEventListener("pageshow", tick);
    document.addEventListener("visibilitychange", tick);
  }
  return () => {
    listeners.delete(notify);
    if (!listeners.size) {
      clearInterval(clock);
      clock = undefined;
      window.removeEventListener("pageshow", tick);
      document.removeEventListener("visibilitychange", tick);
    }
  };
}
export function useNow() {
  return useSyncExternalStore(
    subscribe,
    () => now,
    () => 0,
  );
}
