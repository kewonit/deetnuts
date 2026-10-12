import Link from "next/link";
import AdmissionsFitGate from "@/components/admissions/AdmissionsFitGate";
import AdmissionsFilters from "@/components/admissions/AdmissionsFilters";
import AdmissionsJsonLd from "@/components/admissions/AdmissionsJsonLd";
import { ShareAdmissionsPage } from "@/components/admissions/AdmissionsActions";
import CopyCollegeCode from "@/components/admissions/CopyCollegeCode";
import CollegeIdentityMedia from "@/components/admissions/CollegeIdentityMedia";
import CutoffObservations from "@/components/admissions/CutoffObservations";
import { MhtFooter } from "@/components/admissions/MhtFooter";
import ProvenanceCard from "@/components/admissions/ProvenanceCard";
import type { MhtCetCollegeDetailModel } from "@/lib/admissions/types";
import type { MhtCetPeerCollege } from "@/lib/admissions/mht-cet-peers";
import { withNeutralAdmissionsQuery } from "@/lib/admissions/query-state";
import { getMhtCetCollegeMedia } from "@/lib/admissions/college-media";
import {
  formatPercentile,
  homeUniversityLabel,
  summarizeMhtCetCollege,
} from "@/lib/admissions/mht-cet-college-summary";
import "./mht-college.css";

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export default function MhtCetDetailView({
  model,
  variant = "full",
  peers = [],
}: {
  model: MhtCetCollegeDetailModel;
  variant?: "full" | "sheet";
  peers?: MhtCetPeerCollege[];
}) {
  const full = variant === "full";
  const { college } = model;
  const collegeCode = college.collegeId.padStart(5, "0");
  const initial = college.name.trim().charAt(0).toUpperCase() || "—";
  const period = `${model.selectedYear} Round ${model.selectedRound}`;
  const summary = summarizeMhtCetCollege(model);
  const { top, bottom } = summary;
  const homeUniversity = homeUniversityLabel(college);
  const explorerHref = withNeutralAdmissionsQuery("/mht-cet/state-cutoffs", {
    year: model.selectedYear,
    round: model.selectedRound,
    search: college.collegeId,
  });

  return (
    <>
      <AdmissionsJsonLd
        kind="college"
        name={college.name}
        canonicalPath={model.canonicalPath}
        location={{ region: "Maharashtra" }}
        system="MHT-CET"
      />
      <div className={full ? "mht-college" : "mht-college mht-college-in-sheet"}>
        {full ? (
          <nav aria-label="Breadcrumb" className="mht-crumbs mht-page">
            <Link href="/mht-cet">MHT-CET</Link>
            <span aria-hidden="true">/</span>
            <Link href="/mht-cet/colleges">Colleges</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{college.name}</span>
          </nav>
        ) : null}

        <div className="mht-college-mark mht-page">
          <CollegeIdentityMedia
            key={collegeCode}
            media={getMhtCetCollegeMedia(college.collegeId)}
            initial={initial}
            variant={variant}
          />
          <div className="mht-hero-actions">
            {full ? (
              <a className="mht-btn mht-btn-primary" href="#score">
                Compare my score
              </a>
            ) : (
              <Link className="mht-btn mht-btn-primary" href={model.canonicalPath}>
                Open full page
              </Link>
            )}
            <ShareAdmissionsPage className="mht-btn" compact={!full} />
          </div>
          <header className="mht-college-identity">
            <h1>{college.name}</h1>
            <p className="mht-college-meta">
              <span className="mht-chip mht-chip-code mht-college-code">
                <span>{collegeCode}</span>
                <CopyCollegeCode code={collegeCode} />
              </span>
              {college.status ? <span className="mht-chip">{college.status}</span> : null}
              {homeUniversity ? <span className="mht-chip">{homeUniversity}</span> : null}
            </p>
          </header>
          {top ? (
            <dl className="mht-stats">
              <div>
                <dt>Highest cutoff</dt>
                <dd>
                  <strong>{formatPercentile(top.percentile)}</strong>
                  <a href={`#${top.anchor}`}>{top.name}</a>
                </dd>
              </div>
              {bottom ? (
                <div>
                  <dt>Lowest cutoff</dt>
                  <dd>
                    <strong>{formatPercentile(bottom.percentile)}</strong>
                    <a href={`#${bottom.anchor}`}>{bottom.name}</a>
                  </dd>
                </div>
              ) : null}
              <div>
                <dt>Programs</dt>
                <dd>
                  <strong>{summary.programCount}</strong>
                  <span>{plural(summary.seatPoolCount, "seat pool")}</span>
                </dd>
              </div>
              <div>
                <dt>Admission</dt>
                <dd>
                  <strong>{summary.homeSplit ? "Home university split" : "One statewide list"}</strong>
                </dd>
              </div>
            </dl>
          ) : null}
        </div>

        <section id="cutoffs" className="mht-section mht-cutoffs mht-college-section" aria-labelledby="mht-cutoffs-title">
          <div id="programs" className="mht-college-section" />
          <div className="mht-page mht-page-wide">
            <div className="mht-section-head">
              <h2 id="mht-cutoffs-title">Cutoffs</h2>
              <AdmissionsFilters
                year={model.selectedYear}
                round={model.selectedRound}
                years={model.availableYears}
              />
            </div>
            <div className="mht-card mht-explorer-card">
              <CutoffObservations
                observations={model.observations}
                period={period}
                anchorId={full ? "score" : undefined}
                collegeHomeUniversityId={college.homeUniversityId}
                footer={
                  <div key="footer" className="mht-card-foot">
                    <span>Open a program for every seat pool and its choice code.</span>
                    <Link className="mht-link" href={explorerHref}>
                      Search every row in the state explorer
                    </Link>
                  </div>
                }
              />
            </div>
          </div>
        </section>

        <AdmissionsFitGate
          system="mht-cet"
          year={model.selectedYear}
          round={model.selectedRound}
          collegeId={college.collegeId}
        />

        {model.seatMatrix.length > 0 ? (
          <section id="seats" className="mht-section mht-college-section" aria-labelledby="mht-seats-title">
            <div className="mht-page">
              <div className="mht-section-head">
                <div>
                  <h2 id="mht-seats-title">2024 seat matrix</h2>
                  <p>Not the {model.selectedYear} intake.</p>
                </div>
              </div>
              <div className="mht-card">
                <table className="mht-table">
                  <thead>
                    <tr>
                      <th scope="col">Program</th>
                      <th scope="col">Seat type</th>
                      <th scope="col" className="mht-num">Seats</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.seatMatrix.map((row) => (
                      <tr key={row.id}>
                        <th scope="row">
                          {row.course_name}
                          <small>{row.choice_code}</small>
                        </th>
                        <td>{row.seat_type || "Not listed"}</td>
                        <td className="mht-num">{row.SI || row.Total || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : null}

        <div className="mht-page">
          {full && peers.length > 0 ? (
            <section id="similar" className="mht-section mht-college-section" aria-labelledby="mht-similar-title">
              <div className="mht-section-head">
                <div>
                  <h2 id="mht-similar-title">Similar colleges</h2>
                  <p>Closest top Open General cutoffs this year.</p>
                </div>
              </div>
              <div className="mht-card">
                <ul className="mht-peers">
                  {peers.map((peer) => (
                    <li key={peer.collegeId}>
                      <a href={peer.path}>
                        <span>
                          <strong>{peer.name}</strong>
                          <small>{peer.program}</small>
                        </span>
                        <span className="mht-chip">{formatPercentile(peer.percentile)}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}
          <ProvenanceCard provenance={model.provenance} coverageNotes={model.coverageNotes} />
        </div>

        {full ? <MhtFooter /> : null}
      </div>
    </>
  );
}
