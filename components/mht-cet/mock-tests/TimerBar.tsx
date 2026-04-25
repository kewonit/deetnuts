"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function TimerBar({
  durationSeconds,
  endsAt,
}: {
  durationSeconds: number;
  endsAt: string;
}) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Math.floor((Date.parse(endsAt) - Date.now()) / 1000)),
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRemainingSeconds(
        Math.max(0, Math.floor((Date.parse(endsAt) - Date.now()) / 1000)),
      );
    }, 1000);

    return () => window.clearInterval(interval);
  }, [endsAt]);

  const progress =
    durationSeconds > 0 ? (remainingSeconds / durationSeconds) * 100 : 0;

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between border-b-2 border-black bg-white px-4 py-3 shadow-base">
      <div className="flex items-center gap-2 font-heading text-lg">
        <Clock className="h-5 w-5" />
        {formatTime(remainingSeconds)}
      </div>
      <div className="h-3 w-40 max-w-[45vw] rounded-base border-2 border-black bg-white">
        <div
          className="h-full bg-main"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
