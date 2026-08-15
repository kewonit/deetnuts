"use client";

import { classifyBand } from "@ejam/data/college-predictor";
import { useEffect, useMemo, useRef, useState } from "react";
import { BAND_STYLES } from "@/lib/bands";
import { cn } from "@/lib/utils";

const DEFAULT_BAR_COUNT = 6;
const MIN_SCALE = 0.12;
const BAR_RISE_MS = 240;
const BAR_STAGGER_MS = 35;

interface RoundProbabilityBarsProps {
  roundProbs: Array<number | null>;
  overallProbability: number;
  roundDetails?: Array<{
    predictedClosingRank: number;
    latestHistoricalPercentile: number | null;
    sourceCode: string;
    allocationScopeId: string;
    dataQuality: "inferred" | "pooled";
  } | null>;
  roundAvailability?: Array<{
    status: string;
    reason: string;
  }>;
  fillRound?: number;
  className?: string;
  interactive?: boolean;
  roundCount?: 4 | 6;
}
type RoundDetail = NonNullable<
  RoundProbabilityBarsProps["roundDetails"]
>[number];

function clampProbability(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function toPercent(value: number): number {
  return Math.round(clampProbability(value) * 100);
}

type BarHitRegion = { round: number; center: number };

/** Measure bar centers once; avoids layout reads on every mousemove. */
function measureBarHits(root: HTMLElement): BarHitRegion[] {
  const bars = Array.from(root.querySelectorAll<HTMLElement>(".t-round-bar"));
  return bars.map((bar) => {
    const rect = bar.getBoundingClientRect();
    return {
      round: Number(bar.dataset.round ?? 1),
      center: rect.left + rect.width / 2,
    };
  });
}

function roundAtPointer(
  hits: BarHitRegion[],
  rootLeft: number,
  rootRight: number,
  clientX: number,
): number | null {
  if (hits.length === 0) return null;
  if (clientX < rootLeft || clientX > rootRight) return null;

  let bestRound = hits[0]?.round ?? 1;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const { round, center } of hits) {
    const distance = Math.abs(clientX - center);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestRound = round;
    }
  }

  return bestRound;
}

function renderBar(
  prob: number | null,
  index: number,
  fillRound: number | undefined,
  Wrapper: "button" | "div",
  detail?: RoundDetail,
  unavailableReason?: string,
  wrapperProps?: Record<string, unknown>,
) {
  const roundNum = index + 1;
  if (prob === null) {
    const unavailableLabel = `Round ${roundNum}: ${unavailableReason ?? "No official eligible cutoff published for this round"}`;
    const isActive = wrapperProps?.["data-active"] !== undefined;
    const bar = (
      <span
        className="t-round-bar inline-flex h-3 w-[7px] shrink-0 items-center justify-center text-[9px] leading-none text-muted-foreground/60"
        data-round={roundNum}
        data-unavailable=""
        style={{
          animation: "none",
          opacity: isActive ? 0.85 : 0.5,
          transform: "none",
          transition: "opacity var(--round-bar-dur) var(--round-bar-ease)",
        }}
        aria-hidden
      >
        —
      </span>
    );
    if (Wrapper === "div") {
      return (
        <div
          key={roundNum}
          className="t-round-bar-hit flex shrink-0 items-end justify-center"
          {...wrapperProps}
        >
          {bar}
        </div>
      );
    }
    return (
      <button
        key={roundNum}
        type="button"
        className="t-round-bar-hit flex shrink-0 items-end justify-center"
        data-round={roundNum}
        aria-label={unavailableLabel}
        title={unavailableLabel}
        {...wrapperProps}
      >
        {bar}
      </button>
    );
  }
  const clamped = clampProbability(prob);
  const band = classifyBand(clamped);
  const { color } = BAND_STYLES[band];
  const scale = Math.max(MIN_SCALE, clamped);

  const bar = (
    <div
      className="t-round-bar h-3 w-[3px] shrink-0 rounded-none"
      data-round={roundNum}
      data-fill-round={fillRound === roundNum ? "" : undefined}
      data-band={band}
      style={
        {
          "--bar-scale": String(scale),
          backgroundColor: color,
        } as React.CSSProperties
      }
    />
  );

  if (Wrapper === "div") {
    return (
      <div
        key={roundNum}
        className="t-round-bar-hit flex shrink-0 items-end justify-center"
        {...wrapperProps}
      >
        {bar}
      </div>
    );
  }

  const { label } = BAND_STYLES[band];
  const roundPct = toPercent(clamped);
  const detailLabel = detail
    ? `; point forecast rank ${detail.predictedClosingRank.toLocaleString("en-IN")}; historical pool ${detail.sourceCode}; ${detail.allocationScopeId.replaceAll("-", " ")}; ${detail.dataQuality}`
    : "";
  const accessibleLabel = `Round ${roundNum}: ${roundPct}% (${label})${detailLabel}`;
  return (
    <button
      key={roundNum}
      type="button"
      className="t-round-bar-hit flex shrink-0 items-end justify-center"
      data-round={roundNum}
      aria-label={accessibleLabel}
      title={accessibleLabel}
      {...wrapperProps}
    >
      {bar}
    </button>
  );
}

