"use client";

import { ChevronDownIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { StaticPicture } from "@/components/ui/static-picture";
import type { ExamType } from "@/hooks/use-predictor-state";
import { deferAfterPress, pressableClass } from "@/lib/pressable";
import {
  EXAM_LOGO_ASSET_PX,
  EXAM_LOGO_SIZE,
  EXAM_LOGOS,
  type StaticImageSource,
} from "@/lib/static-image";
import { cn } from "@/lib/utils";

const PRIMARY_EXAM_OPTIONS: Array<{
  id: ExamType;
  label: string;
  shortLabel: string;
  logo: StaticImageSource;
}> = [
  {
    id: "jee-main",
    label: "JEE Main",
    shortLabel: "JEE Main",
    logo: EXAM_LOGOS["jee-main"],
  },
  {
    id: "jee-advanced",
    label: "JEE Advanced",
    shortLabel: "JEE Adv.",
    logo: EXAM_LOGOS["jee-advanced"],
  },
];

const MHT_EXAM_OPTION = {
  id: "mht-cet" as const,
  label: "MHT-CET",
  logo: EXAM_LOGOS["mht-cet"],
};

export function ExamPicker({
  value,
  onValueChange,
  mhtCetEnabled,
}: {
  value: ExamType;
  onValueChange: (exam: ExamType) => void;
  mhtCetEnabled: boolean;
}) {
  const [showMoreExams, setShowMoreExams] = useState(false);
  const pickerRef = useRef<HTMLFieldSetElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const moreExamOptionRef = useRef<HTMLButtonElement>(null);
  const primaryActiveIndex = PRIMARY_EXAM_OPTIONS.findIndex(
    (exam) => exam.id === value,
  );
  const isMhtCetSelected = value === MHT_EXAM_OPTION.id;
  const columnCount = mhtCetEnabled ? 3 : 2;
  const isMorePanelOpen = mhtCetEnabled && showMoreExams && !isMhtCetSelected;
  const activeIndex =
    isMhtCetSelected && mhtCetEnabled ? 2 : Math.max(0, primaryActiveIndex);
  const indicatorStyle =
    columnCount === 3
      ? {
          width: "calc((100% - 1rem) / 3)",
          transform:
            activeIndex === 2
              ? "translateX(calc(200% + 1rem))"
              : activeIndex === 1
                ? "translateX(calc(100% + 0.5rem))"
                : "translateX(0)",
        }
      : undefined;

  useEffect(() => {
    if (!isMorePanelOpen) return;
    const closeOnPointerOutside = (event: PointerEvent) => {
      const picker = pickerRef.current;
      if (
        picker &&
        event.target instanceof Node &&
        !picker.contains(event.target)
      ) {
        setShowMoreExams(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setShowMoreExams(false);
      requestAnimationFrame(() => moreButtonRef.current?.focus());
    };
    document.addEventListener("pointerdown", closeOnPointerOutside);
    document.addEventListener("keydown", closeOnEscape, true);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerOutside);
      document.removeEventListener("keydown", closeOnEscape, true);
    };
  }, [isMorePanelOpen]);

  const selectMhtCet = () => {
    deferAfterPress(() => {
      setShowMoreExams(false);
      onValueChange(MHT_EXAM_OPTION.id);
      requestAnimationFrame(() => moreButtonRef.current?.focus());
    });
  };

  return (
    <fieldset
      ref={pickerRef}
      className="h-[55px] min-w-0 overflow-hidden border-0 p-0"
    >
      <legend className="sr-only">Exam</legend>
      {isMorePanelOpen ? (
        <div className="grid h-full grid-cols-[2.5rem_minmax(0,1fr)] gap-1">
          <button
            type="button"
            aria-label="Back to main exams"
            onClick={() => {
              setShowMoreExams(false);
              requestAnimationFrame(() => moreButtonRef.current?.focus());
            }}
            className={cn(
              "flex h-[55px] items-center justify-center border border-border/80 text-muted-foreground outline-none",
              pressableClass,
              "hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
            )}
          >
            <ChevronDownIcon aria-hidden className="size-4 rotate-90" />
          </button>
          <button
            ref={moreExamOptionRef}
            type="button"
            aria-label="Select MHT-CET"
            onClick={selectMhtCet}
            className={cn(
              "flex h-[55px] min-w-0 items-center gap-2 border border-foreground/35 px-2 text-left outline-none",
              pressableClass,
              "hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50",
            )}
          >
            <StaticPicture
              src={MHT_EXAM_OPTION.logo}
              width={EXAM_LOGO_ASSET_PX}
              height={EXAM_LOGO_ASSET_PX}
              loading="eager"
              sizes="24px"
              pictureClassName="size-6"
              className="size-6 object-contain"
            />
            <span className="min-w-0 flex-1 truncate text-xs font-medium">
              {MHT_EXAM_OPTION.label}
            </span>
            <span
              aria-hidden
              className="flex size-5 shrink-0 items-center justify-center rounded-full border border-border text-[11px] font-semibold text-muted-foreground"
            >
              +
            </span>
          </button>
        </div>
      ) : (
        <div
          className="exam-picker-grid sliding-toggle-track h-[55px]"
          data-gap="2"
          data-cols={String(columnCount)}
        >
          <span
            aria-hidden
            className="sliding-toggle-indicator"
            data-cols={String(columnCount)}
            data-gap="2"
            data-index={String(activeIndex)}
            style={indicatorStyle}
          />
          <div
            className={cn(
              "sliding-toggle-grid grid h-full",
              mhtCetEnabled ? "grid-cols-3" : "grid-cols-2",
            )}
            style={{
              gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
            }}
          >
            {PRIMARY_EXAM_OPTIONS.map((exam) => {
              const isActive = value === exam.id;
              return (
                <button
                  key={exam.id}
                  type="button"
                  aria-label={exam.label}
                  aria-pressed={isActive}
                  onClick={() => {
                    setShowMoreExams(false);
                    deferAfterPress(() => onValueChange(exam.id));
                  }}
                  className={cn(
                    "exam-picker-tile relative z-1 flex h-[55px] min-h-[55px] w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-none border-0 bg-transparent outline-none shadow-none",
                    pressableClass,
                    "focus-visible:ring-3 focus-visible:ring-ring/50",
                  )}
                >
                  <StaticPicture
                    src={exam.logo}
                    width={EXAM_LOGO_ASSET_PX}
                    height={EXAM_LOGO_ASSET_PX}
                    loading="eager"
                    sizes={`${EXAM_LOGO_SIZE}px`}
                    pictureClassName="size-6"
                    className="exam-picker-logo object-contain transition-[opacity,filter] duration-150"
                  />
                  <span className="text-[10px] leading-none font-medium">
                    {exam.shortLabel}
                  </span>
                </button>
              );
            })}
            {mhtCetEnabled ? (
              <button
                ref={moreButtonRef}
                type="button"
                aria-expanded={false}
                aria-pressed={isMhtCetSelected}
                aria-label={
                  isMhtCetSelected ? "MHT-CET selected" : "Show more exams"
                }
                onClick={() => {
                  if (!isMhtCetSelected) {
                    setShowMoreExams(true);
                    requestAnimationFrame(() =>
                      moreExamOptionRef.current?.focus(),
                    );
                  }
                }}
                className={cn(
                  "exam-picker-tile relative z-1 flex h-[55px] min-h-[55px] w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-none border-0 bg-transparent outline-none shadow-none",
                  pressableClass,
                  "focus-visible:ring-3 focus-visible:ring-ring/50",
                )}
              >
                {isMhtCetSelected ? (
                  <StaticPicture
                    src={MHT_EXAM_OPTION.logo}
                    width={EXAM_LOGO_ASSET_PX}
                    height={EXAM_LOGO_ASSET_PX}
                    loading="eager"
                    sizes={`${EXAM_LOGO_SIZE}px`}
                    pictureClassName="size-6"
                    className="exam-picker-logo object-contain transition-[opacity,filter] duration-150"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="flex size-6 items-center justify-center gap-0.5 text-muted-foreground"
                  >
                    <span className="size-1 rounded-full bg-current" />
                    <span className="size-1 rounded-full bg-current" />
                    <span className="size-1 rounded-full bg-current" />
                  </span>
                )}
                <span className="text-[10px] leading-none font-medium">
                  {isMhtCetSelected ? MHT_EXAM_OPTION.label : "More"}
                </span>
                {isMhtCetSelected ? (
                  <span
                    aria-hidden
                    className="absolute top-1.5 right-1.5 text-[9px] font-semibold text-muted-foreground/60"
                  >
                    ✓
                  </span>
                ) : null}
              </button>
            ) : null}
          </div>
        </div>
      )}
    </fieldset>
  );
}
