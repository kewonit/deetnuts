"use client";

import chapters from "@/data/mht-cet/question-bank/chapters.json";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { MhtCetMockMode } from "@/lib/mht-cet/mock-tests/config";
import type { MockTestAvailability } from "@/lib/mht-cet/mock-tests/supabase";
import type { MhtCetSubject } from "@/lib/mht-cet/schema";
import { cn } from "@/lib/utils";
import {
  Calculator,
  FlaskConical,
  Gauge,
  SlidersHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const modeOptions: Array<{
  mode: MhtCetMockMode;
  label: string;
  icon: typeof Gauge;
}> = [
  { mode: "full_pcm", label: "Full PCM", icon: Gauge },
  { mode: "mathematics", label: "Math", icon: Calculator },
  { mode: "physics_chemistry", label: "Phy/Chem", icon: FlaskConical },
  { mode: "custom", label: "Custom", icon: SlidersHorizontal },
];

const subjectLabels: Record<MhtCetSubject, string> = {
  mathematics: "Mathematics",
  physics: "Physics",
  chemistry: "Chemistry",
};

const allSubjects = Object.keys(subjectLabels) as MhtCetSubject[];

type ChapterSeed = {
  subject: MhtCetSubject;
  standard: number;
  slug: string;
  name: string;
};

function subjectsForMode(mode: MhtCetMockMode): MhtCetSubject[] {
  if (mode === "mathematics") {
    return ["mathematics"];
  }

  if (mode === "physics_chemistry") {
    return ["physics", "chemistry"];
  }

  return ["mathematics", "physics", "chemistry"];
}

function getSubjectQuestionCount(
  availability: MockTestAvailability,
  subjects: readonly MhtCetSubject[],
) {
  return subjects.reduce(
    (total, subject) => total + availability.subjectCounts[subject],
    0,
  );
}

function canRunPresetMode(
  availability: MockTestAvailability,
  mode: MhtCetMockMode,
) {
  if (mode === "custom") {
    return availability.totalApprovedQuestions > 0;
  }

  if (mode === "mathematics") {
    return availability.subjectCounts.mathematics >= 50;
  }

  if (mode === "physics_chemistry") {
    return (
      availability.subjectCounts.physics >= 50 &&
      availability.subjectCounts.chemistry >= 50
    );
  }

  return allSubjects.every(
    (subject) => availability.subjectCounts[subject] >= 50,
  );
}

function getInitialState(availability: MockTestAvailability) {
  if (canRunPresetMode(availability, "full_pcm")) {
    return {
      mode: "full_pcm" as MhtCetMockMode,
      subjects: subjectsForMode("full_pcm"),
      questionCount: 150,
      durationMinutes: 180,
    };
  }

  const availableSubjects = allSubjects.filter(
    (subject) => availability.subjectCounts[subject] > 0,
  );
  const subjects =
    availableSubjects.length > 0 ? availableSubjects : allSubjects;
  const availableQuestionCount = getSubjectQuestionCount(
    availability,
    subjects,
  );

  return {
    mode: "custom" as MhtCetMockMode,
    subjects,
    questionCount: Math.max(1, Math.min(30, availableQuestionCount)),
    durationMinutes: availableQuestionCount <= 5 ? 15 : 60,
  };
}

function getPreferredYear(availability: MockTestAvailability) {
  const years = Object.entries(availability.yearCounts).sort(
    ([, firstCount], [, secondCount]) => secondCount - firstCount,
  );

  return years[0]?.[0] ?? "";
}

export function MockBuilder({
  availability,
}: {
  availability: MockTestAvailability;
}) {
  const router = useRouter();
  const initialState = useMemo(
    () => getInitialState(availability),
    [availability],
  );
  const [mode, setMode] = useState<MhtCetMockMode>(initialState.mode);
  const [subjects, setSubjects] = useState<MhtCetSubject[]>(
    initialState.subjects,
  );
  const [chapterSlugs, setChapterSlugs] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(
    initialState.questionCount,
  );
  const [durationMinutes, setDurationMinutes] = useState(
    initialState.durationMinutes,
  );
  const [year, setYear] = useState(getPreferredYear(availability));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedSubjectQuestionCount = getSubjectQuestionCount(
    availability,
    subjects,
  );
  const maxQuestionCount = Math.max(1, selectedSubjectQuestionCount);

  const visibleChapters = useMemo(
    () =>
      (chapters as ChapterSeed[]).filter((chapter) =>
        subjects.includes(chapter.subject),
      ),
    [subjects],
  );

  function updateMode(nextMode: MhtCetMockMode) {
    if (!canRunPresetMode(availability, nextMode)) {
      return;
    }

    const nextSubjects = subjectsForMode(nextMode);
    setMode(nextMode);
    setSubjects(nextSubjects);
    setChapterSlugs([]);
    setQuestionCount(
      nextMode === "full_pcm" ? 150 : nextMode === "mathematics" ? 50 : 100,
    );
    setDurationMinutes(nextMode === "full_pcm" ? 180 : 90);
  }

  function toggleSubject(subject: MhtCetSubject) {
    const nextSubjects = subjects.includes(subject)
      ? subjects.filter((item) => item !== subject)
      : [...subjects, subject];
    setSubjects(nextSubjects.length > 0 ? nextSubjects : [subject]);
    setMode("custom");
    setQuestionCount((current) =>
      Math.min(
        current,
        Math.max(1, getSubjectQuestionCount(availability, nextSubjects)),
      ),
    );
    setChapterSlugs((current) =>
      current.filter((slug) =>
        (chapters as ChapterSeed[]).some(
          (chapter) =>
            chapter.slug === slug && nextSubjects.includes(chapter.subject),
        ),
      ),
    );
  }

  function toggleChapter(slug: string) {
    setChapterSlugs((current) =>
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug],
    );
  }

  async function startMock() {
    if (availability.totalApprovedQuestions === 0) {
      setError("No approved questions are available yet.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const parsedYear = year ? Number(year) : undefined;
    const response = await fetch("/api/mht-cet/mock-tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        subjects,
        chapterSlugs,
        questionCount,
        durationSeconds: durationMinutes * 60,
        year: Number.isFinite(parsedYear) ? parsedYear : undefined,
        examGroup: "pcm",
      }),
    });
    const payload = (await response.json()) as {
      attemptId?: string;
      error?: { message?: string };
    };

    setIsSubmitting(false);

    if (!response.ok || !payload.attemptId) {
      setError(
        payload.error?.message ===
          "Not enough approved questions for this mock configuration."
          ? `Only ${selectedSubjectQuestionCount} approved questions are available for this selection.`
          : (payload.error?.message ?? "Could not start this mock."),
      );
      return;
    }

    router.push(`/mht-cet/mock-tests/attempts/${payload.attemptId}`);
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 sm:grid-cols-4">
        {modeOptions.map((option) => {
          const Icon = option.icon;
          const disabled = !canRunPresetMode(availability, option.mode);
          return (
            <button
              className={cn(
                "flex items-center justify-center gap-2 rounded-base border-2 border-black bg-white px-3 py-3 font-base shadow-base transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none",
                mode === option.mode && "bg-main",
                disabled &&
                  "cursor-not-allowed opacity-50 hover:translate-x-0 hover:translate-y-0 hover:shadow-base",
              )}
              disabled={disabled}
              key={option.mode}
              onClick={() => updateMode(option.mode)}
              type="button"
            >
              <Icon className="h-4 w-4" />
              {option.label}
            </button>
          );
        })}
      </div>

      <section className="grid gap-4 rounded-base border-2 border-black bg-white p-5 shadow-base">
        <h2 className="font-heading text-2xl">Mock Setup</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {Object.entries(subjectLabels).map(([subject, label]) => (
            <label
              className="flex items-center gap-3 rounded-base border-2 border-black p-3"
              key={subject}
            >
              <Checkbox
                checked={subjects.includes(subject as MhtCetSubject)}
                onCheckedChange={() => toggleSubject(subject as MhtCetSubject)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-2">
            <span className="font-base">Questions</span>
            <Input
              max={maxQuestionCount}
              min={1}
              onChange={(event) =>
                setQuestionCount(
                  Math.min(maxQuestionCount, Number(event.target.value)),
                )
              }
              type="number"
              value={questionCount}
            />
          </label>
          <label className="grid gap-2">
            <span className="font-base">Minutes</span>
            <Input
              max={360}
              min={5}
              onChange={(event) =>
                setDurationMinutes(Number(event.target.value))
              }
              type="number"
              value={durationMinutes}
            />
          </label>
          <label className="grid gap-2">
            <span className="font-base">Year</span>
            <Input
              max={2100}
              min={2000}
              onChange={(event) => setYear(event.target.value)}
              placeholder="Any"
              type="number"
              value={year}
            />
          </label>
        </div>
      </section>

      <section className="grid gap-3 rounded-base border-2 border-black bg-white p-5 shadow-base">
        <h2 className="font-heading text-2xl">Chapters</h2>
        <div className="grid max-h-[360px] gap-2 overflow-auto pr-1 sm:grid-cols-2">
          {visibleChapters.map((chapter) => (
            <label
              className="flex items-center gap-3 rounded-base border-2 border-black p-3"
              key={chapter.slug}
            >
              <Checkbox
                checked={chapterSlugs.includes(chapter.slug)}
                onCheckedChange={() => toggleChapter(chapter.slug)}
              />
              <span className="text-sm">{chapter.name}</span>
            </label>
          ))}
        </div>
      </section>

      {error ? (
        <p className="rounded-base border-2 border-black bg-red-100 p-3 font-base text-red-950">
          {error}
        </p>
      ) : null}

      <Button
        className="h-12 text-base"
        disabled={isSubmitting || availability.totalApprovedQuestions === 0}
        onClick={startMock}
      >
        {isSubmitting ? "Starting..." : "Start Mock"}
      </Button>
    </div>
  );
}
