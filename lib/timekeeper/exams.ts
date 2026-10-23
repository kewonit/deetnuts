import metadata from "./exam-metadata.json";
import schedules from "./exam-sessions.json";

export const EXAM_COUNTDOWN_PATH = "/exam-countdown";
export const TIMEKEEPER_SOURCE_COMMIT =
  "8cb737981c61f06e7b0baca248f7e237c763abd4";

export interface ExamSession {
  session: string;
  date: string;
  endDate?: string;
  note?: string;
  predicted?: boolean;
  cycle?: string;
}

export interface Exam {
  id: string;
  slug: string;
  name: string;
  fullName: string;
  description: string;
  category: string;
  eligibility: string;
  subjects: string[];
  duration: string;
  conductingBody: string;
  seats: string;
  officialWebsite?: string;
  relatedExams: string[];
  keywords: string[];
  cycle: string;
  sessions: ExamSession[];
}

export const SCHEDULE_VERIFIED = schedules.verified;

// Keep published schedules unchanged. Prediction is a display operation; every
// page, card and description that shows an estimate must say it is expected.
export const exams: Exam[] = Object.entries(metadata.metadata).map(
  ([id, details]) => {
    const schedule = schedules.sessions.find((item) => item.id === id);
    return {
      id,
      ...details,
      cycle: schedule?.cycle ?? "",
      sessions: schedule?.sessions ?? [],
    };
  },
);

export function categorySlug(category: string): string {
  return category.toLowerCase().replace(/\s+/g, "-");
}

export const categories = Array.from(
  new Set(exams.map((exam) => exam.category)),
);
export function getExam(slug: string): Exam | undefined {
  return exams.find((exam) => exam.slug === slug);
}

export function relatedExams(exam: Exam): Exam[] {
  const related = exam.relatedExams
    .map(getExam)
    .filter((item) => item !== undefined)
    .slice(0, 4);
  return [
    ...related,
    ...exams.filter(
      (item) =>
        item.category === exam.category &&
        item.slug !== exam.slug &&
        !related.includes(item),
    ),
  ].slice(0, 4);
}

export function shiftDate(date: string, years: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year + years, month - 1, day));
  if (shifted.getUTCMonth() !== month - 1) shifted.setUTCDate(0);
  return shifted.toISOString().slice(0, 10);
}

export function displaySessions(
  sessions: ExamSession[],
  now: number,
): ExamSession[] {
  const sorted = [...sessions].sort(
    (a, b) => Date.parse(a.date) - Date.parse(b.date),
  );
  const upcoming = sorted.filter(
    (session) => Date.parse(session.endDate ?? session.date) >= now,
  );
  if (upcoming.length) return upcoming;
  let predicted = sorted;
  for (let years = 1; years <= 5; years++) {
    predicted = sorted.map((session) => ({
      ...session,
      date: shiftDate(session.date, years),
      ...(session.endDate
        ? { endDate: shiftDate(session.endDate, years) }
        : {}),
      predicted: true,
      note: [
        session.note,
        "Predicted next cycle from the latest published schedule",
      ]
        .filter(Boolean)
        .join(" · "),
    }));
    if (
      predicted.some(
        (session) => Date.parse(session.endDate ?? session.date) >= now,
      )
    )
      break;
  }
  return predicted;
}

export function nextSession(
  sessions: ExamSession[],
  now: number,
): ExamSession | undefined {
  const displayed = displaySessions(sessions, now);
  return (
    displayed.find((item) => Date.parse(item.endDate ?? item.date) >= now) ??
    displayed[0]
  );
}

// Sessions can belong to a later cycle than the exam's headline cycle, such as
// a 2027 prelims listed after the 2026 interviews. Browser predictions shift a
// whole schedule forward, so their cycle moves forward by the same years.
export function examCycle(exam: Exam, now: number): string {
  const session = nextSession(exam.sessions, now);
  if (!session) return exam.cycle;
  const cycle = session.cycle ?? exam.cycle;
  const published = exam.sessions.find(
    (item) => item.session === session.session,
  );
  const years = published
    ? Number(session.date.slice(0, 4)) - Number(published.date.slice(0, 4))
    : 0;
  return years
    ? cycle.replace(/\d{4}/, (year) => String(Number(year) + years))
    : cycle;
}

export function cycleYears(list: Exam[], now: number): string {
  const years = Array.from(
    new Set(list.flatMap((exam) => examCycle(exam, now).match(/\d{4}/) ?? [])),
  ).sort();
  return years.length > 1
    ? `${years[0]}-${years[years.length - 1].slice(2)}`
    : (years[0] ?? "");
}

export function countdownTarget(session: ExamSession, now: number): string {
  return session.endDate && now >= Date.parse(session.date)
    ? session.endDate
    : session.date;
}

export function timeRemaining(target: string, now: number) {
  const difference = Math.max(0, Date.parse(target) - now);
  const total = Math.floor(difference / 1000);
  return {
    expired: Date.parse(target) <= now,
    days: Math.floor(total / 86400),
    hours: Math.floor(total / 3600) % 24,
    minutes: Math.floor(total / 60) % 60,
    seconds: total % 60,
  };
}

export function formatExamDate(date: string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    ...(date.includes("T") ? {} : { timeZone: "UTC" }),
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export const indexablePaths = [
  EXAM_COUNTDOWN_PATH,
  `${EXAM_COUNTDOWN_PATH}/countdown`,
  `${EXAM_COUNTDOWN_PATH}/study-map`,
  ...exams.map((exam) => `${EXAM_COUNTDOWN_PATH}/exams/${exam.slug}`),
  ...categories.map(
    (category) => `${EXAM_COUNTDOWN_PATH}/category/${categorySlug(category)}`,
  ),
];
