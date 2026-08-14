import Link from "next/link";
import { Building2, GraduationCap } from "lucide-react";
import AdmissionsFitGate from "@/components/admissions/AdmissionsFitGate";
import AdmissionsFilters from "@/components/admissions/AdmissionsFilters";
import AdmissionsJsonLd from "@/components/admissions/AdmissionsJsonLd";
import AdmissionsShell, {
  AdmissionsFacts,
  AdmissionsSectionNav,
} from "@/components/admissions/AdmissionsShell";
import CutoffObservations from "@/components/admissions/CutoffObservations";
import ProvenanceCard from "@/components/admissions/ProvenanceCard";
import type { MhtCetCollegeDetailModel } from "@/lib/admissions/types";
import { withNeutralAdmissionsQuery } from "@/lib/admissions/query-state";
import { ROUNDS_BY_YEAR } from "@/lib/mht-cet/state-cutoffs/config";

export default function MhtCetDetailView({
  model,
  variant = "full",
}: {
  model: MhtCetCollegeDetailModel;
  variant?: "full" | "sheet";
}) {
  const sectionItems = [
    { href: "#fit", label: "Historical fit" },
    { href: "#cutoffs", label: "Cutoff explorer" },
    { href: "#programs", label: "Programs" },
    { href: "#seats", label: "2024 seat matrix" },
    { href: "#source", label: "Source and method" },
  ];
  const filters = [
    {
      name: "year",
      label: "Year",
      value: String(model.selectedYear),
      options: model.availableYears.map((year) => ({ value: String(year), label: String(year) })),
    },
    {
      name: "round",
      label: "Round",
      value: String(model.selectedRound),
      options: (ROUNDS_BY_YEAR[model.selectedYear] || model.availableRounds).map((round) => ({
        value: String(round),
        label: `Round ${round}`,
      })),
    },
  ];
  const totalSeats = model.seatMatrix.reduce(
    (sum, row) => sum + (row.SI || row.Total || 0),
    0,
  );

  return (
    <>
      {variant === "full" && (
        <AdmissionsJsonLd
          kind="college"
          name={model.college.name}
          canonicalPath={model.canonicalPath}
          location={{ region: "Maharashtra" }}
          system="MHT-CET"
        />
      )}
      <AdmissionsShell
        variant={variant}
        systemLabel="MHT-CET admissions"
        title={model.college.name}
        subtitle={model.college.homeUniversity}
        canonicalPath={model.canonicalPath}
        backPath="/mht-cet/colleges"
        backLabel="All colleges"
        status={model.status}
        badges={
          <>
            <span className="bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
              College {model.college.collegeId.padStart(5, "0")}
            </span>
            {model.college.status && (
              <span className="bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {model.college.status}
              </span>
            )}
          </>
        }
        facts={
          <AdmissionsFacts
            facts={[
              { label: "Latest cutoff evidence", value: "2026 · Round 1" },
              { label: `Programs in ${model.selectedYear} R${model.selectedRound}`, value: model.programs.length },
              {
                label: "Seat matrix",
                value: model.seatMatrix.length > 0 ? `${totalSeats.toLocaleString("en-IN")} seats · 2024` : "2024 data unavailable",
              },
            ]}
          />
        }
        aside={<AdmissionsSectionNav items={sectionItems} />}
      >
        <AdmissionsFitGate
          system="mht-cet"
          year={model.selectedYear}
          round={model.selectedRound}
          collegeId={model.college.collegeId}
        />

        <section id="cutoffs" className="admissions-panel p-5 sm:p-6" aria-labelledby="mht-cutoffs-title">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-violet-700">Official observations</p>
            <h2 id="mht-cutoffs-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              {model.selectedYear} Round {model.selectedRound} cutoff explorer
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Percentile and last-rank values are shown together exactly as imported from the counselling source.
            </p>
          </div>
          {variant === "full" && (
            <div className="mt-5 border-y border-slate-200 bg-slate-50 py-4">
              <AdmissionsFilters fields={filters} />
            </div>
          )}
          <div className="mt-5">
            <CutoffObservations
              observations={model.observations}
              system="mht-cet"
              limit={variant === "sheet" ? 10 : undefined}
            />
            {variant === "full" && model.observations.length > 100 && (
              <Link
                href={withNeutralAdmissionsQuery("/mht-cet/state-cutoffs", {
                  year: model.selectedYear,
                  round: model.selectedRound,
                  search: model.college.collegeId,
                })}
                className="mt-4 inline-flex min-h-11 items-center border border-slate-300 bg-white px-4 text-sm font-semibold text-violet-700 hover:border-violet-400 hover:bg-violet-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
              >
                Search all rows in the state cutoff explorer
              </Link>
            )}
          </div>
        </section>

        <section id="programs" className="admissions-panel p-5 sm:p-6" aria-labelledby="mht-programs-title">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-violet-100 text-violet-800">
              <GraduationCap aria-hidden="true" className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-violet-700">Programs</p>
              <h2 id="mht-programs-title" className="text-2xl font-bold tracking-tight text-slate-950">
                Programs with cutoff observations
              </h2>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {model.programs.slice(0, variant === "sheet" ? 8 : 100).map((program) => (
              <div key={program.id} className="border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold leading-5 text-slate-950">{program.name}</p>
                <p className="mt-1 font-mono text-xs text-slate-500">{program.code}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="seats" className="admissions-panel p-5 sm:p-6" aria-labelledby="mht-seats-title">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-amber-100 text-amber-900">
              <Building2 aria-hidden="true" className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-amber-800">Older reference data</p>
              <h2 id="mht-seats-title" className="text-2xl font-bold tracking-tight text-slate-950">
                2024 seat matrix
              </h2>
            </div>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Seat counts below are explicitly from 2024 and must not be assumed to represent the {model.selectedYear} intake.
          </p>
          {model.seatMatrix.length === 0 ? (
            <div className="mt-5 border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
              No verified 2024 seat matrix rows are available for this college.
            </div>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {model.seatMatrix.slice(0, variant === "sheet" ? 6 : 100).map((row) => (
                <article key={row.id} className="border border-slate-200 p-4">
                  <p className="font-semibold leading-5 text-slate-950">{row.course_name}</p>
                  <p className="mt-1 font-mono text-xs text-slate-500">{row.choice_code}</p>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sanctioned intake</dt>
                      <dd className="mt-1 text-lg font-bold tabular-nums text-slate-950">{row.SI || row.Total || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Seat type</dt>
                      <dd className="mt-1 font-semibold text-slate-900">{row.seat_type || "Not listed"}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}
          {variant === "full" && model.seatMatrix.length > 100 && (
            <p className="mt-3 text-sm text-slate-500">
              Showing 100 of {model.seatMatrix.length} verified 2024 seat rows.
            </p>
          )}
        </section>

        <ProvenanceCard provenance={model.provenance} />
      </AdmissionsShell>
    </>
  );
}
