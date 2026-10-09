import assert from "node:assert/strict";
import test from "node:test";
import manifest from "../../docs/timekeeper-migration/manifest.json";
import {
  categories,
  countdownTarget,
  displaySessions,
  exams,
  indexablePaths,
  relatedExams,
  shiftDate,
  timeRemaining,
} from "./exams";
import {
  generateDeterministicSessions,
  isWithinActiveHours,
} from "./demo-sessions";
import {
  TIMEKEEPER_SUPABASE_ORIGIN,
  validateTimekeeperPublicConfig,
} from "./public-config";
import { timekeeperCsp } from "./csp";

test("production inventory, manifest and sitemap agree without phantom pages", () => {
  assert.equal(exams.length, 58);
  assert.equal(categories.length, 13);
  assert.equal(indexablePaths.length, 74);
  assert.equal(new Set(exams.map((exam) => exam.slug)).size, 58);
  assert.deepEqual(
    new Set(Object.values(manifest.redirects)),
    new Set(indexablePaths),
  );
  for (const exam of exams) {
    assert.ok(
      exam.name &&
        exam.fullName &&
        exam.description &&
        exam.metaDescription &&
        exam.sessions.length,
    );
    assert.ok(
      relatedExams(exam).every(
        (related) => related !== exam && exams.includes(related),
      ),
    );
    assert.ok(
      exam.sessions.every((session) =>
        Number.isFinite(Date.parse(session.date)),
      ),
    );
  }
  const normal = (path: string) =>
    path === "/" ? path : path.replace(/\/+$/, "");
  for (const observed of manifest.observedLandingPaths) {
    const path = normal(observed);
    assert.ok(
      path in manifest.redirects ||
        path in manifest.aliases ||
        manifest.knownMissing.includes(path),
      `Unclassified Search Console landing: ${path}`,
    );
  }
});

test("countdowns switch from start to end of the active window and clamp expired timers", () => {
  const session = {
    session: "Window",
    date: "2026-10-10",
    endDate: "2026-10-12",
  };
  assert.equal(
    countdownTarget(session, Date.parse("2026-10-09")),
    session.date,
  );
  assert.equal(
    countdownTarget(session, Date.parse("2026-10-11")),
    session.endDate,
  );
  assert.equal(
    timeRemaining(session.endDate, Date.parse("2026-10-11")).days,
    1,
  );
  assert.deepEqual(timeRemaining(session.endDate, Date.parse("2026-10-13")), {
    expired: true,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  assert.equal(
    timeRemaining(session.date, Date.parse(session.date)).expired,
    true,
  );
});

test("predictions retain the original schedule and clamp leap days", () => {
  const sessions = [
    {
      session: "Leap",
      date: "2024-02-29",
      endDate: "2024-03-01",
      note: "Published",
    },
  ];
  assert.equal(shiftDate("2024-02-29", 1), "2025-02-28");
  const predicted = displaySessions(sessions, Date.parse("2025-02-01"));
  assert.equal(predicted[0].date, "2025-02-28");
  assert.equal(predicted[0].endDate, "2025-03-01");
  assert.equal(predicted[0].predicted, true);
  assert.match(predicted[0].note ?? "", /Published.*Predicted/);
  assert.equal(sessions[0].date, "2024-02-29");
  assert.deepEqual(
    displaySessions(sessions, Date.parse("2024-03-01")),
    sessions,
  );
  assert.deepEqual(displaySessions([], Date.now()), []);
});

test("example map markers are deterministic, explicitly labelled and limited to IST active hours", () => {
  const now = Date.parse("2026-10-09T12:00:00Z");
  const sessions = generateDeterministicSessions(now);
  assert.deepEqual(sessions, generateDeterministicSessions(now));
  assert.ok(sessions.length >= 5 && sessions.length <= 15);
  assert.ok(
    sessions.every(
      (session) =>
        session.is_demonstration &&
        session.latitude > 6 &&
        session.latitude < 38 &&
        Date.parse(session.started_at) <= now,
    ),
  );
  assert.equal(isWithinActiveHours(Date.parse("2026-10-09T21:30:00Z")), false);
  assert.deepEqual(
    generateDeterministicSessions(Date.parse("2026-10-09T21:30:00Z")),
    [],
  );
});

test("runtime config rejects privileged keys, replacement projects and unsafe origins", () => {
  const publicKey = "sb_publishable_test_only";
  assert.equal(
    validateTimekeeperPublicConfig(TIMEKEEPER_SUPABASE_ORIGIN, publicKey).url,
    TIMEKEEPER_SUPABASE_ORIGIN,
  );
  const jwt = (role: string) =>
    `header.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.signature`;
  assert.doesNotThrow(() =>
    validateTimekeeperPublicConfig(TIMEKEEPER_SUPABASE_ORIGIN, jwt("anon")),
  );
  for (const key of [jwt("service_role"), "sb_secret_test", "garbage"])
    assert.throws(() =>
      validateTimekeeperPublicConfig(TIMEKEEPER_SUPABASE_ORIGIN, key),
    );
  for (const url of [
    "http://ivmobluuegkikmbwbfhe.supabase.co",
    "https://other.supabase.co",
    `${TIMEKEEPER_SUPABASE_ORIGIN}/unsafe`,
    `${TIMEKEEPER_SUPABASE_ORIGIN}?key=secret`,
  ])
    assert.throws(() => validateTimekeeperPublicConfig(url, publicKey));
  const csp = timekeeperCsp(TIMEKEEPER_SUPABASE_ORIGIN, true);
  assert.ok(csp.includes(TIMEKEEPER_SUPABASE_ORIGIN));
  assert.ok(csp.includes("wss://ivmobluuegkikmbwbfhe.supabase.co"));
  assert.ok(!csp.includes("'unsafe-eval'") && !csp.includes("*.supabase.co"));
  assert.ok(
    !timekeeperCsp("https://evil.example/", true).includes("evil.example"),
  );
});
