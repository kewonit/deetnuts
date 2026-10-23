import { notFound } from "next/navigation";
import ExamCards from "@/components/timekeeper/ExamCards";
import JsonLd from "@/components/timekeeper/JsonLd";
import {
  categories,
  categorySlug,
  cycleYears,
  exams,
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

// Board searches are generic ("board exam 2027 class 10"), so that title names
// the classes instead of the category.
function categoryTitle(category: string, now: number) {
  const years = cycleYears(
    exams.filter((exam) => exam.category === category),
    now,
  );
  return category === "Board Exams"
    ? `Board Exam ${years} Countdown: Days Left for Class 10 & 12`
    : `${category} Exam Countdown ${years}: Days Left`;
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
  const title = categoryTitle(category, Date.now());
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
          {category.replace(/ Exams$/, "")} Exams
        </h1>
        <span className="text-sm themed-text-secondary">
          ({filtered.length} exams)
        </span>
      </div>
      <ExamCards exams={filtered} />
    </main>
  );
}
