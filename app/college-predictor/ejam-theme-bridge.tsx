"use client";

import { useLayoutEffect } from "react";

const STORAGE_KEY = "deetnuts_theme";
const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

function readPreference(): "system" | "light" | "dark" {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

export function EjamThemeBridge() {
  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia(DARK_MEDIA_QUERY);
    const syncTheme = () => {
      const preference = readPreference();
      const useDarkTheme =
        preference === "dark" ||
        (preference === "system" && mediaQuery.matches);

      document
        .querySelector<HTMLElement>(".deetnuts-ejam-shell")
        ?.classList.toggle("dark", useDarkTheme);
    };

    syncTheme();
    mediaQuery.addEventListener("change", syncTheme);
    window.addEventListener("storage", syncTheme);
    window.addEventListener("deetnuts:theme-change", syncTheme);

    return () => {
      mediaQuery.removeEventListener("change", syncTheme);
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("deetnuts:theme-change", syncTheme);
    };
  }, []);

  return null;
}
