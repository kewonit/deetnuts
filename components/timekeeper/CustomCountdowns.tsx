"use client";
import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  countdownSchema,
  importTransfer,
  readSavedCountdowns,
  readTransfer,
  saveSavedCountdowns,
  type SavedCountdown,
} from "@/lib/timekeeper/storage";
import { CountdownDigits, TimerActions } from "./Countdown";

const colors = {
  blue: "#3b82f6",
  green: "#22c55e",
  purple: "#9333ea",
  red: "#ef4444",
  yellow: "#eab308",
  pink: "#ec4899",
};

export default function CustomCountdowns() {
  const [countdowns, setCountdowns] = useState<SavedCountdown[]>([]);
  const [editing, setEditing] = useState<SavedCountdown | null>(null);
  const [color, setColor] = useState<SavedCountdown["color"]>("blue");
  const [message, setMessage] = useState("");
  const [formVersion, setFormVersion] = useState(0);
  const modal = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const restore = () => setCountdowns(readSavedCountdowns());
    restore();
    window.addEventListener("timekeeper-storage", restore);
    window.addEventListener("storage", restore);
    return () => {
      window.removeEventListener("timekeeper-storage", restore);
      window.removeEventListener("storage", restore);
    };
  }, []);

  function save(next: SavedCountdown[]) {
    saveSavedCountdowns(next);
    setCountdowns(next);
  }
  function open(countdown: SavedCountdown | null) {
    setEditing(countdown);
    setColor(countdown?.color ?? "blue");
    setMessage("");
    setFormVersion((version) => version + 1);
    modal.current?.showModal();
  }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    try {
      const next = countdownSchema.parse({
        id: editing?.id ?? crypto.randomUUID(),
        title: fields.get("title"),
        description: fields.get("description"),
        targetDate: fields.get("targetDate"),
        color,
        createdAt: editing?.createdAt ?? new Date().toISOString(),
      });
      if (Date.parse(next.targetDate) <= Date.now())
        throw new Error("Please choose a date and time in the future.");
      save(
        editing
          ? countdowns.map((item) => (item.id === editing.id ? next : item))
          : [next, ...countdowns],
      );
      modal.current?.close();
    } catch (error) {
      setMessage(
        error instanceof Error && !error.message.startsWith("[")
          ? error.message
          : "Please check the title and target date. Browser storage must be available to save countdowns.",
      );
    }
  }
  function remove(countdown: SavedCountdown) {
    if (!window.confirm(`Delete “${countdown.title}”?`)) return;
    try {
      save(countdowns.filter((item) => item.id !== countdown.id));
    } catch {
      setMessage(
        "Could not save this change. Browser storage may be full or disabled.",
      );
    }
  }
  function exportData() {
    try {
      const file = new Blob([JSON.stringify(readTransfer(), null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = "timekeeper-countdowns.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setMessage(
        "Could not export browser data. Check your browser’s storage settings.",
      );
    }
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 1024 * 1024)
        throw new Error("The import file is too large (maximum 1MB).");
      const added = importTransfer(JSON.parse(await file.text()));
      setMessage(
        `${added} countdown${added === 1 ? "" : "s"} imported. Your original timers are retained.`,
      );
    } catch {
      setMessage(
        "Could not import this file. Choose a TimeKeeper export and make sure browser storage has space.",
      );
    }
  }
  return (
    <>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="font-serif italic text-2xl">Custom Countdowns</h1>
          <p className="text-sm themed-text-secondary mt-2">
            Create personalized countdowns for your important events.
          </p>
        </div>
        <button type="button" className="tk-button" onClick={() => open(null)}>
          <Plus size={16} /> Create Countdown
        </button>
      </div>
      <div className="themed-bg-secondary border border-dashed themed-border rounded-lg p-4 mb-6 text-sm">
        <p className="mb-3">
          Bring your saved countdowns, theme, and avatar from TimeKeeper, or
          keep a recovery copy.
        </p>
        <div className="tk-actions">
          <a
            className="tk-button"
            href="https://timekeeper.edbn.me/migrate-to-deetnuts"
            rel="noreferrer"
          >
            Import from TimeKeeper
          </a>
          <button type="button" className="tk-button" onClick={exportData}>
            Export countdowns
          </button>
          <label className="tk-button cursor-pointer">
            Import JSON
            <input
              type="file"
              className="sr-only"
              aria-label="Import countdown JSON"
              accept="application/json,.json"
              onChange={(event) => {
                void importFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
        </div>
      </div>
      {message && (
        <p className="text-sm themed-text-secondary mb-4" role="status">
          {message}
        </p>
      )}
      {!countdowns.length && (
        <div className="border border-dashed themed-border rounded-lg p-8 text-center">
          <h2 className="font-serif italic text-xl mb-2">No countdowns yet</h2>
          <p className="text-sm themed-text-secondary mb-4">
            Create your first countdown to get started.
          </p>
          <button
            type="button"
            className="tk-button"
            onClick={() => open(null)}
          >
            Create Your First Countdown
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {countdowns.map((countdown) => (
          <article
            key={countdown.id}
            className="border border-dashed rounded-lg p-4 sm:p-6"
            style={{ borderColor: colors[countdown.color] }}
            data-testid="custom-countdown"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <h2 className="font-serif italic text-xl">{countdown.title}</h2>
                <p className="text-sm themed-text-secondary mt-2">
                  {countdown.description}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label={`Edit ${countdown.title}`}
                  onClick={() => open(countdown)}
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${countdown.title}`}
                  onClick={() => remove(countdown)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <p className="text-xs themed-text-secondary mb-4">
              Target: {countdown.targetDate.replace("T", " ")}
            </p>
            <div className="themed-bg-secondary p-4 rounded-lg mb-4">
              <CountdownDigits target={countdown.targetDate} compact />
            </div>
            <TimerActions
              title={countdown.title}
              session={{ session: "Custom Event", date: countdown.targetDate }}
            />
          </article>
        ))}
      </div>
      <dialog
        ref={modal}
        className="themed-bg themed-text border themed-border rounded-lg p-6 w-[min(95vw,440px)]"
        aria-labelledby="countdown-form-title"
      >
        <form
          ref={form}
          key={formVersion}
          onSubmit={submit}
          className="space-y-4"
        >
          <h2 id="countdown-form-title" className="font-serif italic text-2xl">
            {editing ? "Edit Countdown" : "Create Countdown"}
          </h2>
          <label className="block text-sm">
            Event Title
            <input
              name="title"
              className="tk-field mt-2"
              required
              maxLength={100}
              defaultValue={editing?.title ?? ""}
            />
          </label>
          <label className="block text-sm">
            Description
            <textarea
              name="description"
              className="tk-field mt-2"
              maxLength={200}
              defaultValue={editing?.description ?? ""}
            />
          </label>
          <label className="block text-sm">
            Target Date & Time
            <input
              name="targetDate"
              type="datetime-local"
              className="tk-field mt-2"
              required
              defaultValue={editing?.targetDate ?? ""}
            />
          </label>
          <fieldset>
            <legend className="text-sm mb-2">Color Theme</legend>
            <div className="flex gap-3">
              {Object.entries(colors).map(([option, value]) => (
                <button
                  type="button"
                  key={option}
                  aria-label={`${option} countdown color`}
                  aria-pressed={color === option}
                  className="w-8 h-8 rounded-full border-2"
                  style={{
                    background: value,
                    borderColor:
                      color === option ? "var(--text-primary)" : "transparent",
                  }}
                  onClick={() => setColor(option as SavedCountdown["color"])}
                />
              ))}
            </div>
          </fieldset>
          {message && (
            <p className="text-sm" role="status">
              {message}
            </p>
          )}
          <div className="tk-actions">
            <button
              type="button"
              className="tk-button"
              onClick={() => modal.current?.close()}
            >
              Cancel
            </button>
            <button className="tk-button" type="submit">
              {editing ? "Save Changes" : "Create Countdown"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
