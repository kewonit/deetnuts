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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-sm font-semibold text-slate-700">{children}</span>;
}

const fieldClass =
  "min-h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700";

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
    <label className="flex min-h-11 cursor-pointer items-center gap-3 border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-violet-700"
      />
      {children}
    </label>
  );
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
    <section id="fit" className="admissions-panel p-5 sm:p-6" aria-labelledby="fit-title">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-violet-700">Historical fit</p>
          <h2 id="fit-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
            Compare your exact seat pool
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            This compares official closing cutoffs only and rejects incompatible rank types.
          </p>
        </div>
        {loaded && savedSource && (
          <button
            type="button"
            onClick={clearProfile}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
          >
            <Eraser aria-hidden="true" className="h-4 w-4" />
            Clear profile
          </button>
        )}
      </div>

      <form onSubmit={submit} className="mt-5 space-y-5">
        <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label>
                <FieldLabel>Score type</FieldLabel>
                <select
                  value={mhtScoreMode}
                  onChange={(event) => setMhtScoreMode(event.target.value as "rank" | "percentile")}
                  className={fieldClass}
                >
                  <option value="percentile">MHT-CET percentile</option>
                  <option value="rank">State merit rank</option>
                </select>
              </label>
              <label>
                <FieldLabel>{mhtScoreMode === "rank" ? "State merit rank" : "Percentile"}</FieldLabel>
                <input
                  type="number"
                  min={mhtScoreMode === "rank" ? 1 : 0}
                  max={mhtScoreMode === "rank" ? 1_000_000 : 100}
                  step={mhtScoreMode === "rank" ? 1 : "any"}
                  value={mhtScore}
                  onChange={(event) => setMhtScore(event.target.value)}
                  className={fieldClass}
                  required
                />
              </label>
              <label>
                <FieldLabel>Candidature type</FieldLabel>
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
                  className={fieldClass}
                  required
                >
                  <option value="">Choose candidature type</option>
                  {MHT_CET_CANDIDATURE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label} — {option.description}</option>
                  ))}
                </select>
              </label>
              {mhtCandidate.candidatureType && mhtCandidate.candidatureType !== "type-e" && (
                <label className="sm:col-span-2">
                  <FieldLabel>Home university</FieldLabel>
                  <select
                    value={mhtCandidate.homeUniversityId || ""}
                    onChange={(event) => setMhtCandidate((candidate) => ({
                      ...candidate,
                      homeUniversityId: event.target.value as MhtCetCandidateProfile["homeUniversityId"],
                    }))}
                    className={fieldClass}
                    required
                  >
                    <option value="">Choose home university</option>
                    {MHT_CET_HOME_UNIVERSITIES.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                <FieldLabel>Category</FieldLabel>
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
                  className={fieldClass}
                >
                  {MHT_CET_CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <FieldLabel>Minority community (if applicable)</FieldLabel>
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
                  className={fieldClass}
                >
                  <option value="none">None</option>
                  {MHT_CET_MINORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <CheckboxField
                checked={mhtCandidate.ladiesSeatEligible}
                onChange={(checked) => setMhtCandidate((candidate) => ({ ...candidate, ladiesSeatEligible: checked }))}
              >
                Include ladies seat pools
              </CheckboxField>
              <CheckboxField
                checked={mhtCandidate.eligibilities.ewsCertificate}
                onChange={(checked) => setMhtCandidate((candidate) => ({
                  ...candidate,
                  eligibilities: { ...candidate.eligibilities, ewsCertificate: checked },
                }))}
              >
                Valid EWS certificate
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
</>

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-xs leading-5 text-slate-500">
            <LockKeyhole aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {savedSource
                ? "Saved on this device and encoded in the URL fragment."
                : "When saved, this profile stays on this device and is encoded in the URL fragment."}{" "}
              The fragment is not part of the page request, but anyone you share the link with can read it. Submitted values are sent to the no-store comparison endpoint to calculate the result.
              {savedSource
                ? ` Loaded from ${savedSource === "link" ? "this link" : "this device"}.`
                : ""}
            </p>
            {savedSource && (
              <span className="shrink-0 bg-violet-100 px-2 py-1 font-semibold text-violet-900">
                Profile included when sharing
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 border border-violet-800 bg-violet-700 px-5 text-sm font-bold text-white hover:bg-violet-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 disabled:cursor-wait disabled:opacity-60"
          >
            <Save aria-hidden="true" className="h-4 w-4" />
            {loading ? "Checking…" : "Save and check cutoffs"}
          </button>
        </div>
      </form>

      <div className="mt-5" aria-live="polite" aria-busy={loading}>
        {error && (
          <div role="alert" className="flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-950">
            <CircleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
        {result?.status === "no-comparable-data" && (
          <div className="border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            No comparable official cutoff exists for this exact program and seat pool in {props.year} Round {props.round}.
          </div>
        )}
        {best && (
          <div className={`border p-5 ${best.outcome === "cleared" ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
            <div className="flex items-start gap-3">
              {best.outcome === "cleared" ? (
                <CheckCircle2 aria-hidden="true" className="mt-0.5 h-6 w-6 shrink-0 text-emerald-800" />
              ) : (
                <CircleAlert aria-hidden="true" className="mt-0.5 h-6 w-6 shrink-0 text-amber-800" />
              )}
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                  Best observed margin
                </p>
                <p className="text-lg font-bold text-slate-950">
                  {best.outcome === "cleared" ? "Cleared" : "Missed"} {best.year} Round {best.round} closing {best.metric === "rank" ? "rank" : "percentile"} by {formatMargin(best.margin, best.metric)} {best.metric === "rank" ? "ranks" : "percentile points"}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {best.programName} · {best.seatPool}
                </p>
              </div>
            </div>
            {result.history && (
              <p className="mt-4 border-t border-black/10 pt-4 text-sm font-semibold text-slate-800">
                The same exact criteria would have cleared {result.history.clearedYears} of {result.history.comparableYears} comparable years.
              </p>
            )}
            <details className="mt-4 border-t border-black/10 pt-4">
              <summary className="min-h-11 cursor-pointer py-3 text-sm font-bold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700">
                View all {result.observations.length} exact {result.observations.length === 1 ? "result" : "results"}
              </summary>
              <div className="mt-3 space-y-2 lg:hidden">
                {result.observations.map((observation) => (
                  <article key={observation.id} className="border border-black/10 bg-white/80 p-3 text-sm">
                    <p className="font-semibold text-slate-950">{observation.programName}</p>
                    <p className="mt-1 text-slate-600">{observation.seatPool}</p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {observation.outcome === "cleared" ? "Cleared by" : "Missed by"} {formatMargin(observation.margin, observation.metric)} {observation.metric === "rank" ? "ranks" : "percentile points"}
                    </p>
                  </article>
                ))}
              </div>
              <div
                className="mt-3 hidden max-h-[28rem] overflow-auto border border-black/10 lg:block"
                tabIndex={0}
                role="region"
                aria-label="Scrollable historical fit results"
              >
                <table className="w-full border-collapse bg-white/80 text-left text-sm">
                  <thead className="sticky top-0 bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-bold">Program</th>
                      <th scope="col" className="px-3 py-2 font-bold">Exact seat pool</th>
                      <th scope="col" className="px-3 py-2 font-bold">Observed result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {result.observations.map((observation) => (
                      <tr key={observation.id}>
                        <th scope="row" className="px-3 py-2 font-semibold text-slate-950">{observation.programName}</th>
                        <td className="px-3 py-2 text-slate-600">{observation.seatPool}</td>
                        <td className="px-3 py-2 font-semibold text-slate-900">
                          {observation.outcome === "cleared" ? "Cleared by" : "Missed by"} {formatMargin(observation.margin, observation.metric)} {observation.metric === "rank" ? "ranks" : "percentile points"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {result.status === "partial" && (
                <p className="mt-3 text-xs leading-5 text-slate-600">
                  The response reached its 200-row display limit. Narrow the college or program context before comparing again.
                </p>
              )}
            </details>
          </div>
        )}
      </div>
    </section>
  );
}
