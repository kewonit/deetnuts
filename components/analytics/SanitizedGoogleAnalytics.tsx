"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { sanitizeAnalyticsPathname } from "@/lib/admissions/analytics";
import { readAnalyticsConsent } from "./consent";

const GA_ID = "G-PF9S037SJQ";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    deetnutsAnalyticsConfigured?: boolean;
  }
}

function ensureGtag() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(...args: unknown[]) { window.dataLayer.push(args); };
  return window.gtag;
}

function setConsentDefaults() {
  ensureGtag()("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500,
  });
}

function loadGoogleScript() {
  if (document.getElementById("deetnuts-ga-loader")) return;
  const script = document.createElement("script");
  script.id = "deetnuts-ga-loader";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
}

function RouteReporter({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const routeTemplate = sanitizeAnalyticsPathname(pathname);

  useEffect(() => {
    if (!enabled) return;
    const gtag = ensureGtag();
    const safeLocation = `${window.location.origin}${routeTemplate}`;
    if (!window.deetnutsAnalyticsConfigured) {
      gtag("js", new Date());
      gtag("config", GA_ID, {
        send_page_view: false,
        page_path: routeTemplate,
        page_location: safeLocation,
        page_referrer: "",
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        cookie_expires: 60 * 60 * 24 * 180,
      });
      window.deetnutsAnalyticsConfigured = true;
    }
    gtag("event", "page_view", { page_path: routeTemplate, page_location: safeLocation });
  }, [enabled, routeTemplate]);

  useReportWebVitals((metric) => {
    if (!enabled) return;
    const safePath = sanitizeAnalyticsPathname(window.location.pathname);
    ensureGtag()("event", metric.name, {
      value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
      page_path: safePath,
      page_location: `${window.location.origin}${safePath}`,
    });
  });
  return null;
}

export default function SanitizedGoogleAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setConsentDefaults();
    const applyConsent = (granted: boolean) => {
      ensureGtag()("consent", "update", {
        analytics_storage: granted ? "granted" : "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
      setEnabled(granted);
      if (granted) loadGoogleScript();
    };
    applyConsent(readAnalyticsConsent() === "granted");
    const onConsent = (event: Event) => applyConsent((event as CustomEvent<{ granted: boolean }>).detail.granted);
    window.addEventListener("deetnuts:analytics-consent", onConsent);
    return () => window.removeEventListener("deetnuts:analytics-consent", onConsent);
  }, []);

  return <Suspense fallback={null}><RouteReporter enabled={enabled} /></Suspense>;
}
