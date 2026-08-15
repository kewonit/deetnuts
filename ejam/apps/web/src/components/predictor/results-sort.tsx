"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ResultsSortKey } from "@/components/predictor/results-sort-logic";
import { cn } from "@/lib/utils";
import { ChipIcon } from "./chip-icon";

const SORT_OPTIONS: Array<{
  id: ResultsSortKey;
  label: string;
  iconSrc: string;
}> = [
  { id: "balanced", label: "Balanced", iconSrc: "/icons/balance.svg" },
  { id: "chance", label: "Best chance", iconSrc: "/icons/stars.svg" },
  { id: "closing-rank", label: "Closing rank", iconSrc: "/icons/rank.svg" },
  {
    id: "institute",
    label: "Alphabetical",
    iconSrc: "/icons/alphabetical-sorting.svg",
  },
];

const SLIDE_MS = 240;

interface IndicatorPosition {
  width: number;
  x: number;
}

interface ResultsSortProps {
  sortBy: ResultsSortKey;
  onChange: (next: ResultsSortKey) => void;
  supportedModes?: readonly ResultsSortKey[];
  compactMobile?: boolean;
}

function positionsChanged(
  previous: IndicatorPosition[],
  next: IndicatorPosition[],
): boolean {
  if (previous.length !== next.length) return true;

  return next.some((position, index) => {
    const prior = previous[index];
    if (!prior) return true;
    return (
      Math.abs(prior.width - position.width) > 0.5 ||
      Math.abs(prior.x - position.x) > 0.5
    );
  });
}

export function ResultsSort({
  sortBy,
  onChange,
  supportedModes,
  compactMobile = false,
}: ResultsSortProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const positionsRef = useRef<IndicatorPosition[]>([]);
  const animatingUntilRef = useRef(0);
  const prevActiveIndexRef = useRef(0);

  const [layoutReady, setLayoutReady] = useState(false);
  const [positions, setPositions] = useState<IndicatorPosition[]>([]);

  const options = useMemo(
    () =>
      supportedModes
        ? SORT_OPTIONS.filter((option) => supportedModes.includes(option.id))
        : SORT_OPTIONS,
    [supportedModes],
  );
  const activeIndex = options.findIndex((option) => option.id === sortBy);

  if (layoutReady && prevActiveIndexRef.current !== activeIndex) {
    animatingUntilRef.current = performance.now() + SLIDE_MS + 32;
    prevActiveIndexRef.current = activeIndex;
  }

  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const measureLayout = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const trackRect = track.getBoundingClientRect();
    const next = options.map((_, index) => {
      const button = itemRefs.current[index];
      if (!button) return { width: 0, x: 0 };

      const rect = button.getBoundingClientRect();
      return {
        width: rect.width,
        x: rect.left - trackRect.left,
      };
    });

    if (next.every((position) => position.width <= 0)) return;

    const changed = positionsChanged(positionsRef.current, next);
    positionsRef.current = next;

    if (!layoutReady) {
      prevActiveIndexRef.current = activeIndexRef.current;
      setPositions(next);
      setLayoutReady(true);
      return;
    }

    if (changed && performance.now() >= animatingUntilRef.current) {
      setPositions(next);
    }
  }, [layoutReady, options]);

  useLayoutEffect(() => {
    measureLayout();
  }, [measureLayout]);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let frame = 0;
    const observer = new ResizeObserver(() => {
      if (performance.now() < animatingUntilRef.current) return;

      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measureLayout);
    });

    observer.observe(track);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [measureLayout]);

  const indicatorIndex = activeIndex >= 0 ? activeIndex : 0;
  const indicatorPosition = positions[indicatorIndex];

  const handleTransitionEnd = (
    event: React.TransitionEvent<HTMLSpanElement>,
  ) => {
    if (event.propertyName !== "transform") return;
    animatingUntilRef.current = 0;
  };

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase",
          compactMobile && "max-sm:hidden",
        )}
      >
        Sort by
      </span>
      <div
        ref={trackRef}
        className="sort-toggle-track sliding-toggle-track no-scrollbar inline-flex h-8 min-w-0 max-w-full items-center overflow-x-auto"
      >
        <span
          aria-hidden
          data-ready={layoutReady ? "" : undefined}
          className="sliding-toggle-indicator sliding-toggle-indicator--sort"
          style={
            indicatorPosition
              ? {
                  width: indicatorPosition.width,
                  transform: `translate3d(${indicatorPosition.x}px, 0, 0)`,
                }
              : undefined
          }
          onTransitionEnd={handleTransitionEnd}
        />
        <div className="sliding-toggle-grid grid">
          {options.map((option, index) => {
            const isActive = sortBy === option.id;

            return (
              <button
                key={option.id}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                type="button"
                aria-pressed={isActive}
                onClick={() => onChange(option.id)}
                className={cn(
                  "sort-chip sliding-toggle-tile inline-flex h-8 shrink-0 items-center gap-1.5 rounded-none px-2.5 text-xs font-medium text-muted-foreground outline-none",
                  "hover:text-foreground",
                  "focus-visible:ring-3 focus-visible:ring-ring/50",
                  isActive && "text-foreground",
                )}
              >
                <ChipIcon src={option.iconSrc} />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
