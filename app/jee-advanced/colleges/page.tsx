import type { Metadata } from "next";
import { DirectoryPage, getDirectory } from "@/components/jee-cutoffs/CutoffPages";

export const metadata: Metadata = { title: "JEE Advanced College Cutoffs", description: "Browse source-backed JoSAA cutoff histories for IITs in the JEE Advanced dataset.", alternates: { canonical: "/jee-advanced/colleges" } };
export default async function Page() { return <DirectoryPage exam="jee-advanced" colleges={await getDirectory("jee-advanced")} />; }
