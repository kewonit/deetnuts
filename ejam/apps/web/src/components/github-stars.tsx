"use client";

import { domAnimation, LazyMotion, m, useReducedMotion } from "motion/react";
import {
  type RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const COUNTDOWN_DURATION = 700;
const STAR_REVEAL_TRANSITION = {
  type: "spring" as const,
  duration: 0.3,
  bounce: 0,
};
const SIZER_LABEL = "99 stars";
/** Keep skeleton visible long enough to perceive on fast networks. */
const MIN_SKELETON_MS = 400;

export interface GitHubStarsProps {
  owner?: string;
  repo?: string;
  starCount?: number;
  className?: string;
  countClassName?: string;
  starsLabelClassName?: string;
  skeletonClassName?: string;
}

function cacheKey(owner: string, repo: string) {
  return `github-stars:${owner}/${repo}`;
}

function readCachedCount(owner: string, repo: string): number | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(owner, repo));
    if (!raw) return null;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCachedCount(owner: string, repo: string, count: number): void {
  try {
    sessionStorage.setItem(cacheKey(owner, repo), String(count));
  } catch {
    // ignore quota errors
  }
}

const starCountPromises = new Map<string, Promise<number>>();

function fetchGitHubStarCount(owner: string, repo: string): Promise<number> {
  const key = cacheKey(owner, repo);
  const cached = readCachedCount(owner, repo);
  if (cached !== null) return Promise.resolve(cached);

  const inflight = starCountPromises.get(key);
  if (inflight) return inflight;

  const promise = fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: { Accept: "application/vnd.github.v3+json" },
  })
    .then(async (res) => {
      if (!res.ok) throw new Error("github stars fetch failed");
      const data = await res.json();
      const next = data.stargazers_count ?? 0;
      writeCachedCount(owner, repo, next);
      return next;
    })
    .catch(() => readCachedCount(owner, repo) ?? 0)
    .finally(() => {
      starCountPromises.delete(key);
    });

  starCountPromises.set(key, promise);
  return promise;
}

function cancelCountAnimation(rafIdRef: RefObject<number | null>) {
  if (rafIdRef.current !== null) {
    cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = null;
  }
}

function animateDisplayCount(
  starCount: number,
  shouldReduceMotion: boolean | null,
  rafIdRef: RefObject<number | null>,
  setDisplayCount: (count: number) => void,
) {
  cancelCountAnimation(rafIdRef);

  if (starCount === 0 || shouldReduceMotion) {
    setDisplayCount(starCount);
    return;
  }

  const startTime = performance.now();

  const run = () => {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / COUNTDOWN_DURATION, 1);
    const eased = 1 - (1 - progress) ** 3;
    setDisplayCount(Math.round(starCount * eased));

    if (progress < 1) {
      rafIdRef.current = requestAnimationFrame(run);
    } else {
      rafIdRef.current = null;
      setDisplayCount(starCount);
    }
  };

  run();
}

function GitHubStarsDisplay({
  isLoading,
  displayCount,
  className,
  countClassName,
  starsLabelClassName = "font-normal text-muted-foreground",
  skeletonClassName,
  shouldReduceMotion,
}: {
  isLoading: boolean;
  displayCount: number;
  className: string;
  countClassName: string;
  starsLabelClassName?: string;
  skeletonClassName?: string;
  shouldReduceMotion: boolean | null;
}) {
  return (
    <span
      className={cn("inline-grid items-center whitespace-nowrap", className)}
    >
      <span
        className={cn(
          "invisible col-start-1 row-start-1 text-xs tabular-nums",
          countClassName,
        )}
      >
        {SIZER_LABEL}
      </span>

      {isLoading ? (
        <Skeleton
          className={cn(
            "col-start-1 row-start-1 h-3.5 w-full rounded-none bg-foreground/25",
            skeletonClassName,
          )}
        />
      ) : (
        <LazyMotion features={domAnimation} strict>
          <m.span
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            className={cn(
              "col-start-1 row-start-1 flex items-center gap-1.5 text-xs font-medium tabular-nums",
              countClassName,
            )}
            initial={
              shouldReduceMotion
                ? { opacity: 1, y: 0, filter: "blur(0px)" }
                : { opacity: 0, y: 12, filter: "blur(4px)" }
            }
            transition={
              shouldReduceMotion ? { duration: 0 } : STAR_REVEAL_TRANSITION
            }
          >
            <span className={countClassName}>
              {displayCount.toLocaleString()}
            </span>
            <span className={starsLabelClassName}>stars</span>
          </m.span>
        </LazyMotion>
      )}
    </span>
  );
}

