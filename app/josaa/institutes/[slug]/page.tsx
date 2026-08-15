import { notFound, permanentRedirect } from "next/navigation";
import { getCutoffCollege } from "@/lib/jee-cutoffs/repository";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const college = await getCutoffCollege(slug);
  if (!college) notFound();
  permanentRedirect(`/${college.examId}/colleges/${college.id}`);
}
