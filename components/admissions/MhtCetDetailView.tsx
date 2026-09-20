import Link from "next/link";
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
      options: model.availableYears.map((year) => ({
        value: String(year),
        label: String(year),
      })),
    },
    {
      name: "round",
      label: "Round",
      value: String(model.selectedRound),
      options: (ROUNDS_BY_YEAR[model.selectedYear] || model.availableRounds).map(
        (round) => ({
          value: String(round),
          label: `Round ${round}`,
        }),
      ),
    },
  ];
  const totalSeats = model.seatMatrix.reduce(
    (sum, row) => sum + (row.SI || row.Total || 0),
    0,
  );

  return (
    <>
      <AdmissionsJsonLd
        kind="college"
        name={model.college.name}
        canonicalPath={model.canonicalPath}
        location={{ region: "Maharashtra" }}
        system="MHT-CET"
      />
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
            <span>College {model.college.collegeId.padStart(5, "0")}</span>
            {model.college.status ? <span>{model.college.status}</span> : null}
          </>
        }
        facts={
          <AdmissionsFacts
            facts={[
              { label: "Latest cutoff evidence", value: "2026 · Round 1" },
              {
                label: `Programs in ${model.selectedYear} R${model.selectedRound}`,
                value: model.programs.length,
              },
              {
                label: "Seat matrix",
                value:
                  model.seatMatrix.length > 0
                    ? `${totalSeats.toLocaleString("en-IN")} seats · 2024`
                    : "2024 data unavailable",
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

        <section id="cutoffs" className="cutoff-table-section" aria-labelledby="mht-cutoffs-title">
          <div className="cutoff-section-heading">
            <div>
              <h2 id="mht-cutoffs-title">
                {model.selectedYear} Round {model.selectedRound} cutoff explorer
              </h2>
              <p>
                Percentile and last-rank values are shown together exactly as imported from the
                counselling source.
              </p>
            </div>
          </div>
          <AdmissionsFilters fields={filters} />
          <div className="mt-5">
            <CutoffObservations observations={model.observations} system="mht-cet" />
            {model.observations.length > 100 && (
              <Link
                href={withNeutralAdmissionsQuery("/mht-cet/state-cutoffs", {
                  year: model.selectedYear,
                  round: model.selectedRound,
                  search: model.college.collegeId,
                })}
                className="cutoff-inline-link"
              >
                Search all rows in the state cutoff explorer
              </Link>
            )}
          </div>
        </section>

        <section id="programs" className="cutoff-section" aria-labelledby="mht-programs-title">
          <div className="cutoff-section-heading">
            <div>
              <h2 id="mht-programs-title">Programs with cutoff observations</h2>
              <p>{model.programs.length} programs in this year and round.</p>
            </div>
          </div>
          <div className="cutoff-program-list">
            {model.programs.map((program) => (
              <div key={program.id}>
                <strong>{program.name}</strong>
                <span>{program.code}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="seats" className="cutoff-section" aria-labelledby="mht-seats-title">
          <div className="cutoff-section-heading">
            <div>
              <h2 id="mht-seats-title">2024 seat matrix</h2>
              <p>
                Seat counts below are explicitly from 2024 and must not be assumed to represent the{" "}
                {model.selectedYear} intake.
              </p>
            </div>
          </div>
          {model.seatMatrix.length === 0 ? (
            <p className="cutoff-empty">
              No verified 2024 seat matrix rows are available for this college.
            </p>
          ) : (
            <div className="cutoff-program-list">
              {model.seatMatrix.map((row) => (
                <article key={row.id}>
                  <strong>{row.course_name}</strong>
                  <span>
                    {row.choice_code} · {row.SI || row.Total || "—"} seats ·{" "}
                    {row.seat_type || "Not listed"}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>

        <ProvenanceCard provenance={model.provenance} />
      </AdmissionsShell>
    </>
  );
}
