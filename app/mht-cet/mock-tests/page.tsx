import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import {
  EMPTY_MOCK_TEST_AVAILABILITY,
  loadMockTestAvailability,
  loadRecentMockAttempts,
  type MockAttemptSummary,
} from "@/lib/mht-cet/mock-tests/supabase";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  PlayCircle,
  Trophy,
} from "lucide-react";
import Link from "next/link";

const statusLabels: Record<MockAttemptSummary["displayStatus"], string> = {
  in_progress: "In progress",
  submitted: "Submitted",
  expired: "Expired",
  abandoned: "Abandoned",
};

function formatScore(attempt: MockAttemptSummary) {
  if (attempt.displayStatus === "in_progress" && attempt.scoreRaw === 0) {
    return "Pending";
  }

  return `${attempt.scoreRaw}/${attempt.maxScore}`;
}

function formatDate(value: string) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getAttemptHref(attempt: MockAttemptSummary) {
  if (attempt.displayStatus === "in_progress") {
    return `/mht-cet/mock-tests/attempts/${attempt.id}`;
  }

  return `/mht-cet/mock-tests/attempts/${attempt.id}/results`;
}

export default async function MhtCetMockTestsPage() {
  const user = await getCurrentUser();
  const [availability, attempts] = await Promise.all([
    loadMockTestAvailability().catch(() => EMPTY_MOCK_TEST_AVAILABILITY),
    user
      ? loadRecentMockAttempts(user.id).catch(() => [])
      : Promise.resolve([]),
  ]);
  const completedAttempts = attempts.filter(
    (attempt) => attempt.displayStatus !== "in_progress",
  );
  const bestAttempt = completedAttempts.reduce<MockAttemptSummary | null>(
    (best, attempt) => {
      if (!best) {
        return attempt;
      }

      const bestRatio = best.scoreRaw / Math.max(best.maxScore, 1);
      const attemptRatio = attempt.scoreRaw / Math.max(attempt.maxScore, 1);

      return attemptRatio > bestRatio ? attempt : best;
    },
    null,
  );

  return (
    <main className="mx-auto grid max-w-6xl gap-8 p-5 pt-24">
      <header className="grid gap-3">
        <h1 className="font-heading text-4xl sm:text-5xl">
          MHT-CET Mock Tests
        </h1>
        <p className="max-w-2xl font-base text-lg">
          Timed mocks with approved question imports, server-side scoring, and
          clear result tables.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="grid gap-5 rounded-base border-2 border-black bg-main p-5 shadow-base">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <PlayCircle className="h-6 w-6" aria-hidden="true" />
                <h2 className="font-heading text-3xl">Start a mock</h2>
              </div>
              <p className="max-w-xl font-base">
                Choose subjects, year, chapters, question count, and duration.
              </p>
            </div>
            <Button asChild>
              <Link href="/mht-cet/mock-tests/new">Create Mock</Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-base border-2 border-black bg-white p-4">
              <p className="font-heading text-3xl">
                {availability.totalApprovedQuestions}
              </p>
              <p className="font-base text-sm">approved questions</p>
            </div>
            <div className="rounded-base border-2 border-black bg-white p-4">
              <p className="font-heading text-3xl">
                {availability.yearCounts["2026"] ?? 0}
              </p>
              <p className="font-base text-sm">2026 practice rows</p>
            </div>
            <div className="rounded-base border-2 border-black bg-white p-4">
              <p className="font-heading text-3xl">
                {Math.min(
                  availability.subjectCounts.mathematics,
                  availability.subjectCounts.physics,
                  availability.subjectCounts.chemistry,
                )}
              </p>
              <p className="font-base text-sm">per PCM subject</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 rounded-base border-2 border-black bg-white p-5 shadow-base">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6" aria-hidden="true" />
            <h2 className="font-heading text-2xl">Your stats</h2>
          </div>
          <div className="grid gap-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <span className="font-base">Attempts</span>
              <span className="font-heading text-xl">{attempts.length}</span>
            </div>
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <span className="font-base">Completed</span>
              <span className="font-heading text-xl">
                {completedAttempts.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-base">Best score</span>
              <span className="font-heading text-xl">
                {bestAttempt ? formatScore(bestAttempt) : "Pending"}
              </span>
            </div>
          </div>
        </section>
      </div>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" aria-hidden="true" />
            <h2 className="font-heading text-3xl">Recent attempts</h2>
          </div>
          {user ? null : (
            <Button asChild variant="neutral">
              <Link href="/login">Sign in to save scores</Link>
            </Button>
          )}
        </div>

        {!user ? (
          <div className="rounded-base border-2 border-black bg-white p-5 shadow-base">
            <p className="font-base text-lg">
              Sign in before starting a mock to save attempts, review marks, and
              reopen result tables later.
            </p>
          </div>
        ) : attempts.length === 0 ? (
          <div className="grid gap-4 rounded-base border-2 border-black bg-white p-5 shadow-base">
            <FileText className="h-8 w-8" aria-hidden="true" />
            <div>
              <h3 className="font-heading text-2xl">No attempts yet</h3>
              <p className="font-base">
                Create a mock and your scores will appear here.
              </p>
            </div>
            <Button asChild className="w-fit">
              <Link href="/mht-cet/mock-tests/new">Create Mock</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-base border-2 border-black bg-white shadow-base">
            <div className="grid gap-0">
              {attempts.map((attempt) => (
                <article
                  className="grid gap-4 border-b-2 border-black p-4 last:border-b-0 md:grid-cols-[1fr_auto] md:items-center"
                  key={attempt.id}
                >
                  <div className="grid gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {attempt.displayStatus === "in_progress" ? (
                        <Clock3 className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                      )}
                      <h3 className="font-heading text-xl">
                        {attempt.examGroup.toUpperCase()} mock
                      </h3>
                      <span className="rounded-base border-2 border-black bg-main px-2 py-1 text-xs font-bold">
                        {statusLabels[attempt.displayStatus]}
                      </span>
                    </div>
                    <div className="grid gap-2 text-sm font-base text-black/75 sm:grid-cols-4">
                      <span>{attempt.questionCount} questions</span>
                      <span>Score {formatScore(attempt)}</span>
                      <span>{attempt.correctCount} correct</span>
                      <span>
                        {formatDate(attempt.submittedAt ?? attempt.startedAt)}
                      </span>
                    </div>
                  </div>
                  <Button asChild variant="neutral">
                    <Link href={getAttemptHref(attempt)}>
                      {attempt.displayStatus === "in_progress"
                        ? "Continue"
                        : "Review Marks"}
                    </Link>
                  </Button>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
