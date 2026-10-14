import type { Metadata } from "next";
import Link from "next/link";
import MhtCollegeDirectory, {
  type MhtDirectoryCollege,
} from "@/components/admissions/MhtCollegeDirectory";
import { getCollegesData } from "@/lib/college-data";
import { getMhtCetCollegeMedia } from "@/lib/admissions/college-media";
import { getMhtCetCollegePeaks } from "@/lib/admissions/mht-cet-peers";
import { getCanonicalMhtCetCollegePath } from "@/lib/admissions/proxy-canonical";
import { getMhtCetCollegePath } from "@/lib/admissions/canonical";
import "@/components/admissions/mht-directory.css";

export const metadata: Metadata = {
  title: "MHT-CET Colleges",
  description:
    "Browse Maharashtra engineering colleges, official MHT-CET cutoff evidence, and dated seat information.",
  alternates: { canonical: "/mht-cet/colleges" },
};

export const dynamic = "force-dynamic";

export default async function CollegesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const [colleges, peaks, { q }] = await Promise.all([
    getCollegesData(),
    getMhtCetCollegePeaks(),
    searchParams,
  ]);
  const peakByCode = new Map(peaks.map((peak) => [peak.collegeId, peak]));
  const rows: MhtDirectoryCollege[] = colleges.map((college) => {
    const id = String(Number(college.college_id));
    const logo = getMhtCetCollegeMedia(id)?.logo;
    const peak = peakByCode.get(id);
    return {
      code: id.padStart(5, "0"),
      // The current CAP list spells names as the college pages do; the 2024 directory title-cases them.
      name: peak?.name || college.college_name.trim(),
      path:
        getCanonicalMhtCetCollegePath(id) ??
        getMhtCetCollegePath(college.college_name, college.college_id),
      university: college.home_university?.trim() ?? "",
      status: college.status?.trim() ?? "",
      logo: logo ? { src: logo.src, background: logo.backgroundColor } : null,
      top: peak ? { percentile: peak.percentile, program: peak.program } : null,
    };
  });

  return (
    <main className="mht-main">
      <div className="mht-page mht-page-wide">
        <nav aria-label="Breadcrumb" className="mht-crumbs">
          <Link href="/mht-cet">MHT-CET</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Colleges</span>
        </nav>
        <MhtCollegeDirectory
          colleges={rows}
          initialQuery={typeof q === "string" ? q.slice(0, 100) : ""}
        />
      </div>
    </main>
  );
}
