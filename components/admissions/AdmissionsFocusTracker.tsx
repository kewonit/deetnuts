"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    deetnutsAdmissionsTrigger?: HTMLAnchorElement;
  }
}

const DETAIL_PATH = /^\/mht-cet\/colleges\/[^/]+\/?$/;

export default function AdmissionsFocusTracker() {
  useEffect(() => {
    const rememberTrigger = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>("a[href]");
      if (!link) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin === window.location.origin && DETAIL_PATH.test(url.pathname)) {
        window.deetnutsAdmissionsTrigger = link;
      }
    };

    document.addEventListener("click", rememberTrigger, true);
    return () => document.removeEventListener("click", rememberTrigger, true);
  }, []);

  return null;
}
