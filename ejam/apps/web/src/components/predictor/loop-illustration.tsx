"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { StaticPicture } from "@/components/ui/static-picture";
import type { LoopIllustrationSource } from "@/lib/static-image";

type LoopIllustrationProps = {
  src: LoopIllustrationSource;
  priority?: boolean;
  className?: string;
};

export function LoopIllustration({
  src,
  priority = false,
  className = "h-auto w-full object-contain",
}: LoopIllustrationProps) {
  const shouldReduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [readyToPlay, setReadyToPlay] = useState(false);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setReadyToPlay(true);
      },
      { rootMargin: "100px" },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (!readyToPlay || shouldReduceMotion) return;
    const video = videoRef.current;
    if (!video) return;

    const startPlayback = () => {
      void video.play().catch(() => {});
    };

    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      startPlayback();
      return;
    }

    video.addEventListener("canplay", startPlayback, { once: true });
    video.load();

    return () => {
      video.removeEventListener("canplay", startPlayback);
    };
  }, [readyToPlay, shouldReduceMotion]);

  if (shouldReduceMotion) {
    return (
      <StaticPicture
        src={src.poster}
        width={576}
        height={576}
        priority={priority}
        sizes="(max-width: 768px) 80vw, 288px"
        pictureClassName="block w-full h-auto"
        className={className}
      />
    );
  }

  return (
    <video
      ref={videoRef}
      poster={src.poster.webp}
      preload="none"
      muted
      playsInline
      loop
      aria-hidden
      tabIndex={-1}
      width={576}
      height={576}
      className={className}
    >
      {readyToPlay ? <source src={src.webm} type="video/webm" /> : null}
    </video>
  );
}
