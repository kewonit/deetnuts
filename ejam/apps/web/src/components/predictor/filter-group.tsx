"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ChipIcon } from "./chip-icon";

interface GridIndicatorPosition {
  width: number;
  height: number;
  x: number;
  y: number;
}

export function FilterGroup({
  label,
  iconSrc,
  children,
  vertical,
  grid,
  slidingCols,
  slidingRows = 1,
  slidingIndex,
}: {
  label: string;
  iconSrc?: string;
  children: React.ReactNode;
  vertical?: boolean;
  grid?: 2;
  slidingCols?: 2 | 3 | 4;
  slidingRows?: 1 | 2;
  /** Index of the sole active chip for the shared outline (null when 0 or 2+ selected). */
  slidingIndex?: number | null;
}) {
  const cols = slidingCols ?? (vertical && grid === 2 ? 2 : undefined);
  const rows = slidingCols == null && vertical && grid === 2 ? 2 : slidingRows;
  const useSlidingGrid = cols != null;
  const useMeasuredGrid = rows === 2;

  const gapToken =
    cols === 4 || rows === 2 ? "15" : cols === 2 && !vertical ? "2" : "1";

  const trackRef = useRef<HTMLDivElement>(null);
  const [layoutReady, setLayoutReady] = useState(false);
  const [gridIndicatorPosition, setGridIndicatorPosition] =
    useState<GridIndicatorPosition | null>(null);

  const measureGridLayout = useCallback(() => {
    if (!useMeasuredGrid || slidingIndex == null || slidingIndex < 0) {
      setGridIndicatorPosition(null);
      return;
    }

    const track = trackRef.current;
    if (!track) return;

    const tiles = track.querySelectorAll<HTMLElement>(".sliding-toggle-tile");
    const tile = tiles[slidingIndex];
    if (!tile) return;

    const trackRect = track.getBoundingClientRect();
    const rect = tile.getBoundingClientRect();
    const next: GridIndicatorPosition = {
      width: rect.width,
      height: rect.height,
      x: rect.left - trackRect.left,
      y: rect.top - trackRect.top,
    };

    if (next.width <= 0 || next.height <= 0) return;

    setGridIndicatorPosition(next);
    if (!layoutReady) setLayoutReady(true);
  }, [layoutReady, slidingIndex, useMeasuredGrid]);

  useLayoutEffect(() => {
    if (!useMeasuredGrid) return;
    measureGridLayout();
  }, [measureGridLayout, useMeasuredGrid]);

  useLayoutEffect(() => {
    if (!useMeasuredGrid) return;

    const track = trackRef.current;
    if (!track) return;

    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measureGridLayout);
    });

    observer.observe(track);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [measureGridLayout, useMeasuredGrid]);

  return (
    <div
      className={cn(
        "flex gap-1.5",
        vertical ? "flex-col items-stretch" : "items-center",
        cols === 4 && !vertical && "w-full",
      )}
    >
      <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        {iconSrc ? <ChipIcon src={iconSrc} className="size-2.5" /> : null}
        {label}
      </span>
      {useSlidingGrid ? (
        <div
          ref={useMeasuredGrid ? trackRef : undefined}
          className={cn(
            "sliding-toggle-track",
            cols === 4 && !vertical && "min-w-0 flex-1",
            vertical && "w-full",
          )}
          data-gap={gapToken}
          data-rows={rows === 2 ? "2" : undefined}
        >
          {slidingIndex != null && slidingIndex >= 0 ? (
            useMeasuredGrid ? (
              <span
                aria-hidden
                data-ready={layoutReady ? "" : undefined}
                className="sliding-toggle-indicator sliding-toggle-indicator--grid"
                style={
                  gridIndicatorPosition
                    ? {
                        width: gridIndicatorPosition.width,
                        height: gridIndicatorPosition.height,
                        transform: `translate3d(${gridIndicatorPosition.x}px, ${gridIndicatorPosition.y}px, 0)`,
                      }
                    : undefined
                }
              />
            ) : (
              <span
                aria-hidden
                className="sliding-toggle-indicator"
                data-cols={String(cols)}
                data-gap={gapToken}
                data-index={String(slidingIndex)}
              />
            )
          ) : null}
          <div
            className={cn(
              "sliding-toggle-grid grid",
              cols === 2 && "grid-cols-2",
              cols === 3 && "grid-cols-3",
              cols === 4 && "grid-cols-4",
            )}
          >
            {children}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            vertical && !grid && "flex w-full flex-wrap",
            !vertical && "flex flex-wrap items-center",
            vertical && grid && "grid grid-cols-2 gap-1.5",
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
