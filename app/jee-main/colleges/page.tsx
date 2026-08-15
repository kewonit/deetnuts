import type { Metadata } from "next";
import { DirectoryPage, getDirectory } from "@/components/jee-cutoffs/CutoffPages";

export const metadata: Metadata = { title: "JEE Main College Cutoffs", description: "Browse source-backed JoSAA and CSAB cutoff histories for JEE Main colleges.", alternates: { canonical: "/jee-main/colleges" } };
export default async function Page() { return <DirectoryPage exam="jee-main" colleges={await getDirectory("jee-main")} />; }
