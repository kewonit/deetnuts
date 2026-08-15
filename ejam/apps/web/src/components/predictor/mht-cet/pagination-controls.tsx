"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export function ResultsLoadMore({
  loaded,
  total,
  hasMore,
  loading,
  error,
  onLoadMore,
}: {
  loaded: number;
  total: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  onLoadMore: () => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const previousLoadedRef = useRef(loaded);
  const restoreFocusRef = useRef(false);

  useEffect(() => {
    if (
      restoreFocusRef.current &&
      !loading &&
      loaded > previousLoadedRef.current
    ) {
      buttonRef.current?.focus({ preventScroll: true });
      restoreFocusRef.current = false;
    }
    previousLoadedRef.current = loaded;
  }, [loaded, loading]);

  const remaining = Math.max(0, total - loaded);
  return (
    <div className="flex min-h-16 flex-col items-center justify-center gap-2 border-t border-border px-4 py-3">
      <span className="sr-only" aria-live="polite">
        {loaded} of {total} programs shown
      </span>
      {error ? (
        <p role="alert" className="text-center text-xs text-destructive">
          {error}
        </p>
      ) : null}
      {hasMore || error ? (
        <Button
          ref={buttonRef}
          data-load-more
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => {
            restoreFocusRef.current = true;
            onLoadMore();
          }}
          className="rounded-none border-border bg-transparent shadow-none"
        >
          {loading ? (
            <>
              <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
              Loading more
            </>
          ) : (
            `Load ${Math.min(100, remaining)} more`
          )}
        </Button>
      ) : (
        <p className="text-xs tabular-nums text-muted-foreground">
          All {total.toLocaleString("en-IN")} programs loaded
        </p>
      )}
    </div>
  );
}
