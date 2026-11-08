"use client";

import Link from "next/link";
import { useState, type ComponentProps } from "react";

type IntentPrefetchLinkProps = Omit<ComponentProps<typeof Link>, "prefetch">;

/**
 * A link for long lists of dynamic pages (college pages): nothing is prefetched
 * while scrolling; the full page is prefetched once the visitor shows intent by
 * hovering, focusing or touching the link, so the click itself is instant.
 */
export function IntentPrefetchLink({
  onMouseEnter,
  onFocus,
  onTouchStart,
  ...props
}: IntentPrefetchLinkProps) {
  const [intent, setIntent] = useState(false);
  return (
    <Link
      {...props}
      prefetch={intent ? true : false}
      onMouseEnter={(event) => {
        setIntent(true);
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        setIntent(true);
        onFocus?.(event);
      }}
      onTouchStart={(event) => {
        setIntent(true);
        onTouchStart?.(event);
      }}
    />
  );
}
