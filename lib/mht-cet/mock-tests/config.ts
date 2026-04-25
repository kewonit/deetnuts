import { SUBJECTS, type MhtCetSubject } from "../schema";

export type MhtCetMockMode =
  | "full_pcm"
  | "mathematics"
  | "physics_chemistry"
  | "custom";

export type MhtCetMockConfigInput = {
  mode?: MhtCetMockMode;
  subjects?: MhtCetSubject[];
  chapterSlugs?: string[];
  year?: number;
  examGroup?: "pcm" | "pcb";
  questionCount?: number;
  durationSeconds?: number;
};

export type NormalizedMhtCetMockConfig = {
  mode: MhtCetMockMode;
  subjects: MhtCetSubject[];
  chapterSlugs: string[];
  includeAllChapters: boolean;
  year?: number;
  examGroup: "pcm" | "pcb";
  questionCount: number;
  durationSeconds: number;
};

export const DEFAULT_MOCK_CONFIGS = {
  full_pcm: {
    subjects: ["mathematics", "physics", "chemistry"] as MhtCetSubject[],
    questionCount: 150,
    durationSeconds: 10_800,
  },
  mathematics: {
    subjects: ["mathematics"] as MhtCetSubject[],
    questionCount: 50,
    durationSeconds: 5_400,
  },
  physics_chemistry: {
    subjects: ["physics", "chemistry"] as MhtCetSubject[],
    questionCount: 100,
    durationSeconds: 5_400,
  },
  custom: {
    subjects: ["mathematics", "physics", "chemistry"] as MhtCetSubject[],
    questionCount: 30,
    durationSeconds: 3_600,
  },
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeSubjects(
  subjects: MhtCetSubject[] | undefined,
  fallback: MhtCetSubject[],
) {
  const allowedSubjects = new Set<string>(SUBJECTS);
  const uniqueSubjects = [...new Set(subjects ?? [])].filter((subject) =>
    allowedSubjects.has(subject),
  );

  return uniqueSubjects.length > 0 ? uniqueSubjects : [...fallback];
}

export function normalizeMockConfig(
  input: MhtCetMockConfigInput = {},
): NormalizedMhtCetMockConfig {
  const mode = input.mode ?? "full_pcm";
  const defaults = DEFAULT_MOCK_CONFIGS[mode];
  const chapterSlugs = [...new Set(input.chapterSlugs ?? [])]
    .map((chapterSlug) => chapterSlug.trim())
    .filter(Boolean);
  const rawQuestionCount = input.questionCount ?? defaults.questionCount;
  const rawDurationSeconds = input.durationSeconds ?? defaults.durationSeconds;
  const year =
    input.year && input.year >= 2000 && input.year <= 2100
      ? input.year
      : undefined;

  return {
    mode,
    subjects: normalizeSubjects(
      mode === "custom" ? input.subjects : undefined,
      defaults.subjects,
    ),
    chapterSlugs,
    includeAllChapters: chapterSlugs.length === 0,
    year,
    examGroup: input.examGroup ?? "pcm",
    questionCount: clamp(Math.trunc(rawQuestionCount), 1, 150),
    durationSeconds: clamp(Math.trunc(rawDurationSeconds), 300, 21_600),
  };
}
