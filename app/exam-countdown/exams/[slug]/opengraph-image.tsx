import { ImageResponse } from "next/og";
import CountdownImage from "@/components/timekeeper/CountdownImage";
import { exams, getExam } from "@/lib/timekeeper/exams";

export const revalidate = 3600;
export const alt = "Exam countdown with days left";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export function generateStaticParams() {
  return exams.map((exam) => ({ slug: exam.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const exam = getExam((await params).slug);
  if (!exam) return new Response("Not found", { status: 404 });
  return new ImageResponse(
    <CountdownImage exam={exam} now={Date.now()} portrait={false} />,
    size,
  );
}
