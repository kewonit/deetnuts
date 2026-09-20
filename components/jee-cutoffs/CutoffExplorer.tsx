"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { FilterChip } from "@ejam/ui/components/predictor/filter-chip";
import { FilterGroup } from "@ejam/ui/components/predictor/filter-group";
import { OptionPicker } from "@ejam/ui/components/predictor/option-picker";
import { Button } from "@ejam/ui/components/ui/button";
import { Input } from "@ejam/ui/components/ui/input";
import { EmptyPanel } from "@/components/ejam-chrome/empty-panel";
import CutoffChart from "./CutoffChart";
import type {
  CutoffChartPoint,
  CutoffFilterOptions,
  CutoffSelection,
  CutoffServingRow,
  JeeExamId,
} from "@/lib/jee-cutoffs/types";

const bodyLabel = (body: CutoffSelection["body"]) =>
  body === "josaa" ? "JoSAA" : "CSAB";
const genderLabel = (gender: string) =>
  gender === "NA"
    ? "Not specified in source"
    : gender.replace("Female-only (including Supernumerary)", "Female-only");

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
  profileRoutes: Array<{
    path: string;
    offeringId: string;
    body: CutoffSelection["body"];
    quota: string;
    seatType: string;
    gender: string;
  }>;
  programRoutes: Array<{ path: string; offeringId: string }>;
  initialSelection: CutoffSelection;
  initialFilters: CutoffFilterOptions;
  initialRows: CutoffServingRow[];
  initialTotal: number;
  initialNextCursor: string | null;
  initialChart: CutoffChartPoint[];
}) {
  const [selection, setSelection] = useState(props.initialSelection);
  const [filters, setFilters] = useState(props.initialFilters);
  const [rows, setRows] = useState(props.initialRows);
  const [total, setTotal] = useState(props.initialTotal);
  const [nextCursor, setNextCursor] = useState(props.initialNextCursor);
  const [chart, setChart] = useState(props.initialChart);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [loadingMore, setLoadingMore] = useState(false);
  const exactProfile = props.profileRoutes.find(
    (route) =>
      route.offeringId === selection.offeringId &&
      route.body === selection.body &&
      route.quota === selection.quota &&
      route.seatType === selection.seatType &&
      route.gender === selection.gender,
  );
  const programPathByOffering = useMemo(
    () => new Map(props.programRoutes.map((route) => [route.offeringId, route.path])),
    [props.programRoutes],
  );

  async function load(
    next: Partial<CutoffSelection>,
    announceReset = false,
    cascadeFrom?: "body" | "round" | "seatType" | "gender" | "quota",
    historyMode: "push" | "replace" | "none" = "push",
  ) {
    const merged = { ...selection, ...next };
    const requested: Partial<CutoffSelection> =
      cascadeFrom === "body"
        ? { body: merged.body }
        : cascadeFrom === "round"
          ? { body: merged.body, round: merged.round }
          : cascadeFrom === "seatType"
            ? { body: merged.body, round: merged.round, seatType: merged.seatType }
            : cascadeFrom === "gender"
              ? {
                  body: merged.body,
                  round: merged.round,
                  seatType: merged.seatType,
                  gender: merged.gender,
                }
              : cascadeFrom === "quota"
                ? {
                    body: merged.body,
                    round: merged.round,
                    seatType: merged.seatType,
                    gender: merged.gender,
                    quota: merged.quota,
                  }
                : merged;
    const params = new URLSearchParams({
      release: props.release,
      limit: "100",
    });
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
      const response = await fetch(
        `/api/jee-cutoffs/${props.exam}/${props.college}/${props.year}?${params}`,
        { signal: controller.signal },
      );
      const payload = (await response.json()) as ApiPayload;
      if (response.status === 409) {
        window.location.reload();
        return;
      }
      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Could not load this cutoff selection.");
      }
      startTransition(() => {
        setSelection(payload.selection);
        setFilters(payload.filters);
        setRows(payload.rows);
        setTotal(payload.pagination.total);
        setNextCursor(payload.pagination.nextCursor);
        setChart(payload.chart);
      });
      if (historyMode !== "none") {
        history[historyMode === "push" ? "pushState" : "replaceState"](
          null,
          "",
          `${location.pathname}#${hashSelection(payload.selection)}`,
        );
      }
      setAnnouncement(
        announceReset
          ? "Dependent filters were reset to available values."
          : `Showing ${payload.pagination.total} programs.`,
      );
    } catch (caught) {
      if ((caught as Error).name !== "AbortError") setError((caught as Error).message);
    }
  }
  const loadController = useRef<AbortController | null>(null);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const params = new URLSearchParams({
      release: props.release,
      limit: "100",
      cursor: nextCursor,
      body: selection.body,
      round: String(selection.round),
      quota: selection.quota,
      seatType: selection.seatType,
      gender: selection.gender,
      offering: selection.offeringId,
    });
    try {
      const response = await fetch(
        `/api/jee-cutoffs/${props.exam}/${props.college}/${props.year}?${params}`,
      );
      const payload = (await response.json()) as ApiPayload;
      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Could not load more programs.");
      }
      setRows((current) => [...current, ...payload.rows]);
      setNextCursor(payload.pagination.nextCursor);
      setTotal(payload.pagination.total);
    } catch (caught) {
      if ((caught as Error).name !== "AbortError") setError((caught as Error).message);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
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

  const visibleRows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("en-IN");
    if (!query) return rows;
    return rows.filter((row) =>
      [row.source_program_name, row.degree]
        .join(" ")
        .toLocaleLowerCase("en-IN")
        .includes(query),
    );
  }, [rows, search]);

  const bodyIndex = filters.bodies.indexOf(selection.body);

  return (
    <section className="cutoff-explorer" aria-labelledby="cutoff-results-title" aria-busy={isPending}>
      <div className="cutoff-controls-panel">
        <div className="cutoff-controls-intro">
          <div>
            <h2>Filter cutoffs</h2>
            <p>Choose the seat pool that applies to you.</p>
          </div>
          {isPending ? <span className="cutoff-loading">Updating…</span> : null}
        </div>
        <div className="cutoff-controls cutoff-controls-chips">
          <div role="group" aria-label="Counselling">
            {filters.bodies.length === 2 ? (
              <FilterGroup
                label="Counselling"
                slidingCols={2}
                slidingIndex={bodyIndex >= 0 ? bodyIndex : null}
              >
                {filters.bodies.map((body) => (
                  <FilterChip
                    key={body}
                    fullWidth
                    instant
                    label={bodyLabel(body)}
                    active={selection.body === body}
                    onClick={() => void load({ body }, true, "body")}
                  />
                ))}
              </FilterGroup>
            ) : (
              <FilterGroup label="Counselling">
                {filters.bodies.map((body) => (
                  <FilterChip
                    key={body}
                    instant
                    label={bodyLabel(body)}
                    active={selection.body === body}
                    onClick={() => void load({ body }, true, "body")}
                  />
                ))}
              </FilterGroup>
            )}
          </div>
          <div role="group" aria-label="Round">
            <FilterGroup label="Round">
              {filters.rounds.map((round) => (
                <FilterChip
                  key={round}
                  instant
                  label={`Round ${round}`}
                  active={selection.round === round}
                  onClick={() => void load({ round }, true, "round")}
                />
              ))}
            </FilterGroup>
          </div>
          <label className="cutoff-field">
            <span>Quota</span>
            <OptionPicker
              id="cutoff-quota"
              value={selection.quota}
              options={filters.quotas.map((quota) => ({ value: quota, label: quota }))}
              onValueChange={(quota) => void load({ quota }, true, "quota")}
            />
          </label>
          <label className="cutoff-field">
            <span>Category</span>
            <OptionPicker
              id="cutoff-category"
              value={selection.seatType}
              options={filters.seatTypes.map((seatType) => ({
                value: seatType,
                label: seatType,
              }))}
              onValueChange={(seatType) => void load({ seatType }, true, "seatType")}
            />
          </label>
          <label className="cutoff-field">
            <span>Gender</span>
            <OptionPicker
              id="cutoff-gender"
              value={selection.gender}
              options={filters.genders.map((gender) => ({
                value: gender,
                label: genderLabel(gender),
              }))}
              onValueChange={(gender) => void load({ gender }, true, "gender")}
            />
          </label>
        </div>
      </div>

      <div className="cutoff-chart-card">
        <div className="cutoff-section-heading">
          <div>
            <h2>Ranks by round</h2>
            <p>See how the opening and closing rank moved through counselling.</p>
            {exactProfile ? (
              <Link className="cutoff-inline-link" href={exactProfile.path}>
                Open this exact profile
              </Link>
            ) : null}
          </div>
          <label className="cutoff-field cutoff-program-field">
            <span>Program</span>
            <OptionPicker
              id="cutoff-program"
              value={selection.offeringId}
              options={filters.offerings.map((item) => ({
                value: item.id,
                label: item.label,
              }))}
              onValueChange={(offeringId) => void load({ offeringId })}
            />
          </label>
        </div>
        <CutoffChart
          points={chart}
          label="Opening and closing rank trajectory for the selected program"
        />
      </div>

      <div className="cutoff-table-section">
        <div className="cutoff-section-heading">
          <div>
            <h2 id="cutoff-results-title">Programs</h2>
            <p>
              {bodyLabel(selection.body)} · Round {selection.round} · {selection.quota} quota ·{" "}
              {selection.seatType} · {genderLabel(selection.gender)}
            </p>
          </div>
          <span className="cutoff-result-count">{total.toLocaleString("en-IN")} results</span>
        </div>
        <label className="cutoff-search">
          <span className="cutoff-sr-table">Search programs</span>
          <svg aria-hidden="true" viewBox="0 0 20 20">
            <circle cx="8.5" cy="8.5" r="5.5" />
            <path d="m12.5 12.5 4 4" />
          </svg>
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search programs"
          />
          <span>{visibleRows.length}</span>
        </label>
        {error ? (
          <div className="cutoff-error" role="alert">
            {error} Showing the last available results.
          </div>
        ) : null}
        {visibleRows.length ? (
          <div className="cutoff-table-scroll">
            <table className="cutoff-table" data-release={props.release}>
              <caption>Program opening and closing ranks for the selected counselling profile</caption>
              <thead>
                <tr>
                  <th scope="col">Program</th>
                  <th scope="col">Degree</th>
                  <th scope="col">Duration</th>
                  <th scope="col">Opening</th>
                  <th scope="col">Closing</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr
                    key={`${row.offering_id}-${row.body}-${row.round}-${row.quota}-${row.seat_type}-${row.gender}`}
                  >
                    <th scope="row" data-label="Program" data-field="program">
                      {programPathByOffering.get(row.offering_id) ? (
                        <Link href={programPathByOffering.get(row.offering_id)!}>
                          {row.source_program_name}
                        </Link>
                      ) : (
                        row.source_program_name
                      )}
                    </th>
                    <td data-label="Degree" data-field="degree">
                      {row.degree}
                    </td>
                    <td data-label="Duration" data-field="duration">
                      {row.duration_years} years
                    </td>
                    <td data-label="Opening" data-field="opening-rank">
                      {row.opening_rank.toLocaleString("en-IN")}
                    </td>
                    <td data-label="Closing" data-field="closing-rank">
                      <strong>{row.closing_rank.toLocaleString("en-IN")}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyPanel description="No programs match this combination. Try a different category, quota, or search." />
        )}
        {nextCursor && !search.trim() ? (
          <div className="cutoff-actions">
            <Button
              type="button"
              variant="outline"
              className="rounded-none"
              disabled={loadingMore}
              onClick={() => void loadMore()}
            >
              {loadingMore ? "Loading…" : "Load more programs"}
            </Button>
          </div>
        ) : null}
      </div>
      <p className="cutoff-sr-table" aria-live="polite">
        {announcement}
      </p>
    </section>
  );
}
