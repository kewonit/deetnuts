import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export function ChipIcon({
  src,
  className,
  style,
}: {
  src: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className={cn("chip-icon-mask size-3 shrink-0 bg-current", className)}
      style={{
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        ...style,
      }}
    />
  );
}
