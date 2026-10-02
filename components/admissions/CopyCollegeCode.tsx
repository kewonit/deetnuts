"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

export default function CopyCollegeCode({ code }: { code: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    window.setTimeout(() => setStatus("idle"), 2000);
  }

  const label =
    status === "copied" ? "Copied" : status === "failed" ? "Could not copy" : "Copy college code";

  return (
    <button
      type="button"
      onClick={copyCode}
      className="inline-flex h-7 items-center rounded px-2 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
      aria-live="polite"
    >
      {status === "idle" ? <Copy className="h-3.5 w-3.5" aria-hidden="true" /> : label}
      {status === "idle" ? <span className="sr-only">{label}</span> : null}
    </button>
  );
}
