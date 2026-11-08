"use client";

// One /api/auth/session request shared by everything that asks for it at the
// same moment (the navbar and a page both checking on load). Each navigation
// still asks again, so sign-in and sign-out show up right away.
const SHARE_WINDOW_MS = 5_000;

let pending: Promise<unknown> | null = null;
let startedAt = 0;

/** The signed-in user from /api/auth/session, or null. */
export function loadSessionUser(): Promise<unknown> {
  if (pending && Date.now() - startedAt < SHARE_WINDOW_MS) return pending;
  startedAt = Date.now();
  pending = fetch("/api/auth/session", { cache: "no-store", credentials: "same-origin" })
    .then((response) => (response.ok ? response.json() : { user: null }))
    .then((data: { user?: unknown }) => data.user ?? null)
    .catch(() => null);
  return pending;
}
