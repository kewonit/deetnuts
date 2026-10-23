"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize, PictureInPicture2, Share2 } from "lucide-react";
import {
  countdownTarget,
  displaySessions,
  formatExamDate,
  nextSession,
  sessionStatus,
  timeRemaining,
  type ExamSession,
} from "@/lib/timekeeper/exams";
import { useNow } from "./useNow";

export function CountdownDigits({
  target,
  compact = false,
}: {
  target: string;
  compact?: boolean;
}) {
  const now = useNow();
  const remaining = timeRemaining(target, now);
  if (now && remaining.expired)
    return (
      <p className="text-center themed-text-secondary" role="status">
        Countdown Ended
      </p>
    );
  return (
    <div
      className={`tk-countdown-grid ${compact ? "tk-compact" : ""}`}
      aria-label={`Countdown to ${target}`}
      data-testid="countdown-digits"
    >
      {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
        <div key={unit}>
          <div className="tk-countdown-number" data-unit={unit}>
            {now ? String(remaining[unit]).padStart(2, "0") : "--"}
          </div>
          <div className="tk-countdown-label">
            {unit[0].toUpperCase() + unit.slice(1)}
          </div>
        </div>
      ))}
    </div>
  );
}

function dayCount(days: number) {
  return `${days} ${days === 1 ? "day" : "days"} left`;
}

// The page's first sentence answers "how many days left for X".
export function DaysLeft({
  sessions,
  label,
}: {
  sessions: ExamSession[];
  label: string;
}) {
  const now = useNow();
  const session = nextSession(sessions, now);
  if (!now || !session) return null;
  const target = countdownTarget(session, now);
  const remaining = timeRemaining(target, now);
  if (remaining.expired) return null;
  return (
    <p className="text-base sm:text-lg mt-4" data-testid="days-left">
      <strong>{dayCount(remaining.days)}</strong> for {label} ·{" "}
      {formatExamDate(target)}
      {target !== session.date ? " · Under way" : ""} · {sessionStatus(session)}
    </p>
  );
}

export function DaysUntil({ date }: { date: string }) {
  const now = useNow();
  const remaining = timeRemaining(date, now);
  if (!now || remaining.expired) return null;
  return <> · {dayCount(remaining.days)}</>;
}

