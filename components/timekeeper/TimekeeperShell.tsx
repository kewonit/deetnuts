"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Menu, X } from "lucide-react";
import {
  categories,
  categorySlug,
  EXAM_COUNTDOWN_PATH,
} from "@/lib/timekeeper/exams";
import { themes, type TimekeeperTheme } from "@/lib/timekeeper/storage";

export default function TimekeeperShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const detail = pathname.startsWith(`${EXAM_COUNTDOWN_PATH}/exams/`);
  const [theme, setTheme] = useState<TimekeeperTheme>("light");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function restoreTheme() {
      try {
        const saved = localStorage.getItem("timekeeper-theme");
        setTheme(
          themes.includes(saved as TimekeeperTheme)
            ? (saved as TimekeeperTheme)
            : matchMedia("(prefers-color-scheme: dark)").matches
              ? "dark"
              : "light",
        );
      } catch {
        /* Storage can be disabled; the feature remains usable. */
      }
    }
    restoreTheme();
    const media = matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", restoreTheme);
    window.addEventListener("timekeeper-storage", restoreTheme);
    return () => {
      media.removeEventListener("change", restoreTheme);
      window.removeEventListener("timekeeper-storage", restoreTheme);
    };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // This scope never controls a Deetnuts page outside this feature.
    navigator.serviceWorker
      .register("/exam-countdown/sw.js", { scope: "/exam-countdown" })
      .catch(() => {});
  }, []);

  function chooseTheme(next: TimekeeperTheme) {
    setTheme(next);
    try {
      localStorage.setItem("timekeeper-theme", next);
    } catch {
      /* Keep the in-memory choice. */
    }
  }

  const themeControls = (
    <div className="flex gap-3" aria-label="TimeKeeper theme">
      {themes.map((option) => (
        <button
          key={option}
          type="button"
          className="theme-circle"
          data-theme={option}
          aria-label={`${option[0].toUpperCase()}${option.slice(1)} theme`}
          aria-pressed={theme === option}
          onClick={() => chooseTheme(option)}
        />
      ))}
    </div>
  );
  const navLinks = [
    { href: EXAM_COUNTDOWN_PATH, text: "All Exams" },
    ...categories.map((category) => ({
      href: `${EXAM_COUNTDOWN_PATH}/category/${categorySlug(category)}`,
      text: category,
    })),
    { href: `${EXAM_COUNTDOWN_PATH}/countdown`, text: "Custom Countdown" },
    { href: `${EXAM_COUNTDOWN_PATH}/study-map`, text: "🗺️ Live Study Map" },
  ];

  return (
    <div className="timekeeper" data-theme={theme}>
      {!detail && (
        <>
          <aside
            className="tk-sidebar"
            data-open={menuOpen}
            aria-label="TimeKeeper navigation"
          >
            <div className="p-4 sm:p-6">
              <div className="mb-6 border-b border-dashed themed-border pb-4 flex justify-between items-start">
                <Link
                  href={EXAM_COUNTDOWN_PATH}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="font-serif italic text-3xl block">
                    TimeKeeper
                  </span>
                  <span className="font-serif italic text-sm themed-text-secondary">
                    Exams Countdown
                  </span>
                </Link>
                <button
                  type="button"
                  className="tk-menu-toggle"
                  aria-label="Close TimeKeeper navigation"
                  onClick={() => setMenuOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={false}
                    onClick={() => setMenuOpen(false)}
                    aria-current={pathname === link.href ? "page" : undefined}
                    className={`block px-4 py-2 rounded-md text-sm ${pathname === link.href ? "themed-bg-tertiary themed-text" : "themed-text-secondary"}`}
                  >
                    {link.text}
                  </Link>
                ))}
              </nav>
              <div className="mt-6 pt-6 border-t border-dashed themed-border">
                <p className="text-sm mb-3">Theme</p>
                {themeControls}
              </div>
              <Link href="/" className="tk-button mt-6">
                <ArrowLeft size={16} /> Back to Deetnuts
              </Link>
            </div>
          </aside>
          {menuOpen && (
            <button
              type="button"
              className="tk-overlay"
              aria-label="Dismiss navigation"
              onClick={() => setMenuOpen(false)}
            />
          )}
        </>
      )}
      <div className={detail ? undefined : "tk-with-sidebar"}>
        <header className="sticky top-0 z-20 themed-bg border-b border-dashed themed-border">
          <div className="flex items-center justify-between gap-3 h-16 px-4 lg:px-8">
            <div className="flex items-center gap-3">
              {detail ? (
                <Link
                  href={EXAM_COUNTDOWN_PATH}
                  className="flex items-center gap-2 text-sm"
                >
                  <ArrowLeft size={18} /> All Exams
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    className="tk-menu-toggle"
                    aria-label="Open TimeKeeper navigation"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen(true)}
                  >
                    <Menu size={24} />
                  </button>
                  <span className="font-serif italic text-xl">TimeKeeper</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-4">
              {detail && <div className="hidden sm:block">{themeControls}</div>}
              <Link
                href="/"
                className="text-xs sm:text-sm themed-text-secondary"
              >
                ← Deetnuts
              </Link>
            </div>
          </div>
          {detail && <div className="sm:hidden px-4 pb-3">{themeControls}</div>}
        </header>
        {children}
        <footer className="border-t border-dashed themed-border px-4 py-6 text-center text-xs themed-text-secondary">
          <p className="mb-3">
            <span className="font-serif italic">TimeKeeper</span> · Exams
            Countdown
          </p>
          <p className="themed-disclaimer border rounded-lg p-3 max-w-2xl mx-auto">
            This service provides exam countdown timers for reference only. We
            are not affiliated with any exam conducting body. All information is
            subject to change. Please verify details from official sources
            before making decisions.
          </p>
          <p className="mt-3">
            Built by <a href="https://edbn.me">edbn.me</a> ·{" "}
            <Link href="/">Back to Deetnuts</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
