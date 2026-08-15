"use client";

import { deferAfterPress, pressableClass } from "@/lib/pressable";
import { cn } from "@/lib/utils";
import { ChipIcon } from "./chip-icon";

export function FilterChip({
  label,
  iconSrc,
  active,
  disabled,
  accentColor,
  fullWidth,
  instant,
  onClick,
  className,
}: {
  label: string;
  iconSrc?: string;
  active: boolean;
  disabled?: boolean;
  accentColor?: string;
  fullWidth?: boolean;
  /** Skip double-rAF defer */
  instant?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={() => (instant ? onClick() : deferAfterPress(onClick))}
      className={cn(
        "filter-chip sliding-toggle-tile inline-flex h-8 items-center rounded-none px-2.5 text-xs font-medium text-muted-foreground outline-none",
        pressableClass,
        "hover:text-foreground",
        "focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:opacity-50",
        active && "text-foreground",
        fullWidth && "w-full justify-start",
        iconSrc && "gap-1.5",
        className,
      )}
      style={
        active && accentColor
          ? {
              color: accentColor,
              borderColor: `color-mix(in srgb, ${accentColor} 45%, var(--border))`,
              backgroundColor: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
            }
          : undefined
      }
    >
      {iconSrc ? (
        <ChipIcon
          src={iconSrc}
          style={active && accentColor ? { color: accentColor } : undefined}
        />
      ) : null}
      <span className="truncate">{label}</span>
    </button>
  );
}
