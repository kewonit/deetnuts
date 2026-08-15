"use client";

import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface DigitGroupProps {
  value: string;
  className?: string;
}

export function DigitGroup({ value, className }: DigitGroupProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const group = ref.current;
    if (!group) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const chars = value.split("");

    group.classList.remove("is-animating");
    group.replaceChildren();

    for (const [index, char] of chars.entries()) {
      const span = document.createElement("span");
      span.className = "t-digit";
      span.textContent = char;
      if (index === chars.length - 2) span.dataset.stagger = "1";
      else if (index === chars.length - 1) span.dataset.stagger = "2";
      group.appendChild(span);
    }

    if (prefersReducedMotion) return;

    void group.offsetHeight;
    group.classList.add("is-animating");
  }, [value]);

  return <span ref={ref} className={cn("t-digit-group", className)} />;
}
