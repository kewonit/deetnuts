"use client";

import type { AdmissionsCutoffObservation } from "@/lib/admissions/types";
import { groupMhtCetPrograms, type MhtCetProgramGroup } from "@/lib/admissions/mht-cet-seat-pool";
import {
  DEFAULT_MHT_CET_SEAT_VIEW,
  MHT_CET_SEAT_SPECIALS,
  MHT_CET_SEAT_VIEW_STORAGE_KEY,
  matchProgramSeat,
  parseMhtCetSeatView,
  seatCaption,
  seatPlaceLine,
  seatViewFromCandidate,
  type MhtCetSeatView,
} from "@/lib/admissions/mht-cet-seat-view";
import { getAdmissionsProfileStorageKey, decodeAdmissionsDeviceProfile } from "@/lib/admissions/profile-codec";
import { MHT_CET_CATEGORY_OPTIONS, MHT_CET_HOME_UNIVERSITIES } from "@/lib/mht-cet/state-cutoffs/candidate-profile";
import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";

function formatNumber(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: digits,
  }).format(value);
}

function poolHeading(label: string, scope: string | null): string {
  return scope ? `${label}, ${scope}` : label;
}

function programMatches(group: MhtCetProgramGroup, search: string): boolean {
  if (!search) return true;
  return [group.name, ...group.rows.map((row) => row.programCode)]
    .join(" ")
    .toLocaleLowerCase("en-IN")
    .includes(search);
}

function programStatus(shown: number, total: number, searching: boolean): string {
  if (searching) return `${shown} of ${total}`;
  return shown === 1 ? "1 program" : `${shown} programs`;
}

