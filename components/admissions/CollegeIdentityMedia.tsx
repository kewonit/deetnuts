"use client";

import Image from "next/image";
import { useState } from "react";
import type { CollegeMediaEntry } from "@/lib/admissions/college-media";

export default function CollegeIdentityMedia({
  media,
  initial,
  variant,
}: {
  media: CollegeMediaEntry | null;
  initial: string;
  variant: "full" | "sheet";
}) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const logo =
    media?.logo && !failedSources.includes(media.logo.src) ? media.logo : null;
  const campus =
    media?.campus && !failedSources.includes(media.campus.src)
      ? media.campus
      : null;
  const avatar = logo ?? campus;
  const campusPosition = campus?.focalPoint
    ? `${campus.focalPoint.x}% ${campus.focalPoint.y}%`
    : "50% 50%";

  function failed(src: string) {
    setFailedSources((sources) =>
      sources.includes(src) ? sources : [...sources, src],
    );
  }

  return (
    <>
      <div className="mht-profile-banner" aria-hidden="true">
        {campus ? (
          <Image
            src={campus.src}
            alt=""
            fill
            sizes={
              variant === "sheet"
                ? "(max-width: 640px) 100vw, 576px"
                : "(max-width: 1152px) 100vw, 1120px"
            }
            loading="eager"
            fetchPriority={variant === "full" ? "high" : undefined}
            style={{ objectFit: "cover", objectPosition: campusPosition }}
            onError={() => failed(campus.src)}
          />
        ) : null}
      </div>
      <div
        className={`mht-college-logo${avatar ? " mht-college-logo--image" : ""}`}
        style={
          logo?.backgroundColor
            ? { backgroundColor: logo.backgroundColor }
            : undefined
        }
        aria-hidden="true"
      >
        {avatar ? (
          <Image
            src={avatar.src}
            alt=""
            fill
            unoptimized
            loading="eager"
            style={{
              objectFit: logo ? "contain" : "cover",
              objectPosition: logo ? "50% 50%" : campusPosition,
              padding: logo ? "0.5rem" : 0,
            }}
            onError={() => failed(avatar.src)}
          />
        ) : (
          <span>{initial}</span>
        )}
      </div>
    </>
  );
}
