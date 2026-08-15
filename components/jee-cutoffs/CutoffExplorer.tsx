"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import CutoffChart from "./CutoffChart";
import type {
  CutoffChartPoint,
  CutoffFilterOptions,
  CutoffSelection,
  CutoffServingRow,
  JeeExamId,
} from "@/lib/jee-cutoffs/types";

const bodyLabel = (body: CutoffSelection["body"]) => body === "josaa" ? "JoSAA" : "CSAB";
const genderLabel = (gender: string) => gender === "NA" ? "Not specified in source" : gender.replace("Female-only (including Supernumerary)", "Female-only");

type ApiPayload = {
  release: string;
  selection: CutoffSelection;
  filters: CutoffFilterOptions;
  rows: CutoffServingRow[];
  chart: CutoffChartPoint[];
  pagination: { total: number; nextCursor: string | null };
  error?: { message: string };
};

function hashSelection(selection: CutoffSelection) {
  const hash = new URLSearchParams({
    body: selection.body,
    round: String(selection.round),
    quota: selection.quota,
    seatType: selection.seatType,
    gender: selection.gender,
    offering: selection.offeringId,
  });
  return hash.toString();
}

export function CutoffExplorer(props: {
  release: string;
  exam: JeeExamId;
  college: string;
  year: number;
  profileRoutes: Array<{ path: string; offeringId: string; body: CutoffSelection["body"]; quota: string; seatType: string; gender: string }>;
  initialSelection: CutoffSelection;
  initialFilters: CutoffFilterOptions;
  initialRows: CutoffServingRow[];
  initialTotal: number;
  initialChart: CutoffChartPoint[];
}) {
  const [selection, setSelection] = useState(props.initialSelection);
  const [filters, setFilters] = useState(props.initialFilters);
  const [rows, setRows] = useState(props.initialRows);
  const [total, setTotal] = useState(props.initialTotal);
  const [chart, setChart] = useState(props.initialChart);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [isPending, startTransition] = useTransition();
  const initialized = useRef(false);
  const exactProfile = props.profileRoutes.find((route) => route.offeringId === selection.offeringId && route.body === selection.body && route.quota === selection.quota && route.seatType === selection.seatType && route.gender === selection.gender);

  async function load(
    next: Partial<CutoffSelection>,
    announceReset = false,
    cascadeFrom?: "body" | "round" | "seatType" | "gender" | "quota",
    historyMode: "push" | "replace" | "none" = "push",
  ) {
    const merged = { ...selection, ...next };
    const requested: Partial<CutoffSelection> = cascadeFrom === "body" ? { body: merged.body }
      : cascadeFrom === "round" ? { body: merged.body, round: merged.round }
      : cascadeFrom === "seatType" ? { body: merged.body, round: merged.round, seatType: merged.seatType }
      : cascadeFrom === "gender" ? { body: merged.body, round: merged.round, seatType: merged.seatType, gender: merged.gender }
      : cascadeFrom === "quota" ? { body: merged.body, round: merged.round, seatType: merged.seatType, gender: merged.gender, quota: merged.quota }
      : merged;
    const params = new URLSearchParams({ release: props.release, limit: "100" });
    if (requested.body !== undefined) params.set("body", requested.body);
    if (requested.round !== undefined) params.set("round", String(requested.round));
    if (requested.quota !== undefined) params.set("quota", requested.quota);
    if (requested.seatType !== undefined) params.set("seatType", requested.seatType);
    if (requested.gender !== undefined) params.set("gender", requested.gender);
    if (requested.offeringId !== undefined) params.set("offering", requested.offeringId);
    const controller = new AbortController();
    const previous = loadController.current;
    previous?.abort();
    loadController.current = controller;
    setError(null);
    try {
      const response = await fetch(`/api/jee-cutoffs/${props.exam}/${props.college}/${props.year}?${params}`, { signal: controller.signal });
      const payload = (await response.json()) as ApiPayload;
      if (response.status === 409) {
        window.location.reload();
        return;
      }
      if (!response.ok) throw new Error(payload.error?.message ?? "Could not load this cutoff selection.");
      startTransition(() => {
        setSelection(payload.selection);
        setFilters(payload.filters);
        setRows(payload.rows);
        setTotal(payload.pagination.total);
        setChart(payload.chart);
      });
      if (historyMode !== "none") {
        history[historyMode === "push" ? "pushState" : "replaceState"](null, "", `${location.pathname}#${hashSelection(payload.selection)}`);
      }
      setAnnouncement(announceReset ? "Dependent filters were reset to available values." : `Showing ${payload.pagination.total} programs.`);
    } catch (caught) {
      if ((caught as Error).name !== "AbortError") setError((caught as Error).message);
    }
  }
  const loadController = useRef<AbortController | null>(null);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const selectionFromHash = () => {
      const current = new URLSearchParams(location.hash.slice(1));
      return {
        body: (current.get("body") as CutoffSelection["body"]) ?? selection.body,
        round: Number(current.get("round")) || selection.round,
        quota: current.get("quota") ?? selection.quota,
        seatType: current.get("seatType") ?? selection.seatType,
        gender: current.get("gender") ?? selection.gender,
        offeringId: current.get("offering") ?? selection.offeringId,
      };
    };
    const hash = new URLSearchParams(location.hash.slice(1));
    if ([...hash.keys()].length > 0) {
      void load(selectionFromHash(), false, undefined, "replace");
    }
    const onPopState = () => void load(selectionFromHash(), false, undefined, "none");
    addEventListener("popstate", onPopState);
    return () => {
      removeEventListener("popstate", onPopState);
      loadController.current?.abort();
    };
    // Initial fragment hydration is intentionally one-shot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const field = (label: string, value: string, values: string[], onChange: (value: string) => void, format = (value: string) => value) => (
    <label className="cutoff-field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{values.map((item) => <option key={item} value={item}>{format(item)}</option>)}</select></label>
  );

  return (
    <section className="cutoff-explorer" aria-labelledby="cutoff-results-title" aria-busy={isPending}>
      <div className="cutoff-controls-panel">
        <div className="cutoff-controls-intro"><div><h2>Filter cutoffs</h2><p>Choose the seat pool that applies to you.</p></div>{isPending ? <span className="cutoff-loading">Updating…</span> : null}</div>
        <div className="cutoff-controls">
          {field("Counselling", selection.body, filters.bodies, (body) => void load({ body: body as CutoffSelection["body"] }, true, "body"), (body) => bodyLabel(body as CutoffSelection["body"]))}
          {field("Round", String(selection.round), filters.rounds.map(String), (round) => void load({ round: Number(round) }, true, "round"), (round) => `Round ${round}`)}
          {field("Quota", selection.quota, filters.quotas, (quota) => void load({ quota }, true, "quota"))}
          {field("Category", selection.seatType, filters.seatTypes, (seatType) => void load({ seatType }, true, "seatType"))}
          {field("Gender", selection.gender, filters.genders, (gender) => void load({ gender }, true, "gender"), genderLabel)}
        </div>
      </div>

      <div className="cutoff-chart-card">
        <div className="cutoff-section-heading"><div><h2>Ranks by round</h2><p>See how the opening and closing rank moved through counselling.</p>{exactProfile ? <Link className="cutoff-inline-link" href={exactProfile.path}>Open this exact profile</Link> : null}</div>
          <label className="cutoff-field cutoff-program-field"><span>Program</span><select value={selection.offeringId} onChange={(event) => void load({ offeringId: event.target.value })}>{filters.offerings.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        </div>
        <CutoffChart points={chart} label="Opening and closing rank trajectory for the selected program" />
      </div>

      <div className="cutoff-table-section">
        <div className="cutoff-section-heading"><div><h2 id="cutoff-results-title">Programs</h2><p>{bodyLabel(selection.body)} · Round {selection.round} · {selection.quota} quota · {selection.seatType} · {genderLabel(selection.gender)}</p></div><span className="cutoff-result-count">{total.toLocaleString("en-IN")} results</span></div>
        {error ? <div className="cutoff-error" role="alert">{error} Showing the last available results.</div> : null}
        {rows.length ? <>
          <div className="cutoff-table-scroll"><table className="cutoff-table" data-release={props.release}><caption>Program opening and closing ranks for the selected counselling profile</caption><thead><tr><th scope="col">Program</th><th scope="col">Degree</th><th scope="col">Duration</th><th scope="col">Opening</th><th scope="col">Closing</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.offering_id}-${row.body}-${row.round}-${row.quota}-${row.seat_type}-${row.gender}`}><th scope="row" data-label="Program" data-field="program">{row.source_program_name}</th><td data-label="Degree" data-field="degree">{row.degree}</td><td data-label="Duration" data-field="duration">{row.duration_years} years</td><td data-label="Opening" data-field="opening-rank">{row.opening_rank.toLocaleString("en-IN")}</td><td data-label="Closing" data-field="closing-rank"><strong>{row.closing_rank.toLocaleString("en-IN")}</strong></td></tr>)}</tbody></table></div>
        </> : <div className="cutoff-empty">No programs match this combination. Try a different category or quota.</div>}
        {total > rows.length ? <p className="cutoff-muted">Showing the first 100 programs. Narrow the filters to find a specific result.</p> : null}
      </div>
      <p className="cutoff-sr-table" aria-live="polite">{announcement}</p>
    </section>
  );
}