// A table cell: days to the start, then "Under way" until the end date.
export function DaysToGo({
  date,
  endDate,
}: {
  date: string;
  endDate?: string;
}) {
  const now = useNow();
  if (!now) return null;
  if (now < Date.parse(date)) return <>{timeRemaining(date, now).days}</>;
  return <>{now < Date.parse(endDate ?? date) ? "Under way" : "Done"}</>;
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Saturdays and Sundays between today in India and the exam day.
function weekendsBefore(date: string, now: number) {
  const today = Math.floor((now + IST_OFFSET_MS) / DAY_MS);
  const examDay = Math.floor(Date.parse(date) / DAY_MS);
  let saturdays = 0;
  let sundays = 0;
  for (let day = today + 1; day < examDay; day++) {
    const weekday = new Date(day * DAY_MS).getUTCDay();
    if (weekday === 6) saturdays++;
    if (weekday === 0) sundays++;
  }
  return { saturdays, sundays };
}

function plural(count: number, unit: string) {
  return `${count} ${unit}${count === 1 ? "" : "s"}`;
}

function weeksAndDays(days: number) {
  return `${plural(Math.floor(days / 7), "week")} and ${plural(days % 7, "day")}`;
}

// The next session that has not started, skipping one already under way.
function upcomingStart(sessions: ExamSession[], now: number) {
  return displaySessions(sessions, now).find(
    (session) => now < Date.parse(session.date),
  );
}

export function TimeLeft({ sessions }: { sessions: ExamSession[] }) {
  const now = useNow();
  const session = upcomingStart(sessions, now);
  if (!now || !session) return null;
  const { days } = timeRemaining(session.date, now);
  const { saturdays, sundays } = weekendsBefore(session.date, now);
  const rows: [string, string][] = [
    ["Days", String(days)],
    ["Weeks", weeksAndDays(days)],
    ["Saturdays", String(saturdays)],
    ["Sundays", String(sundays)],
    ...[4, 6, 8, 10].map((hours): [string, string] => [
      `Study hours at ${hours} h a day`,
      String(days * hours),
    ]),
  ];
  return (
    <table className="tk-table" data-testid="time-left">
      <caption>Until {formatExamDate(session.date)}</caption>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <th scope="row">{label}</th>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function DaysLeftAnswer({ sessions }: { sessions: ExamSession[] }) {
  const now = useNow();
  const session = upcomingStart(sessions, now);
  if (!now || !session) return <>The last published session is under way.</>;
  const today = new Date(now).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <>
      {dayCount(timeRemaining(session.date, now).days)} as of {today}.{" "}
      {session.session === "Single Session" ? "The exam" : session.session}{" "}
      starts on {formatExamDate(session.date)}.
    </>
  );
}

export function WeeksLeftAnswer({ sessions }: { sessions: ExamSession[] }) {
  const now = useNow();
  const session = upcomingStart(sessions, now);
  if (!now || !session) return <>The last published session is under way.</>;
  return <>{weeksAndDays(timeRemaining(session.date, now).days)}.</>;
}

export function CardCountdown({ sessions }: { sessions: ExamSession[] }) {
  const now = useNow();
  const session = nextSession(sessions, now);
  if (!session) return null;
  return (
    <div className="themed-bg-secondary rounded-lg p-3 mt-4">
      <p className="text-xs themed-text-tertiary mb-1">
        Next Session: {session.session}
        {session.predicted ? " · Predicted" : ""}
      </p>
      <p className="text-xs themed-text-secondary mb-3">
        {formatExamDate(session.date)}
      </p>
      <CountdownDigits target={countdownTarget(session, now)} compact />
    </div>
  );
}

type DocumentPiP = {
  requestWindow(options: { width: number; height: number }): Promise<Window>;
};

function drawPiP(
  canvas: HTMLCanvasElement,
  title: string,
  session: ExamSession,
  foreground: string,
  background: string,
) {
  const context = canvas.getContext("2d");
  if (!context) return;
  const remaining = timeRemaining(
    countdownTarget(session, Date.now()),
    Date.now(),
  );
  canvas.setAttribute("role", "img");
  canvas.setAttribute(
    "aria-label",
    `${title}, ${session.session}: ${remaining.expired ? "Countdown Ended" : `${remaining.days} days, ${remaining.hours} hours, ${remaining.minutes} minutes, ${remaining.seconds} seconds remaining`}`,
  );
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = foreground;
  context.textAlign = "center";
  context.font = "italic 32px Georgia,serif";
  context.fillText(title, 320, 58, 590);
  context.font = "18px sans-serif";
  context.fillText(session.session, 320, 92, 590);
  context.font = "bold 56px sans-serif";
  context.fillText(
    remaining.expired
      ? "Countdown Ended"
      : `${remaining.days} : ${String(remaining.hours).padStart(2, "0")} : ${String(remaining.minutes).padStart(2, "0")} : ${String(remaining.seconds).padStart(2, "0")}`,
    320,
    174,
    600,
  );
  context.font = "16px sans-serif";
  context.fillText(
    "DAYS              HRS              MIN              SEC",
    320,
    208,
  );
  context.font = "14px sans-serif";
  context.fillText("TimeKeeper on Deetnuts", 320, 254);
}

export function TimerActions({
  title,
  session,
}: {
  title: string;
  session: ExamSession;
}) {
  const now = useNow();
  const dialog = useRef<HTMLDialogElement>(null);
  const resources = useRef<(() => void) | null>(null);
  const current = useRef({ title, session });
  const generation = useRef(0);
  const [message, setMessage] = useState("");
  useEffect(() => {
    current.current = { title, session };
  }, [title, session]);
  useEffect(
    () => () => {
      generation.current++;
      resources.current?.();
    },
    [],
  );

  async function fullscreen() {
    dialog.current?.showModal();
    try {
      await dialog.current?.requestFullscreen();
    } catch {
      /* The dialog is a complete mobile fallback. */
    }
  }
  function closeFullscreen() {
    if (document.fullscreenElement === dialog.current)
      void document.exitFullscreen().catch(() => {});
    dialog.current?.close();
  }

  async function popOut() {
    const request = ++generation.current;
    resources.current?.();
    resources.current = null;
    setMessage("");
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 280;
    const shell = dialog.current?.closest(".timekeeper");
    let popupWindow: Window | null = null;
    const render = () => {
      const style = getComputedStyle(shell ?? document.body);
      const foreground = style.getPropertyValue("--text-primary") || "#0f172a";
      const background = style.getPropertyValue("--bg-primary") || "#fff";
      if (popupWindow && !popupWindow.closed)
        popupWindow.document.body.style.background = background;
      drawPiP(
        canvas,
        current.current.title,
        current.current.session,
        foreground,
        background,
      );
    };
    render();
    try {
      const documentPiP = (
        window as Window & { documentPictureInPicture?: DocumentPiP }
      ).documentPictureInPicture;
      if (documentPiP) {
        const popup = await documentPiP.requestWindow({
          width: 420,
          height: 200,
        });
        if (request !== generation.current) {
          popup.close();
          return;
        }
        popupWindow = popup;
        popup.document.title = `${title} · TimeKeeper`;
        popup.document.body.style.margin = "0";
        canvas.style.cssText = "width:100%;height:auto;display:block";
        popup.document.body.append(canvas);
        render();
        const interval = popup.setInterval(render, 1000);
        resources.current = () => {
          popup.clearInterval(interval);
          if (!popup.closed) popup.close();
        };
        popup.addEventListener(
          "pagehide",
          () => popup.clearInterval(interval),
          { once: true },
        );
      } else if (document.pictureInPictureEnabled && canvas.captureStream) {
        const video = document.createElement("video");
        const stream = canvas.captureStream(1);
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        const interval = setInterval(render, 1000);
        const cleanup = () => {
          clearInterval(interval);
          if (document.pictureInPictureElement === video)
            void document.exitPictureInPicture().catch(() => {});
          stream.getTracks().forEach((track) => track.stop());
          video.srcObject = null;
        };
        resources.current = cleanup;
        await video.play();
        if (request !== generation.current) {
          cleanup();
          return;
        }
        await video.requestPictureInPicture();
        if (request !== generation.current) {
          cleanup();
          return;
        }
        video.addEventListener("leavepictureinpicture", cleanup, {
          once: true,
        });
      } else {
        setMessage(
          "Picture-in-Picture is not supported in this browser. Use Fullscreen to keep the countdown visible.",
        );
      }
    } catch {
      if (request !== generation.current) return;
      resources.current?.();
      setMessage(
        "Picture-in-Picture could not open. You can use Fullscreen instead.",
      );
    }
  }

  return (
    <>
      <div className="tk-actions justify-end">
        <button
          type="button"
          className="tk-button"
          onClick={() => void fullscreen()}
        >
          <Maximize size={16} /> Fullscreen
        </button>
        <button
          type="button"
          className="tk-button"
          onClick={() => void popOut()}
        >
          <PictureInPicture2 size={16} /> Pop-Out
        </button>
      </div>
      {message && (
        <p role="status" className="text-xs themed-text-secondary mt-2">
          {message}
        </p>
      )}
      <dialog
        ref={dialog}
        className="tk-dialog"
        aria-label={`${title} fullscreen countdown`}
        onClose={() => {
          if (document.fullscreenElement === dialog.current)
            void document.exitFullscreen().catch(() => {});
        }}
      >
        <button
          type="button"
          className="tk-button tk-close"
          onClick={closeFullscreen}
        >
          Exit Fullscreen · ESC
        </button>
        <div className="tk-dialog-content">
          <h2 className="font-serif italic text-4xl sm:text-6xl">{title}</h2>
          <p>
            {session.session} · {formatExamDate(session.date)}
          </p>
          <CountdownDigits target={countdownTarget(session, now)} />
        </div>
      </dialog>
    </>
  );
}

export default function ExamCountdown({
  title,
  sessions,
}: {
  title: string;
  sessions: ExamSession[];
}) {
  const now = useNow();
  const [selected, setSelected] = useState<string | null>(null);
  const displayed = displaySessions(sessions, now);
  const session =
    displayed.find((item) => item.session === selected) ??
    displayed.find((item) => Date.parse(item.endDate ?? item.date) >= now) ??
    displayed[0];
  if (!session)
    return <p>Exam dates will be announced by the conducting body.</p>;
  return (
    <section
      className="border border-dashed themed-border rounded-lg p-4 sm:p-6 lg:p-8 mb-8"
      aria-label="Exam countdown"
    >
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl mb-2">{session.session}</h2>
          <p className="themed-text-secondary">
            {formatExamDate(session.date)}
            {session.endDate ? ` – ${formatExamDate(session.endDate)}` : ""}
          </p>
          {session.predicted && (
            <p className="text-xs themed-text-secondary mt-2">
              Predicted next cycle · Awaiting official confirmation
            </p>
          )}
          {session.note && (
            <p className="text-xs themed-text-secondary mt-1">{session.note}</p>
          )}
        </div>
        <div>
          {displayed.length > 1 && (
            <div className="flex flex-wrap justify-end gap-1 p-1 rounded-lg themed-bg-tertiary mb-3">
              {displayed.map((item) => (
                <button
                  type="button"
                  key={item.session}
                  aria-pressed={item.session === session.session}
                  className={`px-2 py-1 text-xs rounded-md ${item.session === session.session ? "themed-bg" : "themed-text-secondary"}`}
                  onClick={() => setSelected(item.session)}
                >
                  {item.session}
                </button>
              ))}
            </div>
          )}
          <TimerActions title={title} session={session} />
        </div>
      </div>
      <div className="themed-bg-secondary p-4 sm:p-8 lg:p-12 rounded-lg">
        <CountdownDigits target={countdownTarget(session, now)} />
      </div>
      {session.endDate &&
        now >= Date.parse(session.date) &&
        now < Date.parse(session.endDate) && (
          <p className="text-center text-xs mt-3">
            Exam in progress · Countdown to the end of this session
          </p>
        )}
    </section>
  );
}

export function ShareExam({ title }: { title: string }) {
  const [message, setMessage] = useState("");
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title, url: location.href });
      else {
        await navigator.clipboard.writeText(location.href);
        setMessage("Link copied");
      }
    } catch {
      setMessage("You can copy this page’s URL to share the countdown.");
    }
  }
  return (
    <>
      <button
        type="button"
        className="tk-button w-full"
        onClick={() => void share()}
      >
        <Share2 size={16} /> Share This Exam
      </button>
      {message && (
        <p role="status" className="text-xs mt-2">
          {message}
        </p>
      )}
    </>
  );
}
