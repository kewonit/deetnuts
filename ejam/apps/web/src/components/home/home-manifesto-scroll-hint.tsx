"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const FADE_DISTANCE_PX = 180;

export function HomeManifestoScrollHint() {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) return;

    let frameId = 0;

    const update = () => {
      frameId = 0;
      const next = Math.max(0, 1 - window.scrollY / FADE_DISTANCE_PX);
      setOpacity(next);
    };

    const onScroll = () => {
      if (frameId !== 0) return;
      frameId = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frameId !== 0) cancelAnimationFrame(frameId);
    };
  }, []);

  const faded = opacity < 0.15;

  return (
    <span
      aria-hidden
      className={cn(
        "home-manifesto-scroll-hint mt-1.5 translate-y-1.5 transition-[opacity,transform] duration-200 ease-out sm:mt-2",
        faded && "home-manifesto-scroll-hint--paused pointer-events-none",
      )}
      style={{ opacity }}
    >
      <Image
        src="/icons/arrow-down.svg"
        alt=""
        width={20}
        height={20}
        aria-hidden
        className="size-3.5 opacity-80 sm:size-4"
      />
    </span>
  );
}
