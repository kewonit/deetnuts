"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const COOKIE_NAME = "deetnuts_analytics_consent";
type Choice = "granted" | "denied";

function readChoice(): Choice | null {
  const value = document.cookie.split("; ").find((item) => item.startsWith(`${COOKIE_NAME}=`))?.split("=")[1];
  return value === "granted" || value === "denied" ? value : null;
}

function persistChoice(choice: Choice) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_NAME}=${choice}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent("deetnuts:analytics-consent", { detail: { granted: choice === "granted" } }));
}

export function CookieSettingsButton({ className = "" }: { className?: string }) {
  return <button type="button" className={className} onClick={() => window.dispatchEvent(new Event("deetnuts:open-cookie-settings"))}>Cookie settings</button>;
}

export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<Choice | null>(null);

  useEffect(() => {
    const stored = readChoice();
    setChoice(stored);
    setOpen(stored === null);
    const show = () => setOpen(true);
    window.addEventListener("deetnuts:open-cookie-settings", show);
    return () => window.removeEventListener("deetnuts:open-cookie-settings", show);
  }, []);

  const choose = (next: Choice) => {
    persistChoice(next);
    setChoice(next);
    setOpen(false);
  };

  if (!open) return null;
  return <section className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-xl border-2 border-black bg-white p-4 font-sans text-black shadow-[6px_6px_0_0_#000]" role="dialog" aria-label="Analytics cookie settings"><h2 className="text-base font-bold">Analytics cookies</h2><p className="mt-2 text-sm leading-6 text-gray-700">DEETNUTS works without analytics. If you allow it, limited Google Analytics data helps us improve speed and usability. Cutoff filters and personal details are never sent. Advertising stays off.</p><div className="mt-4 grid grid-cols-2 gap-3"><button type="button" className="min-h-11 border-2 border-black bg-white px-4 text-sm font-bold" onClick={() => choose("denied")}>Decline</button><button type="button" className="min-h-11 border-2 border-black bg-black px-4 text-sm font-bold text-white" onClick={() => choose("granted")}>Allow</button></div>{choice ? <p className="mt-3 text-xs text-gray-600">Current choice: {choice === "granted" ? "analytics allowed" : "analytics declined"}.</p> : null}<p className="mt-3 text-xs"><Link className="underline" href="/compliance/cookie-policy">Cookie policy</Link></p></section>;
}
