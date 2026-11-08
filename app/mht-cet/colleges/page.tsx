import type { Metadata } from "next";
import Link from "next/link";
import MhtCollegeDirectory, {
  type MhtDirectoryCollege,
} from "@/components/admissions/MhtCollegeDirectory";
import { getMhtCetCollegeMedia } from "@/lib/admissions/college-media";
import { getMhtCetDirectory } from "@/lib/admissions/mht-cet-directory";
import { getMhtCetCollegePeaks } from "@/lib/admissions/mht-cet-peers";
import "@/components/admissions/mht-directory.css";

export const metadata: Metadata = {
  title: "MHT-CET Colleges",
  description:
    "Browse Maharashtra engineering colleges, official MHT-CET cutoff evidence, and dated seat information.",
  alternates: { canonical: "/mht-cet/colleges" },
};

// Top cutoffs come from PocketBase (cached), which the build cannot reach; the
// page is identical for every visitor, so it is cached at the edge instead.
export const dynamic = "force-dynamic";

export default async function CollegesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const [peaks, { q }] = await Promise.all([
    getMhtCetCollegePeaks().catch(() => []),
    searchParams,
  ]);
  const peakByCode = new Map(peaks.map((peak) => [peak.collegeId, peak]));
  // Every college in the current CAP year, as named and classified in its lists.
  const rows: MhtDirectoryCollege[] = getMhtCetDirectory().map((college) => {
    const id = String(Number(college.code));
    const logo = getMhtCetCollegeMedia(id)?.logo;
    const peak = peakByCode.get(id);
    return {
      code: college.code,
      name: college.name,
      path: college.path,
      university: college.homeUniversity,
      status: college.status,
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
