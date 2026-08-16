"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  clearGoogleAnalyticsCookies,
  hasGlobalPrivacyControl,
  readAnalyticsConsent,
  type AnalyticsConsentChoice,
  writeAnalyticsConsent,
} from "./consent";

export function CookieSettingsButton({ className = "" }: { className?: string }) {
  return <button type="button" className={className} onClick={() => window.dispatchEvent(new Event("deetnuts:open-cookie-settings"))}>Cookie settings</button>;
}

export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<AnalyticsConsentChoice | null>(null);
  const [privacySignal, setPrivacySignal] = useState(false);

  useEffect(() => {
    const signal = hasGlobalPrivacyControl();
    const stored = readAnalyticsConsent();
    setPrivacySignal(signal);
    setChoice(stored);
    setOpen(stored === null && !signal);
    const show = () => setOpen(true);
    window.addEventListener("deetnuts:open-cookie-settings", show);
    return () => window.removeEventListener("deetnuts:open-cookie-settings", show);
  }, []);

  const choose = (next: AnalyticsConsentChoice) => {
    if (next === "granted" && privacySignal) return;
    const previous = readAnalyticsConsent();
    writeAnalyticsConsent(next);
    if (previous === "granted" && next === "denied") {
      clearGoogleAnalyticsCookies();
      window.location.reload();
      return;
    }
    window.dispatchEvent(new CustomEvent("deetnuts:analytics-consent", { detail: { granted: next === "granted" } }));
    setChoice(next);
    setOpen(false);
  };

  if (!open) return null;
  return <section className="analytics-consent fixed inset-x-3 bottom-3 z-[100] border p-2.5 font-sans shadow-[2px_2px_0_0_var(--consent-shadow)] sm:left-auto sm:right-4 sm:w-[19rem]" role="dialog" aria-label="Analytics cookie settings"><h2 className="text-xs font-bold">Optional analytics</h2><p className="analytics-consent-copy mt-1 text-[11px] leading-4">Share limited usage data to help improve speed and usability. Cutoff filters and personal details are excluded. Advertising stays off.</p>{privacySignal ? <p className="analytics-consent-meta mt-1.5 text-[10px] leading-4" role="status">Your browser privacy signal keeps analytics off.</p> : null}<div className="mt-2 grid grid-cols-2 gap-1.5"><button type="button" className="analytics-consent-decline min-h-9 border px-3 text-[11px] font-bold" onClick={() => choose("denied")}>Decline</button><button type="button" className="analytics-consent-allow min-h-9 border px-3 text-[11px] font-bold disabled:cursor-not-allowed disabled:opacity-50" disabled={privacySignal} onClick={() => choose("granted")}>Allow</button></div>{choice ? <p className="analytics-consent-meta mt-1.5 text-[10px]">Current choice: {choice === "granted" ? "analytics allowed" : "analytics declined"}.</p> : null}<p className="mt-1.5 flex gap-3 text-[10px]"><Link className="analytics-consent-link underline" href="/compliance/cookie-policy">Cookie policy</Link><Link className="analytics-consent-link underline" href="/compliance/privacy-policy">Privacy</Link></p></section>;
}
