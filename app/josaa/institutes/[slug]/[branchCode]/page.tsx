import { notFound, permanentRedirect } from "next/navigation";
import { getCutoffCollege } from "@/lib/jee-cutoffs/repository";
import { getJeeSeoRoutes } from "@/lib/jee-cutoffs/seo";

export default async function Page({ params }: { params: Promise<{ slug: string; branchCode: string }> }) {
  const { slug, branchCode } = await params;
  const college = await getCutoffCollege(slug);
  if (!college) notFound();
  const route = (await getJeeSeoRoutes())
    .filter((candidate) => candidate.routeType === "program" && candidate.collegeId === college.id && (candidate.programSlug === branchCode || candidate.offeringId === branchCode))
    .sort((left, right) => (right.year ?? 0) - (left.year ?? 0))[0];
  if (!route) notFound();
  permanentRedirect(route.path);
}
