"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, CircleAlert, Eraser, LockKeyhole, Save } from "lucide-react";
import {
  MhtCetAdmissionsProfileSchema,
  type AdmissionsStoredProfile,
} from "@/lib/admissions/profile";
import {
  encodeAdmissionsProfileFragment,
  getAdmissionsProfileStorageKey,
  resolveAdmissionsProfileSources,
  setProfileFragmentInUrl,
} from "@/lib/admissions/profile-codec";
import type { FitResponseV1 } from "@/lib/admissions/types";
import FitSection from "@/components/admissions/FitSection";
import {
  MHT_CET_CANDIDATURE_OPTIONS,
  MHT_CET_CATEGORY_OPTIONS,
  MHT_CET_HOME_UNIVERSITIES,
  MHT_CET_MINORITY_OPTIONS,
  type MhtCetCandidateProfile,
} from "@/lib/mht-cet/state-cutoffs/candidate-profile";

export type AdmissionsFitPanelProps = {
  system: "mht-cet";
  year: number;
  round: number;
  collegeId: string;
};

type MhtCetCandidateForm = Omit<
  MhtCetCandidateProfile,
  "candidatureType" | "homeUniversityId"
> & {
  candidatureType: MhtCetCandidateProfile["candidatureType"] | "";
  homeUniversityId?: MhtCetCandidateProfile["homeUniversityId"] | "";
};

const DEFAULT_MHT_CANDIDATE: MhtCetCandidateForm = {
  candidatureType: "",
  homeUniversityId: "",
  categoryId: "open",
  ladiesSeatEligible: false,
  eligibilities: {
    ewsCertificate: false,
    tfwsEligible: false,
    pwd: false,
    orphanCertificate: false,
  },
};

function persistProfile(value: AdmissionsStoredProfile) {
  window.localStorage.setItem(
    getAdmissionsProfileStorageKey(value.system),
    JSON.stringify(value),
  );
  const fragment = encodeAdmissionsProfileFragment(value);
  const nextUrl = setProfileFragmentInUrl(new URL(window.location.href), fragment);
  window.history.replaceState(window.history.state, "", nextUrl);
}

function formatMargin(value: number, metric: "rank" | "percentile") {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: metric === "rank" ? 0 : 4,
  }).format(Math.abs(value));
}

