import type { Metadata } from "next";
import Link from "next/link";
import { getJeeCutoffCatalog } from "@/lib/jee-cutoffs/repository";

export const metadata: Metadata = { title: "JEE Main and JEE Advanced College Cutoffs", description: "Verified JoSAA and CSAB opening and closing rank histories for JEE Main and JEE Advanced colleges.", alternates: { canonical: "/jee-cutoffs" } };

export default async function Page() {
  const catalog = await getJeeCutoffCatalog();
  const mainColleges = catalog.colleges.filter((college) => college.examId === "jee-main").length;
  const advancedColleges = catalog.colleges.filter((college) => college.examId === "jee-advanced").length;
  return <main className="cutoff-main cutoff-landing"><header className="cutoff-hero"><span className="cutoff-kicker">JEE Main and JEE Advanced</span><h1>JEE college cutoffs</h1><p className="cutoff-lead">Official opening and closing ranks by college, year, program, round, quota, category and gender.</p></header><section className="cutoff-section" aria-labelledby="choose-exam-title"><div className="cutoff-section-heading"><div><h2 id="choose-exam-title">Choose an exam</h2></div></div><div className="cutoff-exam-grid"><Link className="cutoff-exam-card" href="/jee-main/colleges"><div><span className="cutoff-kicker">{mainColleges} colleges</span><h2>JEE Main</h2><p>NITs, IIITs and GFTIs across JoSAA and available CSAB rounds.</p></div><span className="cutoff-card-arrow" aria-hidden="true">↗</span></Link><Link className="cutoff-exam-card" href="/jee-advanced/colleges"><div><span className="cutoff-kicker">{advancedColleges} IITs</span><h2>JEE Advanced</h2><p>IIT opening and closing ranks across JoSAA rounds.</p></div><span className="cutoff-card-arrow" aria-hidden="true">↗</span></Link></div></section></main>;
}
