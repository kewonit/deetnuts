import { CollegeYearPage, yearMetadata } from "@/components/jee-cutoffs/CutoffPages";
import { getCutoffStaticParams } from "@/lib/jee-cutoffs/repository";

export const dynamicParams = true;
export async function generateStaticParams() { return getCutoffStaticParams("jee-main"); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string; year: string }> }) { const value = await params; return yearMetadata("jee-main", value.slug, Number(value.year)); }
export default async function Page({ params }: { params: Promise<{ slug: string; year: string }> }) { const value = await params; return <CollegeYearPage exam="jee-main" slug={value.slug} year={Number(value.year)} />; }
