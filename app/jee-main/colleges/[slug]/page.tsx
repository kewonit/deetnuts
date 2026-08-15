import { CollegeHubPage, hubMetadata } from "@/components/jee-cutoffs/CutoffPages";
import { getCutoffCollegeStaticParams } from "@/lib/jee-cutoffs/repository";

export const dynamicParams = true;
export async function generateStaticParams() { return getCutoffCollegeStaticParams("jee-main"); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { return hubMetadata("jee-main", (await params).slug); }
export default async function Page({ params }: { params: Promise<{ slug: string }> }) { return <CollegeHubPage exam="jee-main" slug={(await params).slug} />; }
