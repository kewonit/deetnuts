import { notFound } from "next/navigation";
import ExamCards from "@/components/timekeeper/ExamCards";
import JsonLd from "@/components/timekeeper/JsonLd";
import {
  categories,
  categorySlug,
  exams,
  EXAM_COUNTDOWN_PATH,
} from "@/lib/timekeeper/exams";
import { pageSchema, timekeeperMetadata } from "@/lib/timekeeper/metadata";

export const dynamicParams = false;
export function generateStaticParams() {
  return categories.map((category) => ({ category: categorySlug(category) }));
}
function getCategory(slug: string) {
  return categories.find((category) => categorySlug(category) === slug);
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const slug = (await params).category;
  const category = getCategory(slug);
  if (!category) notFound();
  return timekeeperMetadata(
    `${EXAM_COUNTDOWN_PATH}/category/${slug}`,
    `${category} Exams Countdown`,
    `Live countdown timers for ${category.toLowerCase()} exams in India. Track exam dates, sessions and preparation time with TimeKeeper.`,
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
  return (
    <main className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-8 mb-8">
      <JsonLd
        value={pageSchema(
          `${EXAM_COUNTDOWN_PATH}/category/${slug}`,
          `${category} Exams Countdown`,
          `Track ${category.toLowerCase()} exam dates and countdowns.`,
        )}
      />
      <div className="flex items-baseline gap-3 mb-6">
        <h1 className="font-serif italic text-xl">{category} Exams</h1>
        <span className="text-sm themed-text-secondary">
          ({filtered.length} exams)
        </span>
      </div>
      <ExamCards exams={filtered} />
    </main>
  );
}
