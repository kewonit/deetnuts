import { ImageResponse } from "next/og";
import CountdownImage from "@/components/timekeeper/CountdownImage";
import { exams, getExam } from "@/lib/timekeeper/exams";

// Regenerated hourly so the day count on a fresh download is current.
export const revalidate = 3600;
export const dynamicParams = false;
export function generateStaticParams() {
  return exams.map((exam) => ({ slug: exam.slug }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const exam = getExam((await params).slug);
  if (!exam) return new Response("Not found", { status: 404 });
  return new ImageResponse(
    <CountdownImage exam={exam} now={Date.now()} portrait />,
    {
      width: 1080,
      height: 1920,
      headers: {
        "Content-Disposition": `inline; filename="${exam.slug}-countdown-wallpaper.png"`,
      },
    },
  );
}
