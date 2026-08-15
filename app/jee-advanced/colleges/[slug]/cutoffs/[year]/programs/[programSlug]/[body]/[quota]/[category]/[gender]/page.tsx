import { ProfilePage, profileMetadata } from "@/components/jee-cutoffs/ProgramPages";

export const dynamic = "force-static";
export const dynamicParams = true;
export function generateStaticParams() { return []; }

type Params = Promise<{ slug: string; year: string; programSlug: string; body: string; quota: string; category: string; gender: string }>;

function routePath(value: Awaited<Params>) {
  return `/jee-advanced/colleges/${value.slug}/cutoffs/${value.year}/programs/${value.programSlug}/${value.body}/${value.quota}/${value.category}/${value.gender}`;
}

export async function generateMetadata({ params }: { params: Params }) {
  return profileMetadata(routePath(await params));
}

export default async function Page({ params }: { params: Params }) {
  return <ProfilePage routePath={routePath(await params)} />;
}
