import type { MhtCetQuestionStatus, MhtCetSubject } from "../schema";
import type { NormalizedMhtCetMockConfig } from "./config";

export type MockQuestionPoolItem = {
  id: string;
  subject: MhtCetSubject;
  chapterId?: string;
  chapterSlug?: string;
  year?: number;
  marks: number;
  verificationStatus: MhtCetQuestionStatus;
};

export type SelectedMockQuestion = MockQuestionPoolItem & {
  position: number;
};

export type SelectQuestionsForMockResult = {
  ok: boolean;
  questions: SelectedMockQuestion[];
  reason?: "insufficient_questions";
  required?: number;
  available?: number;
};

function hashSeed(seed: string) {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createSeededRandom(seed: string) {
  let state = hashSeed(seed) || 1;

  return () => {
    state = Math.imul(1664525, state) + 1013904223;
    return (state >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: readonly T[], seed: string) {
  const random = createSeededRandom(seed);
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

function getSubjectTargets(config: NormalizedMhtCetMockConfig) {
  if (config.mode === "full_pcm") {
    return new Map<MhtCetSubject, number>([
      ["mathematics", 50],
      ["physics", 50],
      ["chemistry", 50],
    ]);
  }

  if (config.mode === "mathematics") {
    return new Map<MhtCetSubject, number>([
      ["mathematics", config.questionCount],
    ]);
  }

  if (config.mode === "physics_chemistry") {
    return new Map<MhtCetSubject, number>([
      ["physics", 50],
      ["chemistry", 50],
    ]);
  }

  const baseCount = Math.floor(config.questionCount / config.subjects.length);
  let remainder = config.questionCount % config.subjects.length;

  return new Map(
    config.subjects.map((subject) => {
      const count = baseCount + (remainder > 0 ? 1 : 0);
      remainder -= 1;
      return [subject, count] as const;
    }),
  );
}

function questionMatchesConfig(
  question: MockQuestionPoolItem,
  config: NormalizedMhtCetMockConfig,
) {
  if (question.verificationStatus !== "approved") {
    return false;
  }

  if (!config.subjects.includes(question.subject)) {
    return false;
  }

  if (config.year && question.year !== config.year) {
    return false;
  }

  if (
    !config.includeAllChapters &&
    !config.chapterSlugs.includes(question.chapterSlug ?? "")
  ) {
    return false;
  }

  return true;
}

export function selectQuestionsForMock({
  pool,
  config,
  seed,
}: {
  pool: readonly MockQuestionPoolItem[];
  config: NormalizedMhtCetMockConfig;
  seed: string;
}): SelectQuestionsForMockResult {
  const filteredPool = pool.filter((question) =>
    questionMatchesConfig(question, config),
  );
  const subjectTargets = getSubjectTargets(config);
  const selectedQuestions: MockQuestionPoolItem[] = [];

  for (const [subject, requiredCount] of subjectTargets) {
    const subjectPool = filteredPool.filter(
      (question) => question.subject === subject,
    );

    if (subjectPool.length < requiredCount) {
      return {
        ok: false,
        questions: [],
        reason: "insufficient_questions",
        required: requiredCount,
        available: subjectPool.length,
      };
    }

    selectedQuestions.push(
      ...seededShuffle(subjectPool, `${seed}:${subject}`).slice(
        0,
        requiredCount,
      ),
    );
  }

  return {
    ok: true,
    questions: seededShuffle(selectedQuestions, `${seed}:final`).map(
      (question, index) => ({
        ...question,
        position: index + 1,
      }),
    ),
  };
}
