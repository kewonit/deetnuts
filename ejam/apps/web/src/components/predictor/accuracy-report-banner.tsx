"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { sidebarCardBottomAlignClass } from "@/components/app-layout";
import { usePredictor } from "@/components/predictor/predictor-context";
import { deferAfterPress, pressableClass } from "@/lib/pressable";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "ejam:college-predictor:accuracy-banner-dismissed";

const REPORT_HREF =
  "https://github.com/su6u/ejam/blob/main/docs/college-predictor/nerd-stuff/2026-rounds-accuracy-report.md";

function readDismissed(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDismissed(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // private mode / blocked storage — ignore
  }
}

export function AccuracyReportBanner({ className }: { className?: string }) {
  const { hasResults, query } = usePredictor();
  // start hidden to avoid a flash before we read sessionStorage
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(readDismissed());
  }, []);

  // hide for the rest of this tab once they run a prediction
  useEffect(() => {
    if (query.data === null) return;
    writeDismissed();
    setDismissed(true);
  }, [query.data]);

  if (dismissed || hasResults) return null;

  const dismiss = () => {
    writeDismissed();
    setDismissed(true);
  };

  return (
    <aside
      className={cn(
        "mx-2 shrink-0 border border-border bg-background",
        sidebarCardBottomAlignClass,
        className,
      )}
      aria-label="Accuracy report"
    >
      <div className="flex items-start gap-2 px-2.5 py-2.5">
        <Image
          src="/icons/banner.svg"
          alt=""
          width={16}
          height={16}
          aria-hidden
          className="mt-0.5 size-4 shrink-0 brightness-0 invert"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs leading-snug text-muted-foreground">
            How accurate is this? We checked the algo against real 2026 JoSAA
            rounds 1-4.{" "}
            <a
              href={REPORT_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-2 hover:text-foreground/80"
            >
              Read the report
            </a>
          </p>
        </div>
        <button
          type="button"
          aria-label="Dismiss banner"
          onClick={() => deferAfterPress(dismiss)}
          className={cn(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-none text-muted-foreground outline-none",
            "hover:bg-muted hover:text-foreground",
            "focus-visible:ring-3 focus-visible:ring-ring/50",
            pressableClass,
          )}
        >
          <Image
            src="/icons/close.svg"
            alt=""
            width={12}
            height={12}
            aria-hidden
            className="size-3 brightness-0 invert"
          />
        </button>
      </div>
    </aside>
  );
}
