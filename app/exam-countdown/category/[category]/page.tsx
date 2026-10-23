import { notFound } from "next/navigation";
import ExamCards from "@/components/timekeeper/ExamCards";
import ExamDatesTable from "@/components/timekeeper/ExamDatesTable";
import JsonLd from "@/components/timekeeper/JsonLd";
import {
  categories,
  categorySlug,
  cycleYears,
  exams,
  nextSession,
  EXAM_COUNTDOWN_PATH,
} from "@/lib/timekeeper/exams";
import {
  breadcrumbSchema,
  pageSchema,
  timekeeperMetadata,
} from "@/lib/timekeeper/metadata";

export const dynamicParams = false;
export function generateStaticParams() {
  return categories.map((category) => ({ category: categorySlug(category) }));
}
function getCategory(slug: string) {
  return categories.find((category) => categorySlug(category) === slug);
}

function categoryHeading(category: string, now: number) {
  const years = cycleYears(
    exams.filter((exam) => exam.category === category),
    now,
  );
  return category === "Board Exams"
    ? `Board Exam ${years} Countdown`
    : `${category} Exam Countdown ${years}`;
}

// Board searches are generic ("board exam 2027 class 10"), so that title names
// the classes instead of the category.
function categoryTitle(category: string, now: number) {
  return `${categoryHeading(category, now)}: Days Left${category === "Board Exams" ? " for Class 10 & 12" : ""}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const slug = (await params).category;
  const category = getCategory(slug);
  if (!category) notFound();
  const names = exams
    .filter((exam) => exam.category === category)
    .map((exam) => exam.name);
  return timekeeperMetadata(
    `${EXAM_COUNTDOWN_PATH}/category/${slug}`,
    categoryTitle(category, Date.now()),
    `How many days are left for ${names.slice(0, 4).join(", ")}${names.length > 4 ? " and more" : ""}? Live countdowns with every session date.`,
  );
}
export default async function Page({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const slug = (await params).category;
  const category = getCategory(slug);
  if (!category) notFound();
  const filtered = exams.filter((exam) => exam.category === category);
  const path = `${EXAM_COUNTDOWN_PATH}/category/${slug}`;
  const now = Date.now();
  const title = categoryTitle(category, now);
  const nextRows = (list: typeof exams) =>
    list
      .flatMap((exam) => {
        const session = nextSession(exam.sessions, now);
        return session ? [{ exam, session }] : [];
      })
      .sort((a, b) => Date.parse(a.session.date) - Date.parse(b.session.date));
  const groups =
    category === "Board Exams"
      ? [10, 12].map((level) => ({
          heading: `Class ${level} board exams ${cycleYears(
            filtered.filter((exam) => exam.classLevel === level),
            now,
          )}`,
          rows: nextRows(filtered.filter((exam) => exam.classLevel === level)),
        }))
      : [{ heading: "Dates", rows: nextRows(filtered) }];
  return (
    <main className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-8 mb-8">
      <JsonLd
        value={pageSchema(
          path,
          title,
          `Track ${category.toLowerCase()} exam dates and countdowns.`,
        )}
      />
      <JsonLd value={breadcrumbSchema([{ name: category, path }])} />
      <div className="flex items-baseline gap-3 mb-6">
        <h1 className="font-serif italic text-xl">
          {categoryHeading(category, now)}
        </h1>
        <span className="text-sm themed-text-secondary">
          ({filtered.length} exams)
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {groups.map((group) => (
          <section
            key={group.heading}
            className={`border border-dashed themed-border rounded-lg p-4 sm:p-6 themed-bg${groups.length === 1 ? " lg:col-span-2" : ""}`}
          >
            <h2 className="font-serif italic text-xl mb-4">{group.heading}</h2>
            <ExamDatesTable rows={group.rows} now={now} />
          </section>
        ))}
      </div>
      <ExamCards exams={filtered} />
    </main>
  );
}