function Field({
  label,
  className,
  children,
}: {
  label: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className ? `mht-field ${className}` : "mht-field"}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function CheckboxField({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="mht-check">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {children}
    </label>
  );
}

function marginText(observation: { outcome: "cleared" | "missed"; margin: number; metric: "rank" | "percentile" }) {
  return `${observation.outcome === "cleared" ? "Cleared by" : "Missed by"} ${formatMargin(observation.margin, observation.metric)} ${observation.metric === "rank" ? "ranks" : "percentile points"}`;
}

export default function AdmissionsFitPanel(props: AdmissionsFitPanelProps) {
  const [loaded, setLoaded] = useState(false);
  const [savedSource, setSavedSource] = useState<"link" | "device" | null>(null);
  const [mhtScoreMode, setMhtScoreMode] = useState<"rank" | "percentile">("percentile");
  const [mhtScore, setMhtScore] = useState("");
  const [mhtCandidate, setMhtCandidate] = useState<MhtCetCandidateForm>(
    DEFAULT_MHT_CANDIDATE,
  );
  const [error, setError] = useState<string | null>(null);
  const [requestBody, setRequestBody] = useState<unknown>(null);
  const [result, setResult] = useState<FitResponseV1 | null>(null);
  const [loading, setLoading] = useState(false);
  const requestSequence = useRef(0);

  useEffect(() => {
    const resolved = resolveAdmissionsProfileSources(
      window.location.hash,
      window.localStorage.getItem(getAdmissionsProfileStorageKey(props.system)),
      props.system,
    );
    const stored = resolved?.profile;
    if (stored) {
      setMhtScoreMode(stored.profile.scoreMode);
      setMhtScore(String(stored.profile.score));
      setMhtCandidate(stored.profile.candidate);
      setSavedSource(resolved?.source || null);
    }
    setLoaded(true);
  }, [props.system]);

  useEffect(() => {
    if (!requestBody) return;
    const sequence = ++requestSequence.current;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/admissions/fit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to compare cutoffs");
        if (sequence === requestSequence.current) setResult(payload as FitResponseV1);
      } catch (requestError) {
        if ((requestError as Error).name !== "AbortError" && sequence === requestSequence.current) {
          setResult(null);
          setError((requestError as Error).message);
        }
      } finally {
        if (sequence === requestSequence.current) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [requestBody]);

  function clearProfile() {
    window.localStorage.removeItem(getAdmissionsProfileStorageKey(props.system));
    const nextUrl = setProfileFragmentInUrl(new URL(window.location.href), null);
    window.history.replaceState(window.history.state, "", nextUrl);
    setSavedSource(null);
    setRequestBody(null);
    setResult(null);
    setError(null);
    setMhtScore("");
    setMhtScoreMode("percentile");
    setMhtCandidate(DEFAULT_MHT_CANDIDATE);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const profileResult = MhtCetAdmissionsProfileSchema.safeParse({
      scoreMode: mhtScoreMode,
      score: Number(mhtScore),
      candidate: mhtCandidate,
    });
    if (!profileResult.success) {
      setError(profileResult.error.issues[0]?.message || "Check the MHT-CET profile fields.");
      return;
    }
    const stored: AdmissionsStoredProfile = {
      version: 1,
      system: "mht-cet",
      profile: profileResult.data,
    };
    persistProfile(stored);
    setSavedSource("device");
    setRequestBody({
      version: 1,
      system: "mht-cet",
      entity: { kind: "college", id: props.collegeId },
      year: props.year,
      round: props.round,
      profile: profileResult.data,
    });
  }

  const best = result?.observations[0];

  return (
    <FitSection>
      <div className="mht-card mht-card-body admissions-panel">
        <form onSubmit={submit} className="mht-form">
          <div className="mht-fields">
            <Field label="Score type">
              <select
                value={mhtScoreMode}
                onChange={(event) => setMhtScoreMode(event.target.value as "rank" | "percentile")}
                className="mht-input"
              >
                <option value="percentile">MHT-CET percentile</option>
                <option value="rank">State merit rank</option>
              </select>
            </Field>
            <Field label={mhtScoreMode === "rank" ? "State merit rank" : "Percentile"}>
              <input
                type="number"
                inputMode="decimal"
                min={mhtScoreMode === "rank" ? 1 : 0}
                max={mhtScoreMode === "rank" ? 1_000_000 : 100}
                step={mhtScoreMode === "rank" ? 1 : "any"}
                value={mhtScore}
                onChange={(event) => setMhtScore(event.target.value)}
                placeholder={mhtScoreMode === "rank" ? "e.g. 4500" : "e.g. 97.85"}
                className="mht-input"
                required
              />
            </Field>
            <Field label="Candidature type">
              <select
                value={mhtCandidate.candidatureType}
                onChange={(event) => {
                  const candidatureType = event.target.value as MhtCetCandidateForm["candidatureType"];
                  setMhtCandidate((candidate) => ({
                    ...candidate,
                    candidatureType,
                    homeUniversityId:
                      !candidatureType || candidatureType === "type-e"
                        ? undefined
                        : candidate.homeUniversityId,
                    eligibilities:
                      candidatureType === "type-a" || candidatureType === "type-b"
                        ? candidate.eligibilities
                        : {
                            ...candidate.eligibilities,
                            pwd:
                              candidatureType === "type-e"
                                ? false
                                : candidate.eligibilities.pwd,
                            minorityCommunityId: undefined,
                          },
                  }));
                }}
                className="mht-input"
                required
              >
                <option value="">Choose candidature type</option>
                {MHT_CET_CANDIDATURE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label} — {option.description}</option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <select
                value={mhtCandidate.categoryId}
                onChange={(event) => {
                  const categoryId = event.target.value as MhtCetCandidateProfile["categoryId"];
                  setMhtCandidate((candidate) => ({
                    ...candidate,
                    categoryId,
                    eligibilities: {
                      ...candidate.eligibilities,
                      ewsCertificate:
                        categoryId === "open" && candidate.eligibilities.ewsCertificate,
                    },
                  }));
                }}
                className="mht-input"
              >
                {MHT_CET_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </Field>
            {mhtCandidate.candidatureType && mhtCandidate.candidatureType !== "type-e" && (
              <Field label="Home university">
                <select
                  value={mhtCandidate.homeUniversityId || ""}
                  onChange={(event) => setMhtCandidate((candidate) => ({
                    ...candidate,
                    homeUniversityId: event.target.value as MhtCetCandidateProfile["homeUniversityId"],
                  }))}
                  className="mht-input"
                  required
                >
                  <option value="">Choose home university</option>
                  {MHT_CET_HOME_UNIVERSITIES.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Minority community (if applicable)">
              <select
                value={mhtCandidate.eligibilities.minorityCommunityId || "none"}
                onChange={(event) => setMhtCandidate((candidate) => ({
                  ...candidate,
                  eligibilities: {
                    ...candidate.eligibilities,
                    minorityCommunityId:
                      event.target.value === "none"
                        ? undefined
                        : event.target.value as MhtCetCandidateProfile["eligibilities"]["minorityCommunityId"],
                  },
                }))}
                className="mht-input"
              >
                <option value="none">None</option>
                {MHT_CET_MINORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mht-checks">
            <CheckboxField
              checked={mhtCandidate.ladiesSeatEligible}
              onChange={(checked) => setMhtCandidate((candidate) => ({ ...candidate, ladiesSeatEligible: checked }))}
            >
              Ladies seat pools
            </CheckboxField>
            <CheckboxField
              checked={mhtCandidate.eligibilities.ewsCertificate}
              onChange={(checked) => setMhtCandidate((candidate) => ({
                ...candidate,
                eligibilities: { ...candidate.eligibilities, ewsCertificate: checked },
              }))}
            >
              EWS certificate
            </CheckboxField>
            <CheckboxField
              checked={mhtCandidate.eligibilities.tfwsEligible}
              onChange={(checked) => setMhtCandidate((candidate) => ({
                ...candidate,
                eligibilities: { ...candidate.eligibilities, tfwsEligible: checked },
              }))}
            >
              TFWS eligible
            </CheckboxField>
            <CheckboxField
              checked={mhtCandidate.eligibilities.pwd}
              onChange={(checked) => setMhtCandidate((candidate) => ({
                ...candidate,
                eligibilities: { ...candidate.eligibilities, pwd: checked },
              }))}
            >
              PwD reservation
            </CheckboxField>
            <CheckboxField
              checked={mhtCandidate.eligibilities.orphanCertificate}
              onChange={(checked) => setMhtCandidate((candidate) => ({
                ...candidate,
                eligibilities: { ...candidate.eligibilities, orphanCertificate: checked },
              }))}
            >
              Orphan certificate
            </CheckboxField>
          </div>

          <div className="mht-form-foot">
            <div className="mht-privacy">
              <LockKeyhole aria-hidden="true" />
              <p>
                {savedSource === "link" ? "Loaded from the link. " : ""}
                Saved on this device and in the link. Sent to our server only to check.
              </p>
            </div>
            <div className="mht-cta" style={{ marginTop: 0 }}>
              {loaded && savedSource && (
                <button type="button" onClick={clearProfile} className="mht-btn">
                  <Eraser aria-hidden="true" />
                  Clear
                </button>
              )}
              <button type="submit" disabled={loading} className="mht-btn mht-btn-primary">
                <Save aria-hidden="true" />
                {loading ? "Checking…" : "Save and check"}
              </button>
            </div>
          </div>
        </form>

        <div aria-live="polite" aria-busy={loading}>
          {error && (
            <div role="alert" className="mht-alert" style={{ marginTop: "1.25rem" }}>
              <CircleAlert aria-hidden="true" />
              <p>{error}</p>
            </div>
          )}
          {result?.status === "no-comparable-data" && (
            <div className="mht-result" style={{ marginTop: "1.25rem" }}>
              <p className="mht-result-meta">
                No published cutoff for this seat in {props.year} Round {props.round}.
              </p>
            </div>
          )}
          {best && (
            <div className="mht-result" data-outcome={best.outcome} style={{ marginTop: "1.25rem" }}>
              <div className="mht-result-head">
                {best.outcome === "cleared" ? (
                  <CheckCircle2 aria-hidden="true" />
                ) : (
                  <CircleAlert aria-hidden="true" />
                )}
                <div>
                  <p className="mht-result-kicker">Best observed margin</p>
                  <p className="mht-result-title">
                    {best.outcome === "cleared" ? "Cleared" : "Missed"} {best.year} Round {best.round} closing {best.metric === "rank" ? "rank" : "percentile"} by {formatMargin(best.margin, best.metric)} {best.metric === "rank" ? "ranks" : "percentile points"}
                  </p>
                  <p className="mht-result-meta">
                    {best.programName} · {best.seatPool}
                  </p>
                </div>
              </div>
              {result.history && (
                <p className="mht-result-history">
                  Would have cleared {result.history.clearedYears} of {result.history.comparableYears} comparable years.
                </p>
              )}
              <details>
                <summary>
                  View all {result.observations.length} exact {result.observations.length === 1 ? "result" : "results"}
                </summary>
                <ul className="mht-result-list">
                  {result.observations.map((observation) => (
                    <li key={observation.id}>
                      <span>{observation.programName}</span>
                      <span>{observation.seatPool}</span>
                      <span>{marginText(observation)}</span>
                    </li>
                  ))}
                </ul>
                {result.status === "partial" && (
                  <p className="mht-note">
                    Showing the first 200 results.
                  </p>
                )}
              </details>
            </div>
          )}
        </div>
      </div>
    </FitSection>
  );
}