function GitHubStarsProvided({
  starCount,
  className,
  countClassName,
  starsLabelClassName,
  skeletonClassName,
}: {
  starCount: number;
  className: string;
  countClassName: string;
  starsLabelClassName?: string;
  skeletonClassName?: string;
}) {
  const [displayCount, setDisplayCount] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const rafIdRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    animateDisplayCount(
      starCount,
      shouldReduceMotion,
      rafIdRef,
      setDisplayCount,
    );
    return () => cancelCountAnimation(rafIdRef);
  }, [starCount, shouldReduceMotion]);

  return (
    <GitHubStarsDisplay
      isLoading={false}
      displayCount={displayCount}
      className={className}
      countClassName={countClassName}
      starsLabelClassName={starsLabelClassName}
      skeletonClassName={skeletonClassName}
      shouldReduceMotion={shouldReduceMotion}
    />
  );
}

function GitHubStarsFetched({
  owner,
  repo,
  className,
  countClassName,
  starsLabelClassName,
  skeletonClassName,
}: {
  owner: string;
  repo: string;
  className: string;
  countClassName: string;
  starsLabelClassName?: string;
  skeletonClassName?: string;
}) {
  const [starCount, setStarCount] = useState<number | null>(null);
  const [displayCount, setDisplayCount] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const rafIdRef = useRef<number | null>(null);

  const isLoading = starCount === null;

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const startedAt = performance.now();

    void fetchGitHubStarCount(owner, repo).then((count) => {
      const remaining = MIN_SKELETON_MS - (performance.now() - startedAt);
      const apply = () => {
        if (!cancelled) {
          setDisplayCount(0);
          setStarCount(count);
        }
      };
      if (remaining > 0) timeoutId = setTimeout(apply, remaining);
      else apply();
    });

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [owner, repo]);

  useLayoutEffect(() => {
    if (starCount === null) return;
    animateDisplayCount(
      starCount,
      shouldReduceMotion,
      rafIdRef,
      setDisplayCount,
    );
    return () => cancelCountAnimation(rafIdRef);
  }, [starCount, shouldReduceMotion]);

  return (
    <GitHubStarsDisplay
      isLoading={isLoading}
      displayCount={displayCount}
      className={className}
      countClassName={countClassName}
      starsLabelClassName={starsLabelClassName}
      skeletonClassName={skeletonClassName}
      shouldReduceMotion={isLoading ? false : shouldReduceMotion}
    />
  );
}

export default function GitHubStars({
  owner = "su6u",
  repo = "ejam",
  starCount: providedStarCount,
  className = "",
  countClassName = "",
  starsLabelClassName,
  skeletonClassName,
}: Readonly<GitHubStarsProps>) {
  if (providedStarCount !== undefined) {
    return (
      <GitHubStarsProvided
        starCount={providedStarCount}
        className={className}
        countClassName={countClassName}
        starsLabelClassName={starsLabelClassName}
        skeletonClassName={skeletonClassName}
      />
    );
  }

  return (
    <GitHubStarsFetched
      owner={owner}
      repo={repo}
      className={className}
      countClassName={countClassName}
      starsLabelClassName={starsLabelClassName}
      skeletonClassName={skeletonClassName}
    />
  );
}
