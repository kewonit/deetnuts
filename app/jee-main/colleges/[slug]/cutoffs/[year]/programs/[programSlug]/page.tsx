import { ProgramPage, programMetadata } from "@/components/jee-cutoffs/ProgramPages";

export const dynamic = "force-static";
export const dynamicParams = true;
export function generateStaticParams() { return []; }

type Params = Promise<{ slug: string; year: string; programSlug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const value = await params;
  return programMetadata("jee-main", value.slug, Number(value.year), value.programSlug);
}

export default async function Page({ params }: { params: Params }) {
  const value = await params;
  return <ProgramPage exam="jee-main" college={value.slug} year={Number(value.year)} programSlug={value.programSlug} />;
}