export default function CutoffObservations({
  observations,
  yearRound,
  collegeHomeUniversityId = null,
}: {
  observations: AdmissionsCutoffObservation[];
  system: "mht-cet";
  limit?: number;
  yearRound?: ReactNode;
  collegeHomeUniversityId?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<MhtCetSeatView>(DEFAULT_MHT_CET_SEAT_VIEW);
  const [openId, setOpenId] = useState<string | null>(null);
  const groups = useMemo(() => groupMhtCetPrograms(observations), [observations]);
  const caption = seatCaption(view);
  const place = seatPlaceLine(observations, view, collegeHomeUniversityId);

  useEffect(() => {
    const stored = parseMhtCetSeatView(window.localStorage.getItem(MHT_CET_SEAT_VIEW_STORAGE_KEY));
    if (stored) {
      setView(stored);
      return;
    }
    const fit = decodeAdmissionsDeviceProfile(
      window.localStorage.getItem(getAdmissionsProfileStorageKey("mht-cet")),
      "mht-cet",
    );
    const seeded = fit ? seatViewFromCandidate(fit.profile.candidate) : null;
    if (seeded) setView(seeded);
  }, []);

  function updateView(next: MhtCetSeatView) {
    setView(next);
    window.localStorage.setItem(MHT_CET_SEAT_VIEW_STORAGE_KEY, JSON.stringify(next));
  }
  const search = query.trim().toLocaleLowerCase("en-IN");
  const visibleCount = groups.filter((group) => programMatches(group, search)).length;

  const seatFields = (
    <>
      <label className="mht-seat-field">
        <span className="cutoff-sr-table">Category</span>
        <select
          className="mht-toolbar-select mht-category-select"
          value={view.categoryId}
          onChange={(event) =>
            updateView({ ...view, categoryId: event.target.value as MhtCetSeatView["categoryId"] })
          }
        >
          {MHT_CET_CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="mht-seat-field">
        <span className="cutoff-sr-table">Gender</span>
        <select
          className="mht-toolbar-select mht-gender-select"
          value={view.gender}
          onChange={(event) =>
            updateView({ ...view, gender: event.target.value as MhtCetSeatView["gender"] })
          }
        >
          <option value="general">General</option>
          <option value="ladies">Ladies</option>
        </select>
      </label>
      <label className="mht-seat-field mht-university-field">
        <span className="cutoff-sr-table">Home university</span>
        <select
          className="mht-toolbar-select mht-university-select"
          value={view.homeUniversityId ?? ""}
          onChange={(event) => updateView({ ...view, homeUniversityId: event.target.value || null })}
        >
          <option value="">Your university</option>
          {MHT_CET_HOME_UNIVERSITIES.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="mht-seat-field">
        <span className="cutoff-sr-table">Special seat</span>
        <select
          className="mht-toolbar-select mht-special-select"
          value={view.special}
          onChange={(event) => updateView({ ...view, special: event.target.value as MhtCetSeatView["special"] })}
        >
          {MHT_CET_SEAT_SPECIALS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </>
  );

  if (observations.length === 0) {
    return (
      <div className="mht-cutoff-explorer">
        <div className="mht-cutoff-toolbar">
          {seatFields}
          {yearRound}
        </div>
        <p className="text-sm text-zinc-500">
          No comparable official cutoff rows. Try another year or round.
        </p>
      </div>
    );
  }

  return (
    <div className="mht-cutoff-explorer">
      <div className="mht-cutoff-toolbar">
        <label className="mht-program-search">
          <span className="cutoff-sr-table">Find a program</span>
          <svg aria-hidden="true" viewBox="0 0 20 20">
            <circle cx="8.5" cy="8.5" r="5.5" />
            <path d="m12.5 12.5 4 4" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a program"
          />
        </label>
        {seatFields}
        {yearRound}
      </div>
      <p className="mht-seat-place">{place}</p>
      <p className="mht-cutoff-status">{programStatus(visibleCount, groups.length, search.length > 0)}</p>
      {visibleCount === 0 ? <p className="mht-program-missing">No program matched.</p> : null}
      <table className="mht-compare" hidden={visibleCount === 0}>
        <caption>{caption}</caption>
        <colgroup>
          <col />
          <col className="mht-col-percentile" />
          <col className="mht-col-rank" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Program</th>
            <th scope="col">Percentile</th>
            <th scope="col">Rank</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => {
            const matches = programMatches(group, search);
            const headline = matchProgramSeat(group.rows, view, collegeHomeUniversityId);
            const canOpen = group.rows.length > 1;
            const panelId = `${group.anchor}-pools`;
            return (
              <Fragment key={group.id}>
                <tr hidden={!matches}>
                  <th scope="row" id={group.anchor}>
                    {canOpen ? (
                      <button
                        type="button"
                        className="mht-program-toggle"
                        aria-expanded={openId === group.id}
                        aria-controls={panelId}
                        onClick={() => setOpenId((current) => (current === group.id ? null : group.id))}
                      >
                        {group.name}
                      </button>
                    ) : (
                      group.name
                    )}
                  </th>
                  <td>{formatNumber(headline?.percentileValue, 7)}</td>
                  <td>
                    <strong>{formatNumber(headline?.rankValue)}</strong>
                  </td>
                </tr>
                {canOpen ? (
                  <tr className="mht-compare-pools" hidden={!matches}>
                    <td colSpan={3}>
                      <details
                        id={panelId}
                        open={openId === group.id}
                        onToggle={(event) => {
                          if (event.currentTarget.open) setOpenId(group.id);
                          else setOpenId((current) => (current === group.id ? null : current));
                        }}
                      >
                        <summary className="cutoff-sr-table" tabIndex={-1} aria-hidden="true">
                          All pools for {group.name}
                        </summary>
                        <table className="mht-compare">
                          <caption className="cutoff-sr-table">{group.name} pools</caption>
                          <colgroup>
                            <col />
                            <col className="mht-col-percentile" />
                            <col className="mht-col-rank" />
                          </colgroup>
                          <tbody>
                            {group.rows.map((row) => (
                              <tr key={row.id}>
                                <th scope="row">
                                  {poolHeading(row.poolLabel, row.poolScope)}
                                  <small>
                                    {row.category}
                                    {row.showChoiceCode ? ` · ${row.programCode}` : ""}
                                  </small>
                                </th>
                                <td>{formatNumber(row.percentileValue, 7)}</td>
                                <td>
                                  <strong>{formatNumber(row.rankValue)}</strong>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </details>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
