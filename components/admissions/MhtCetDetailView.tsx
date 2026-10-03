import Link from "next/link";
import AdmissionsFitGate from "@/components/admissions/AdmissionsFitGate";
import AdmissionsFilters from "@/components/admissions/AdmissionsFilters";
import AdmissionsJsonLd from "@/components/admissions/AdmissionsJsonLd";
import CopyCollegeCode from "@/components/admissions/CopyCollegeCode";
import CollegeIdentityMedia from "@/components/admissions/CollegeIdentityMedia";
import CutoffObservations from "@/components/admissions/CutoffObservations";
import ProvenanceCard from "@/components/admissions/ProvenanceCard";
import type { MhtCetCollegeDetailModel } from "@/lib/admissions/types";
import { withNeutralAdmissionsQuery } from "@/lib/admissions/query-state";
import { getMhtCetCollegeMedia } from "@/lib/admissions/college-media";

const serif = "[font-family:var(--font-serif-display)] italic";
const card =
  "mht-profile-card mht-college-section overflow-hidden rounded-xl border border-zinc-200";

export default function MhtCetDetailView({
  model,
  variant = "full",
}: {
  model: MhtCetCollegeDetailModel;
  variant?: "full" | "sheet";
}) {
  const collegeCode = model.college.collegeId.padStart(5, "0");
  const initial = model.college.name.trim().charAt(0).toUpperCase() || "—";
  const sectionItems = [
    { href: "#fit", label: "Historical fit" },
    { href: "#cutoffs", label: "Cutoffs" },
    ...(model.seatMatrix.length > 0
      ? [{ href: "#seats", label: "2024 seat matrix" }]
      : []),
    { href: "#source", label: "Source" },
  ];

  return (
    <>
      <AdmissionsJsonLd
        kind="college"
        name={model.college.name}
        canonicalPath={model.canonicalPath}
        location={{ region: "Maharashtra" }}
        system="MHT-CET"
      />
      <div
        className={
          variant === "sheet"
            ? "mht-college mht-college-in-sheet"
            : "mht-college"
        }
      >
        <div className="mx-auto w-full max-w-6xl space-y-6 p-4">
          {variant === "full" ? (
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap gap-2 text-sm text-zinc-500"
            >
              <Link href="/mht-cet">MHT-CET</Link>
              <span aria-hidden="true">/</span>
              <Link href="/mht-cet/colleges">Colleges</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{model.college.name}</span>
            </nav>
          ) : null}
          <div className="mht-college-mark">
            <CollegeIdentityMedia
              key={collegeCode}
              media={getMhtCetCollegeMedia(model.college.collegeId)}
              initial={initial}
              variant={variant}
            />
            <header className="mht-college-identity">
              <h1 className={serif}>{model.college.name}</h1>
              <p className="mht-college-meta">
                <span className="mht-college-code">
                  <span className="font-mono">{collegeCode}</span>
                  <CopyCollegeCode code={collegeCode} />
                </span>
                {model.college.status ? (
                  <span>{model.college.status}</span>
                ) : null}
                {model.college.homeUniversity ? (
                  <span>{model.college.homeUniversity}</span>
                ) : null}
              </p>
            </header>
          </div>
          <section
            id="cutoffs"
            className={card}
            aria-labelledby="mht-cutoffs-title"
          >
            <div id="programs" className="mht-college-section" />
            <div className="space-y-4 p-5">
              <h2
                id="mht-cutoffs-title"
                className={`${serif} text-xl text-zinc-800`}
              >
                {model.selectedYear} Round {model.selectedRound} cutoffs
              </h2>
              <CutoffObservations
                observations={model.observations}
                system="mht-cet"
                collegeHomeUniversityId={model.college.homeUniversityId}
                yearRound={
                  <AdmissionsFilters
                    key="year-round"
                    year={model.selectedYear}
                    round={model.selectedRound}
                    years={model.availableYears}
                  />
                }
              />
              {model.observations.length > 100 ? (
                <Link
                  href={withNeutralAdmissionsQuery("/mht-cet/state-cutoffs", {
                    year: model.selectedYear,
                    round: model.selectedRound,
                    search: model.college.collegeId,
                  })}
                  className="inline-flex text-sm text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
                >
                  Search all rows in the state cutoff explorer
                </Link>
              ) : null}
            </div>
          </section>

          {model.coverageNotes.length > 0 || sectionItems.length > 0 ? (
            <div>
              {model.coverageNotes.map((note) => (
                <p key={note} className="mt-1 text-sm text-zinc-500">
                  {note}
                </p>
              ))}
              <nav
                aria-label="On this page"
                className="mt-3 flex flex-wrap gap-x-4 gap-y-1"
              >
                {sectionItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="text-sm text-zinc-600 underline-offset-2 hover:text-zinc-950 hover:underline"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          ) : null}

          <AdmissionsFitGate
            system="mht-cet"
            year={model.selectedYear}
            round={model.selectedRound}
            collegeId={model.college.collegeId}
          />

          {model.seatMatrix.length > 0 ? (
            <section
              id="seats"
              className={card}
              aria-labelledby="mht-seats-title"
            >
              <div className="space-y-4 p-5">
                <div>
                  <h2
                    id="mht-seats-title"
                    className={`${serif} text-xl text-zinc-800`}
                  >
                    2024 seat matrix
                  </h2>
                  <p className="mt-2 text-sm text-zinc-500">
                    Seat counts below are from 2024 and are not the{" "}
                    {model.selectedYear} intake.
                  </p>
                </div>
                <div className="grid gap-3">
                  {model.seatMatrix.map((row) => (
                    <article
                      key={row.id}
                      className="rounded-lg border border-zinc-200/50 bg-white/60 p-4"
                    >
                      <h3 className="text-sm font-medium text-zinc-800">
                        {row.course_name}
                      </h3>
                      <p className="mt-1 font-mono text-xs text-zinc-500">
                        {row.choice_code}
                      </p>
                      <p className="mt-2 text-sm text-zinc-600">
                        {row.SI || row.Total || "—"} seats ·{" "}
                        {row.seat_type || "Seat type not listed"}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          <ProvenanceCard provenance={model.provenance} />
        </div>
      </div>
    </>
  );
}
