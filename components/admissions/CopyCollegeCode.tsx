"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

export default function CopyCollegeCode({
  code,
  idleLabel = "Copy college code",
}: {
  code: string;
  idleLabel?: string;
}) {
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
    status === "copied" ? "Copied" : status === "failed" ? "Could not copy" : idleLabel;

  return (
    <button
      type="button"
      onClick={copyCode}
      className="mht-copy"
      aria-live="polite"
    >
      {status === "idle" ? <Copy aria-hidden="true" /> : label}
      {status === "idle" ? <span className="mht-sr">{label}</span> : null}
    </button>
  );
}
