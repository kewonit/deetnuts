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
      className="cutoff-button"
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