export function RoundProbabilityBars({
  roundProbs,
  overallProbability,
  roundDetails,
  roundAvailability,
  fillRound,
  className,
  interactive = true,
  roundCount = DEFAULT_BAR_COUNT,
}: RoundProbabilityBarsProps) {
  const barsRef = useRef<HTMLDivElement>(null);
  const barHitsRef = useRef<BarHitRegion[]>([]);
  const barBoundsRef = useRef({ left: 0, right: 0 });
  const [hoveredRound, setHoveredRound] = useState<number | null>(null);

  const rounds = useMemo(() => {
    const next = roundProbs.slice(0, roundCount);
    while (next.length < roundCount) {
      next.push(null);
    }
    return next;
  }, [roundProbs, roundCount]);

  const overallPct = toPercent(overallProbability);
  const roundSummary = rounds
    .map((probability, index) => {
      if (probability === null) {
        return `Round ${index + 1}: ${roundAvailability?.[index]?.reason ?? "no official eligible cutoff published"}`;
      }
      const detail = roundDetails?.[index];
      return detail
        ? `Round ${index + 1}: ${toPercent(probability)}%, point forecast rank ${detail.predictedClosingRank.toLocaleString("en-IN")}, ${detail.sourceCode}, ${detail.allocationScopeId.replaceAll("-", " ")}`
        : `Round ${index + 1}: ${toPercent(probability)}%`;
    })
    .join(". ");
  const displayPct =
    hoveredRound === null
      ? overallPct
      : rounds[hoveredRound - 1] === null
        ? null
        : toPercent(rounds[hoveredRound - 1] ?? 0);

  // Freeze bars after each entrance so DOM moves never restart animation mid-flight.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run when round data changes
  useEffect(() => {
    if (!interactive) return;
    const root = barsRef.current;
    if (!root) return;

    const bars = Array.from(root.querySelectorAll<HTMLElement>(".t-round-bar"));
    if (bars.length === 0) return;

    let remaining = bars.length;

    const freeze = (bar: HTMLElement) => {
      bar.style.animation = "none";
    };

    const onEnd = (event: Event) => {
      const animEvent = event as AnimationEvent;
      if (animEvent.animationName !== "round-bar-rise") return;
      if (!(event.currentTarget instanceof HTMLElement)) return;

      freeze(event.currentTarget);
      remaining -= 1;
      if (remaining <= 0) {
        for (const bar of bars) {
          bar.removeEventListener("animationend", onEnd);
        }
      }
    };

    for (const bar of bars) {
      bar.addEventListener("animationend", onEnd);
    }

    const fallback = window.setTimeout(
      () => {
        for (const bar of bars) {
          bar.removeEventListener("animationend", onEnd);
          freeze(bar);
        }
      },
      BAR_RISE_MS + BAR_STAGGER_MS * (roundCount - 1) + 50,
    );

    return () => {
      window.clearTimeout(fallback);
      for (const bar of bars) {
        bar.removeEventListener("animationend", onEnd);
      }
    };
  }, [rounds, interactive, roundCount]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure bar centers when round data changes
  useEffect(() => {
    if (!interactive) return;
    const root = barsRef.current;
    if (!root) return;

    const syncBarHits = () => {
      const { left, right } = root.getBoundingClientRect();
      barBoundsRef.current = { left, right };
      barHitsRef.current = measureBarHits(root);
    };

    syncBarHits();
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(syncBarHits);
    observer.observe(root);
    return () => observer.disconnect();
  }, [rounds, interactive]);

  if (!interactive) {
    return (
      <div className={cn("flex min-w-0 items-center gap-2", className)}>
        <div className="flex items-center gap-2" aria-hidden>
          <div className="t-round-bars flex items-end gap-[2px]">
            {rounds.map((prob, index) =>
              renderBar(
                prob,
                index,
                fillRound,
                "div",
                roundDetails?.[index],
                roundAvailability?.[index]?.reason,
              ),
            )}
          </div>
          <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
            {overallPct}%
          </span>
        </div>
        <span className="sr-only">{roundSummary}</span>
      </div>
    );
  }

  return (
    <fieldset
      className={cn("flex min-w-0 items-center gap-2 border-0 p-0", className)}
    >
      <legend className="sr-only">Admission chance by round</legend>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: pointer hover between bar buttons */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard focus handled by bar buttons */}
      <div
        className="t-round-bars-track"
        onMouseMove={(event) => {
          const root = barsRef.current;
          if (root && barHitsRef.current.length === 0) {
            const { left, right } = root.getBoundingClientRect();
            barBoundsRef.current = { left, right };
            barHitsRef.current = measureBarHits(root);
          }
          const { left, right } = barBoundsRef.current;
          const round = roundAtPointer(
            barHitsRef.current,
            left,
            right,
            event.clientX,
          );
          if (round !== null) setHoveredRound(round);
        }}
        onMouseLeave={() => setHoveredRound(null)}
        onClick={(event) => event.stopPropagation()}
        onFocusCapture={(event) => {
          const hit = (event.target as HTMLElement).closest(".t-round-bar-hit");
          const round = hit?.getAttribute("data-round");
          if (round) setHoveredRound(Number(round));
        }}
        onBlurCapture={(event) => {
          if (!barsRef.current?.contains(event.relatedTarget as Node)) {
            setHoveredRound(null);
          }
        }}
      >
        <div
          ref={barsRef}
          className="t-round-bars flex items-end gap-[2px]"
          data-hovering={hoveredRound !== null ? "" : undefined}
        >
          {rounds.map((prob, index) => {
            const roundNum = index + 1;
            return renderBar(
              prob,
              index,
              fillRound,
              "button",
              roundDetails?.[index],
              roundAvailability?.[index]?.reason,
              {
                "data-active": hoveredRound === roundNum ? "" : undefined,
                onFocus: () => setHoveredRound(roundNum),
                onClick: (event: { stopPropagation: () => void }) =>
                  event.stopPropagation(),
              },
            );
          })}
        </div>
      </div>
      <span
        key={hoveredRound === null ? "avg" : `r${hoveredRound}-${displayPct}`}
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          "t-round-chance w-10 shrink-0 text-right text-xs tabular-nums transition-colors duration-150 ease-out",
          hoveredRound === null ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {displayPct === null ? "—" : `${displayPct}%`}
      </span>
    </fieldset>
  );
}
