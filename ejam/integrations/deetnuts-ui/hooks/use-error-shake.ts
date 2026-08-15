"use client";

import { useCallback, useEffect, useRef } from "react";

function readMotionMs(name: string, fallback: number): number {
  const value = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(name),
  );
  return Number.isFinite(value) ? value : fallback;
}

export function useErrorShake() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearError = useCallback(() => {
    const wrap = wrapRef.current;
    const input = wrap?.querySelector<HTMLElement>(".t-input");
    if (!wrap || !input) return;

    wrap.classList.remove("is-error");
    input.classList.remove("is-error", "is-shaking");
  }, []);

  const showError = useCallback(() => {
    const wrap = wrapRef.current;
    const input = wrap?.querySelector<HTMLElement>(".t-input");
    if (!wrap || !input) return;

    wrap.classList.add("is-error");
    input.classList.add("is-error");

    input.classList.remove("is-shaking");
    void input.offsetWidth;
    input.classList.add("is-shaking");

    const shakeMs =
      readMotionMs("--shake-dur-a", 80) * 2 +
      readMotionMs("--shake-dur-b", 60) * 2;

    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    shakeTimerRef.current = setTimeout(() => {
      input.classList.remove("is-shaking");
      shakeTimerRef.current = null;
    }, shakeMs + 20);
  }, []);

  useEffect(
    () => () => {
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    },
    [],
  );

  return { wrapRef, showError, clearError };
}
