"use client";

import { useCallback, useEffect, useRef } from "react";

function readMotionNumber(name: string, fallback: number): number {
  const value = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(name),
  );
  return Number.isFinite(value) ? value : fallback;
}

function readMotionEase(name: string, fallback: string): string {
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

export function useAvatarGroupHover() {
  const rootRef = useRef<HTMLDivElement>(null);

  const setShifts = useCallback(
    (activeIdx: number | null, phase: "in" | "out") => {
      const root = rootRef.current;
      if (!root) return;

      const lift = readMotionNumber("--avatar-lift", -4);
      const falloff = readMotionNumber("--avatar-falloff", 0.45);
      const scale = readMotionNumber("--avatar-scale", 1.05);
      const timingFunction =
        phase === "out"
          ? readMotionEase(
              "--avatar-ease-out",
              "cubic-bezier(0.34, 3.85, 0.64, 1)",
            )
          : readMotionEase(
              "--avatar-ease-in",
              "cubic-bezier(0.22, 1, 0.36, 1)",
            );

      root.querySelectorAll<HTMLElement>(".t-avatar").forEach((el, i) => {
        el.style.transitionTimingFunction = timingFunction;
        if (activeIdx === null) {
          el.style.setProperty("--shift", "0px");
          el.style.setProperty("--scale-active", "1");
          return;
        }
        const distance = Math.abs(i - activeIdx);
        el.style.setProperty(
          "--shift",
          `${(lift * falloff ** distance).toFixed(3)}px`,
        );
        el.style.setProperty(
          "--scale-active",
          i === activeIdx ? String(scale) : "1",
        );
      });
    },
    [],
  );

  const onItemEnter = useCallback(
    (index: number) => setShifts(index, "in"),
    [setShifts],
  );

  const onGroupLeave = useCallback(() => setShifts(null, "out"), [setShifts]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.addEventListener("mouseleave", onGroupLeave);
    return () => root.removeEventListener("mouseleave", onGroupLeave);
  }, [onGroupLeave]);

  return { rootRef, onItemEnter, onGroupLeave };
}
