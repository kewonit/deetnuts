import { CollegeHubPage, hubMetadata } from "@/components/jee-cutoffs/CutoffPages";
import { getCutoffCollegeStaticParams } from "@/lib/jee-cutoffs/repository";

export const dynamicParams = true;
export async function generateStaticParams() { return getCutoffCollegeStaticParams("jee-advanced"); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { return hubMetadata("jee-advanced", (await params).slug); }
export default async function Page({ params }: { params: Promise<{ slug: string }> }) { return <CollegeHubPage exam="jee-advanced" slug={(await params).slug} />; }
