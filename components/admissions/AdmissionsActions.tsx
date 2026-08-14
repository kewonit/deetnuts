"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export function ShareAdmissionsPage({ compact = false }: { compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex min-h-11 items-center justify-center gap-2 border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:border-slate-500 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
      aria-live="polite"
    >
      {copied ? (
        <Check aria-hidden="true" className="h-4 w-4 text-emerald-700" />
      ) : (
        <Share2 aria-hidden="true" className="h-4 w-4" />
      )}
      {!compact && (copied ? "Copied" : "Share")}
      {compact && <span className="sr-only">{copied ? "Link copied" : "Share this page"}</span>}
    </button>
  );
}
