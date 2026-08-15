import { cn } from "@/lib/utils";

export const pressableClass = "pressable";

/** Skip press scale on popup triggers (aria-haspopup). */
export const buttonPressableClass = "pressable pressable-button";

export const headerPillClass = cn(
  "inline-flex h-9 items-center gap-2 rounded-none bg-background pl-2.5 pr-3 text-xs font-medium text-foreground",
  "shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 ease-out hover:shadow-[var(--shadow-border-hover)]",
  pressableClass,
  "hover:bg-muted",
);

/** White pill — header actions and home tool card CTA share one surface. */
export const homePillClass = cn(
  "relative inline-flex h-8 items-center gap-1.5 rounded-full bg-[#FDFDFD] pl-2 pr-2.5 text-xs font-medium text-[#2e2e2e]",
  "shadow-[0_0_0_1px_rgb(0_0_0_/0.08)] transition-[box-shadow] duration-150 ease-out",
  "after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']",
  pressableClass,
  "[@media(hover:hover)_and_(pointer:fine)]:hover:shadow-[0_2px_10px_rgb(0_0_0_/0.18)]",
);

export const homeHeaderLinkClass = homePillClass;

const homeCardPillSizeClass =
  "inline-flex h-6 shrink-0 items-center gap-0.5 pl-1.5 pr-2 text-[10px] leading-none sm:h-7 sm:gap-1 sm:pl-2 sm:pr-2.5 sm:text-[11px]";

export const homeCardPillClass = cn(homePillClass, homeCardPillSizeClass);

export const homeCardPillDisabledClass = cn(
  "inline-flex h-6 shrink-0 cursor-not-allowed items-center gap-0.5 rounded-full bg-[#FDFDFD]/75 pl-1.5 pr-2 text-[10px] font-medium leading-none text-[#2e2e2e]/50 sm:h-7 sm:gap-1 sm:pl-2 sm:pr-2.5 sm:text-[11px]",
  "pointer-events-none shadow-[0_0_0_1px_rgb(0_0_0_/0.06)]",
);

export const homeCardPillStaticClass = cn(
  homeCardPillSizeClass,
  "rounded-full bg-[#FDFDFD] font-medium text-[#2e2e2e] shadow-[0_0_0_1px_rgb(0_0_0_/0.08)]",
);

/** Run click work after the press animation paints (double rAF). */
export function deferAfterPress(fn: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(fn);
  });
}
