"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { importTransfer, transferSchema } from "@/lib/timekeeper/storage";

export default function ImportCountdowns() {
  const [message, setMessage] = useState("Preparing your saved countdowns…");
  const [recovery, setRecovery] = useState<string | null>(null);
  const redeeming = useRef(false);
  useEffect(() => {
    if (redeeming.current) return;
    // Erase the bearer ticket from the visible URL before analytics or links
    // can reuse it. React Strict Mode must not redeem it twice.
    const token = new URLSearchParams(location.hash.slice(1)).get("ticket");
    if (!token) {
      try {
        const pending = sessionStorage.getItem("timekeeper-pending-import");
        if (pending) {
          const added = importTransfer(JSON.parse(pending));
          sessionStorage.removeItem("timekeeper-pending-import");
          setTimeout(
            () =>
              setMessage(
                `${added} countdowns imported. Your original TimeKeeper data is retained.`,
              ),
            0,
          );
        } else
          setTimeout(
            () =>
              setMessage(
                "Start a transfer from TimeKeeper, or import a JSON export on the custom countdowns page.",
              ),
            0,
          );
      } catch {
        setTimeout(
          () =>
            setMessage(
              "Browser storage is unavailable. Use JSON export/import to recover your countdowns.",
            ),
          0,
        );
      }
      return;
    }
    history.replaceState(null, "", "/exam-countdown/import");
    redeeming.current = true;
    async function redeem() {
      try {
        // Test destination storage before spending the single-use ticket.
        const check = "timekeeper-import-storage-check";
        localStorage.setItem(check, "1");
        localStorage.removeItem(check);
        const response = await fetch("/api/exam-countdown/migration/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          cache: "no-store",
          signal: AbortSignal.timeout(20_000),
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Transfer failed");
        const data = transferSchema.parse(body);
        const serialized = JSON.stringify(data, null, 2);
        setRecovery(serialized);
        // Keep a local recovery copy before the merge. The source browser data
        // is also untouched, even if a quota or network failure interrupts this.
        sessionStorage.setItem("timekeeper-pending-import", serialized);
        const added = importTransfer(data);
        sessionStorage.removeItem("timekeeper-pending-import");
        setMessage(
          `${added} countdown${added === 1 ? "" : "s"} imported. Your original TimeKeeper data is retained.`,
        );
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not import the countdowns. Export them again from TimeKeeper or use JSON import.",
        );
      }
    }
    void redeem();
  }, []);
  function download() {
    if (!recovery) return;
    const url = URL.createObjectURL(
      new Blob([recovery], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "timekeeper-recovery.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <main className="max-w-xl mx-auto p-6 sm:p-8">
      <h1 className="font-serif italic text-3xl mb-4">
        Bring your countdowns to Deetnuts
      </h1>
      <p role="status" className="mb-6">
        {message}
      </p>
      <div className="tk-actions">
        <Link className="tk-button" href="/exam-countdown/countdown">
          Open my countdowns
        </Link>
        {recovery && (
          <button type="button" className="tk-button" onClick={download}>
            Download recovery copy
          </button>
        )}
        <a
          className="tk-button"
          href="https://timekeeper.edbn.me/migrate-to-deetnuts"
          rel="noreferrer"
        >
          Return to TimeKeeper import
        </a>
      </div>
    </main>
  );
}
