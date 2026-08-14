"use client";

import { useEffect, Suspense } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { sanitizeAnalyticsPathname } from "@/lib/admissions/analytics";

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
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };
  return window.gtag;
}

function RouteReporter() {
  const pathname = usePathname();
  const routeTemplate = sanitizeAnalyticsPathname(pathname);

  useEffect(() => {
    const gtag = ensureGtag();
    const safeLocation = `${window.location.origin}${routeTemplate}`;
    gtag("set", {
      page_path: routeTemplate,
      page_location: safeLocation,
    });
    if (!window.deetnutsAnalyticsConfigured) {
      gtag("js", new Date());
      gtag("config", GA_ID, {
        send_page_view: false,
        page_path: routeTemplate,
        page_location: safeLocation,
      });
      window.deetnutsAnalyticsConfigured = true;
    }
    gtag("event", "page_view", {
      page_path: routeTemplate,
      page_location: safeLocation,
    });
  }, [routeTemplate]);

  useReportWebVitals((metric) => {
    const gtag = ensureGtag();
    const routeTemplate = sanitizeAnalyticsPathname(window.location.pathname);
    gtag("event", metric.name, {
      value: Math.round(
        metric.name === "CLS" ? metric.value * 1000 : metric.value,
      ),
      event_label: metric.id,
      non_interaction: true,
      page_path: routeTemplate,
      page_location: `${window.location.origin}${routeTemplate}`,
    });
  });

  return null;
}

function DeferredAnalyticsScript() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (document.getElementById("deetnuts-ga-loader")) return;
      const script = document.createElement("script");
      script.id = "deetnuts-ga-loader";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      document.head.appendChild(script);
    }, 5_000);

    return () => window.clearTimeout(timer);
  }, []);

  return null;
}

export default function SanitizedGoogleAnalytics() {
  return (
    <>
      <DeferredAnalyticsScript />
      <Suspense fallback={null}>
        <RouteReporter />
      </Suspense>
    </>
  );
}
