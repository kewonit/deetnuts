"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "deetnuts_theme";
type ThemePreference = "system" | "light" | "dark";

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

function applyPreference(preference: ThemePreference) {
  const root = document.documentElement;
  root.classList.toggle("light", preference === "light");
  root.classList.toggle("dark", preference === "dark");
}

export function ThemeSettingsButton({ className = "" }: { className?: string }) {
  return <button type="button" className={className} onClick={() => window.dispatchEvent(new Event("deetnuts:open-theme-settings"))}>Theme settings</button>;
}

export default function ThemeSettings() {
  const [open, setOpen] = useState(false);
  const [preference, setPreference] = useState<ThemePreference>("system");
  const selectedButton = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const stored = readPreference();
    setPreference(stored);
    applyPreference(stored);
    const show = () => setOpen(true);
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const next = readPreference();
      setPreference(next);
      applyPreference(next);
    };
    window.addEventListener("deetnuts:open-theme-settings", show);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("deetnuts:open-theme-settings", show);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    selectedButton.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const choose = (next: ThemePreference) => {
    try {
      if (next === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // The selected theme still applies for this page when storage is unavailable.
    }
    applyPreference(next);
    setPreference(next);
  };

  if (!open) return null;
  return (
    <div className="theme-settings-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) setOpen(false);
    }}>
      <section className="theme-settings-panel" role="dialog" aria-modal="true" aria-labelledby="theme-settings-title" aria-describedby="theme-settings-description">
        <div className="theme-settings-header">
          <div><h2 id="theme-settings-title">Theme</h2><p id="theme-settings-description">Use your device setting or choose a mode for DEETNUTS.</p></div>
          <button type="button" className="theme-settings-close" aria-label="Close theme settings" onClick={() => setOpen(false)}>×</button>
        </div>
        <div className="theme-settings-options" role="group" aria-label="Color theme">
          {(["system", "light", "dark"] as const).map((option) => (
            <button
              type="button"
              aria-pressed={preference === option}
              className="theme-settings-option"
              key={option}
              onClick={() => choose(option)}
              ref={preference === option ? selectedButton : undefined}
            >
              <strong>{option[0].toUpperCase() + option.slice(1)}</strong>
              <span>{option === "system" ? "Follow this device" : `${option[0].toUpperCase() + option.slice(1)} on this device`}</span>
            </button>
          ))}
        </div>
        <p className="theme-settings-note">Saved only in this browser. System updates automatically when your device appearance changes.</p>
      </section>
    </div>
  );
}
