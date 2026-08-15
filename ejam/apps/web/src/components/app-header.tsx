"use client";

import Image from "next/image";
import Link from "next/link";
import GitHubStars from "@/components/github-stars";
import { headerPillClass, homeHeaderLinkClass } from "@/lib/pressable";
import { cn } from "@/lib/utils";

const SPONSOR_HREF = "https://github.com/sponsors/su6u";
const GITHUB_REPO_HREF = "https://github.com/su6u/ejam";

export function AppHeader({
  className,
  showToolsLink = false,
  variant = "default",
  docsHref,
}: {
  className?: string;
  showToolsLink?: boolean;
  variant?: "default" | "home";
  docsHref?: string;
}) {
  const isHome = variant === "home";
  const showDocs = Boolean(docsHref);
  const actionClass = isHome ? homeHeaderLinkClass : headerPillClass;
  const homeIconClass = "size-3 shrink-0";
  const toolHeaderIconClass = "size-4 shrink-0 brightness-0 invert";

  if (!isHome) {
    return (
      <header
        className={cn(
          "flex shrink-0 items-center justify-end gap-2",
          className,
        )}
      >
        {showToolsLink ? (
          <Link href="/" className={actionClass}>
            <Image
              src="/icons/tools.svg"
              alt=""
              width={16}
              height={16}
              aria-hidden
              className={toolHeaderIconClass}
            />
            Tools
          </Link>
        ) : null}
        {showDocs ? (
          <a
            href={docsHref}
            target="_blank"
            rel="noopener noreferrer"
            className={actionClass}
            aria-label="Documentation"
          >
            <Image
              src="/icons/docs.svg"
              alt=""
              width={16}
              height={16}
              aria-hidden
              className={toolHeaderIconClass}
            />
            Docs
          </a>
        ) : (
          <a
            href={SPONSOR_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className={actionClass}
          >
            <Image
              src="/icons/heart.svg"
              alt=""
              width={16}
              height={16}
              aria-hidden
              className={toolHeaderIconClass}
            />
            Sponsor
          </a>
        )}
        <a
          href={GITHUB_REPO_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className={actionClass}
        >
          <Image
            src="/icons/github.svg"
            alt=""
            width={16}
            height={16}
            aria-hidden
            className={toolHeaderIconClass}
          />
          <GitHubStars
            className="text-xs"
            countClassName="text-xs font-medium"
          />
        </a>
      </header>
    );
  }

  return (
    <nav
      aria-label="Site"
      className={cn(
        "flex shrink-0 items-center justify-end gap-1.5 sm:gap-2 md:gap-2.5",
        className,
      )}
    >
      {showToolsLink ? (
        <Link
          href="/"
          className={cn(
            actionClass,
            "max-sm:gap-1 max-sm:pl-1.5 max-sm:pr-2 max-sm:after:-inset-y-2",
          )}
        >
          <Image
            src="/icons/tools.svg"
            alt=""
            width={16}
            height={16}
            aria-hidden
            className={homeIconClass}
          />
          Tools
        </Link>
      ) : null}
      <a
        href={SPONSOR_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          actionClass,
          "max-sm:gap-1 max-sm:pl-1.5 max-sm:pr-2 max-sm:after:-inset-y-2",
        )}
      >
        <Image
          src="/icons/heart.svg"
          alt=""
          width={16}
          height={16}
          aria-hidden
          className={homeIconClass}
        />
        Sponsor
      </a>
      <a
        href={GITHUB_REPO_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          actionClass,
          "max-sm:gap-1 max-sm:pl-1.5 max-sm:pr-2 max-sm:after:-inset-y-2",
        )}
      >
        <Image
          src="/icons/github.svg"
          alt=""
          width={16}
          height={16}
          aria-hidden
          className={homeIconClass}
        />
        <GitHubStars
          className="text-xs"
          countClassName="text-xs font-medium tabular-nums text-[#2e2e2e]"
          starsLabelClassName="font-normal text-[#2e2e2e]/65"
          skeletonClassName="bg-[#2e2e2e]/25"
        />
      </a>
    </nav>
  );
}
