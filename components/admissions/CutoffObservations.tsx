"use client";

import type { AdmissionsCutoffObservation } from "@/lib/admissions/types";
import {
  groupMhtCetPrograms,
  poolFamilyLabel,
  type MhtCetProgramGroup,
  type MhtCetProgramRow,
} from "@/lib/admissions/mht-cet-seat-pool";
import {
  DEFAULT_MHT_CET_SEAT_VIEW,
  MHT_CET_SEAT_SPECIALS,
  MHT_CET_SEAT_VIEW_STORAGE_KEY,
  matchFamilySeat,
  matchProgramSeat,
  parseMhtCetSeatView,
  seatCaption,
  seatViewFromCandidate,
  type MhtCetSeatView,
} from "@/lib/admissions/mht-cet-seat-view";
import {
  MHT_CET_SCORE_STORAGE_KEY,
  compareMhtCetScore,
  describeMhtCetMargin,
  formatMhtCetMargin,
  parseMhtCetScore,
  percentileScale,
  rankHeat,
  readStoredMhtCetScore,
  scalePosition,
  type MhtCetScore,
  type MhtCetScoreMode,
  type MhtCetVerdict,
  type PercentileScale,
} from "@/lib/admissions/mht-cet-score";
import { getAdmissionsProfileStorageKey, decodeAdmissionsDeviceProfile } from "@/lib/admissions/profile-codec";
import { MHT_CET_CATEGORY_OPTIONS, MHT_CET_HOME_UNIVERSITIES } from "@/lib/mht-cet/state-cutoffs/candidate-profile";
import CopyCollegeCode from "@/components/admissions/CopyCollegeCode";
import MhtPill from "@/components/admissions/MhtPill";
import { Fragment, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

type ExplorerMode = "seat" | "grid";
type SortKey = "cutoff-desc" | "cutoff-asc" | "name-asc" | "name-desc";

const EXPLORER_MODE_STORAGE_KEY = "deetnuts:mht-cet-cutoff-mode:v1";

// Official CET Cell order. Defence, PWD and orphan pools are split by category,
// so they stay in the program detail.
const GRID_FAMILIES = ["open", "sc", "st", "vj-dt", "nt-b", "nt-c", "nt-d", "obc", "sebc", "ews", "tfws", "minority"];

const GENDER_OPTIONS = [
  { value: "general", label: "General" },
  { value: "ladies", label: "Ladies" },
] as const;

const HOME_SCOPES = new Set(["Home university", "Other university"]);
const CATEGORY_IDS = new Set<string>(MHT_CET_CATEGORY_OPTIONS.map((option) => option.value));
const SELECTABLE_FAMILIES = new Set<string>([
  ...CATEGORY_IDS,
  ...MHT_CET_SEAT_SPECIALS.map((option) => option.value).filter((value) => value !== "none"),
]);

function formatRank(value: number | null | undefined): ReactNode {
  if (value === null || value === undefined || !Number.isFinite(value)) return <span className="mht-na">—</span>;
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);
}

// Official percentiles carry seven decimals; the first two carry the signal.
function Percentile({ value, short = false }: { value: number | null | undefined; short?: boolean }) {
  if (value === null || value === undefined || !Number.isFinite(value)) return <span className="mht-na">—</span>;
  const [whole, fraction = ""] = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 7 })
    .format(value)
    .split(".");
  if (!fraction) return <>{whole}</>;
  return (
    <>
      {whole}.{fraction.slice(0, 2)}
      {!short && fraction.length > 2 ? <span className="mht-dim">{fraction.slice(2)}</span> : null}
    </>
  );
}

function Verdict({ verdict, mode }: { verdict: MhtCetVerdict | null; mode: MhtCetScoreMode }) {
  if (!verdict) return <span className="mht-na">—</span>;
  return (
    <span className="mht-verdict" data-status={verdict.status}>
      <span aria-hidden="true">{formatMhtCetMargin(verdict, mode)}</span>
      <span className="mht-sr">{describeMhtCetMargin(verdict, mode)}</span>
    </span>
  );
}

function ScaleBar({
  value,
  scale,
  you,
  status,
}: {
  value: number | null | undefined;
  scale: PercentileScale;
  you: number | null;
  status?: string;
}) {
  const position = value === null || value === undefined ? null : scalePosition(value, scale);
  return (
    <div className="mht-bar" data-status={status} aria-hidden="true">
      {position === null ? null : (
        <>
          <span className="mht-bar-fill" style={{ width: `${position * 100}%` }} />
          <span className="mht-bar-dot" style={{ left: `${position * 100}%` }} />
        </>
      )}
      {you === null ? null : <span className="mht-bar-you" style={{ left: `${scalePosition(you, scale) * 100}%` }} />}
    </div>
  );
}

// Rows sit under a category heading, so "OBC, General, State level" reads as "General".
function poolLine(row: MhtCetProgramRow, showScope: boolean): string {
  const prefix = `${poolFamilyLabel(row.poolFamily)}, `;
  const label = row.poolLabel.startsWith(prefix) ? row.poolLabel.slice(prefix.length) : row.poolLabel;
  return showScope && row.poolScope ? `${label}, ${row.poolScope}` : label;
}

function familyOf(view: MhtCetSeatView): string {
  return view.special === "none" ? view.categoryId : view.special;
}

function viewForFamily(view: MhtCetSeatView, family: string): MhtCetSeatView {
  if (CATEGORY_IDS.has(family)) return { ...view, categoryId: family as MhtCetSeatView["categoryId"], special: "none" };
  return { ...view, special: family as MhtCetSeatView["special"] };
}

function programMatches(group: MhtCetProgramGroup, search: string): boolean {
  if (!search) return true;
  return [group.name, ...group.rows.map((row) => row.programCode)]
    .join(" ")
    .toLocaleLowerCase("en-IN")
    .includes(search);
}

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName))
  );
}

function ProgramDetail({
  group,
  headline,
  score,
}: {
  group: MhtCetProgramGroup;
  headline: MhtCetProgramRow | null;
  score: MhtCetScore | null;
}) {
  const showScope =
    new Set(group.rows.map((row) => row.poolScope).filter((scope) => scope !== null)).size > 1;
  const families: Array<[string, MhtCetProgramRow[]]> = [];
  for (const row of group.rows) {
    const last = families.at(-1);
    if (last && last[0] === row.poolFamily) last[1].push(row);
    else families.push([row.poolFamily, [row]]);
  }
  return (
    <div className="mht-detail">
      <div className="mht-detail-head">
        {group.codes.map((code) => (
          <span key={code} className="mht-detail-code">
            <span>Choice code</span>
            <strong>{code}</strong>
            <CopyCollegeCode code={code} idleLabel={`Copy choice code ${code}`} />
          </span>
        ))}
        <span className="mht-detail-count">
          {group.rows.length === 1 ? "1 seat pool" : `${group.rows.length} seat pools`}
        </span>
      </div>
      <div className="mht-family-grid">
        {families.map(([family, rows]) => (
          <section key={family} className="mht-family" aria-label={`${poolFamilyLabel(family)} seats`}>
            <h4>{poolFamilyLabel(family)}</h4>
            <ul>
              {rows.map((row) => {
                const verdict = compareMhtCetScore(row, score);
                return (
                  <li
                    key={row.id}
                    data-current={row === headline ? "" : undefined}
                    data-status={verdict?.status}
                  >
                    <span className="mht-pool-name">
                      {poolLine(row, showScope)}
                      {row === headline ? <span className="mht-chip mht-chip-go">Your seat</span> : null}
                      <small>
                        {row.category}
                        {row.showChoiceCode ? ` · ${row.programCode}` : ""}
                      </small>
                    </span>
                    <span className="mht-pool-num">
                      <Percentile value={row.percentileValue} />
                    </span>
                    <span className="mht-pool-num mht-pool-rank">{formatRank(row.rankValue)}</span>
                    {score ? (
                      <span className="mht-pool-num">
                        <Verdict verdict={verdict} mode={score.mode} />
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

export default function CutoffObservations({
  observations,
  period,
  footer,
  anchorId,
  collegeHomeUniversityId = null,
}: {
  observations: AdmissionsCutoffObservation[];
  period: string;
  footer?: ReactNode;
  anchorId?: string;
  collegeHomeUniversityId?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<MhtCetSeatView>(DEFAULT_MHT_CET_SEAT_VIEW);
  const [openId, setOpenId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("cutoff-desc");
  const [mode, setMode] = useState<ExplorerMode>("seat");
  const [scoreMode, setScoreMode] = useState<MhtCetScoreMode>("percentile");
  const [scoreText, setScoreText] = useState("");
  const [onlyCleared, setOnlyCleared] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const scoreRef = useRef<HTMLInputElement>(null);
  const scoreId = useId();
  const groups = useMemo(() => groupMhtCetPrograms(observations), [observations]);
  const score = parseMhtCetScore(scoreMode, scoreText);
  const scoreInvalid = scoreText.trim() !== "" && !score;

  useEffect(() => {
    const fit = decodeAdmissionsDeviceProfile(
      window.localStorage.getItem(getAdmissionsProfileStorageKey("mht-cet")),
      "mht-cet",
    );
    const storedView = parseMhtCetSeatView(window.localStorage.getItem(MHT_CET_SEAT_VIEW_STORAGE_KEY));
    const seededView = storedView ?? (fit ? seatViewFromCandidate(fit.profile.candidate) : null);
    if (seededView) setView(seededView);
    const storedScore = readStoredMhtCetScore(window.localStorage.getItem(MHT_CET_SCORE_STORAGE_KEY));
    if (storedScore) {
      setScoreMode(storedScore.mode);
      setScoreText(storedScore.text);
    } else if (fit) {
      setScoreMode(fit.profile.scoreMode);
      setScoreText(String(fit.profile.score));
    }
    if (window.localStorage.getItem(EXPLORER_MODE_STORAGE_KEY) === "grid") setMode("grid");
  }, []);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      if (!searchRef.current) return;
      event.preventDefault();
      searchRef.current.focus();
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  useEffect(() => {
    if (!anchorId) return;
    const focusScore = () => {
      if (window.location.hash === `#${anchorId}`) scoreRef.current?.focus({ preventScroll: true });
    };
    focusScore();
    window.addEventListener("hashchange", focusScore);
    return () => window.removeEventListener("hashchange", focusScore);
  }, [anchorId]);

  function updateView(next: MhtCetSeatView) {
    setView(next);
    window.localStorage.setItem(MHT_CET_SEAT_VIEW_STORAGE_KEY, JSON.stringify(next));
  }

  function updateScore(nextMode: MhtCetScoreMode, nextText: string) {
    setScoreMode(nextMode);
    setScoreText(nextText);
    if (nextText.trim()) {
      window.localStorage.setItem(MHT_CET_SCORE_STORAGE_KEY, JSON.stringify({ mode: nextMode, text: nextText }));
    } else {
      window.localStorage.removeItem(MHT_CET_SCORE_STORAGE_KEY);
      setOnlyCleared(false);
    }
  }

  function updateMode(next: ExplorerMode) {
    setMode(next);
    window.localStorage.setItem(EXPLORER_MODE_STORAGE_KEY, next);
  }

  // Offer only the seats this college publishes, plus whatever is already selected.
  const families = useMemo(() => new Set(observations.map((row) => row.poolFamily)), [observations]);
  const categoryOptions = MHT_CET_CATEGORY_OPTIONS.filter(
    (option) => families.has(option.value) || option.value === view.categoryId,
  );
  const specialOptions = MHT_CET_SEAT_SPECIALS.filter(
    (option) => option.value === "none" || families.has(option.value) || option.value === view.special,
  );
  const hasLadies = observations.some((row) => row.poolLabel.split(", ").includes("Ladies"));
  const hasHomeSplit = observations.some((row) => row.poolScope !== null && HOME_SCOPES.has(row.poolScope));
  const gridFamilies = GRID_FAMILIES.filter((family) => families.has(family));
  const selectedFamily = familyOf(view);

  const search = query.trim().toLocaleLowerCase("en-IN");
  const rows = groups.map((group) => {
    const headline = matchProgramSeat(group.rows, view, collegeHomeUniversityId);
    const verdict = compareMhtCetScore(headline, score);
    return {
      group,
      headline,
      verdict,
      visible: programMatches(group, search) && (!onlyCleared || verdict?.status === "cleared"),
    };
  });
  rows.sort((a, b) => {
    if (sort === "name-asc" || sort === "name-desc") {
      const order = a.group.name.localeCompare(b.group.name, "en-IN");
      return sort === "name-asc" ? order : -order;
    }
    const left = a.headline?.percentileValue ?? null;
    const right = b.headline?.percentileValue ?? null;
    if (left === right) return 0;
    if (left === null) return 1;
    if (right === null) return -1;
    return sort === "cutoff-desc" ? right - left : left - right;
  });

  const visibleCount = rows.filter((row) => row.visible).length;
  const publishedCount = rows.filter((row) => row.headline).length;
  const compared = rows.filter((row) => row.verdict);
  const clearedCount = compared.filter((row) => row.verdict?.status === "cleared").length;
  const youPercentile = score?.mode === "percentile" ? score.value : null;
  const seatScale = percentileScale(
    rows.map((row) => row.headline?.percentileValue),
    youPercentile,
  );
  const gridCells =
    mode === "grid"
      ? new Map(
          groups.map((group) => [
            group.id,
            gridFamilies.map((family) => matchFamilySeat(group.rows, family, view, collegeHomeUniversityId)),
          ]),
        )
      : null;
  const gridRanks = gridCells ? [...gridCells.values()].flat().map((cell) => cell?.rankValue) : [];
  const caption = seatCaption(view);
  const sortDirection = (key: "cutoff" | "name") =>
    sort.startsWith(key) ? (sort.endsWith("desc") ? "descending" : "ascending") : "none";

  const scoreBox = (
    <div className="mht-score" data-filled={score ? "" : undefined} data-invalid={scoreInvalid ? "" : undefined}>
      <div className="mht-score-field">
        <label className="mht-score-label" htmlFor={scoreId}>
          Your {scoreMode === "rank" ? "rank" : "percentile"}
        </label>
        <input
          id={scoreId}
          ref={scoreRef}
          type="number"
          inputMode={scoreMode === "rank" ? "numeric" : "decimal"}
          min={scoreMode === "rank" ? 1 : 0}
          max={scoreMode === "rank" ? 1_000_000 : 100}
          step={scoreMode === "rank" ? 1 : "any"}
          value={scoreText}
          placeholder={scoreMode === "rank" ? "e.g. 12000" : "e.g. 97.5"}
          aria-invalid={scoreInvalid}
          aria-describedby={scoreInvalid ? `${scoreId}-error` : undefined}
          onChange={(event) => updateScore(scoreMode, event.target.value)}
        />
        {scoreText ? (
          <button
            type="button"
            className="mht-score-clear"
            onClick={() => {
              updateScore(scoreMode, "");
              scoreRef.current?.focus();
            }}
          >
            <span aria-hidden="true">×</span>
            <span className="mht-sr">Clear score</span>
          </button>
        ) : null}
      </div>
      <div className="mht-seg" role="group" aria-label="Compare by">
        {(["percentile", "rank"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={scoreMode === option}
            onClick={() => {
              updateScore(option, scoreMode === option ? scoreText : "");
              scoreRef.current?.focus();
            }}
          >
            {option === "percentile" ? "Percentile" : "Rank"}
          </button>
        ))}
      </div>
    </div>
  );

  const seatPills = (
    <div className="mht-seat-pills">
      {categoryOptions.length > 1 ? (
        <MhtPill
          label="Category"
          value={view.categoryId}
          options={categoryOptions}
          onChange={(categoryId) => updateView({ ...view, categoryId })}
        />
      ) : null}
      {hasLadies || view.gender === "ladies" ? (
        <MhtPill
          label="Seat"
          value={view.gender}
          options={GENDER_OPTIONS}
          onChange={(gender) => updateView({ ...view, gender })}
        />
      ) : null}
      {hasHomeSplit ? (
        <MhtPill
          label="Home university"
          value={view.homeUniversityId ?? ""}
          options={MHT_CET_HOME_UNIVERSITIES.map((option) => ({ value: option.id, label: option.label }))}
          emptyLabel="Choose"
          wide
          attention={!view.homeUniversityId}
          onChange={(homeUniversityId) => updateView({ ...view, homeUniversityId: homeUniversityId || null })}
        />
      ) : null}
      {specialOptions.length > 1 ? (
        <MhtPill
          label="Special"
          value={view.special}
          options={specialOptions}
          onChange={(special) => updateView({ ...view, special })}
        />
      ) : null}
    </div>
  );

  // Say only what the controls above and the stat strip don't already show.
  const statusMain =
    score && compared.length > 0 ? (
      <>
        Clears{" "}
        <strong>
          {clearedCount} of {compared.length}
        </strong>{" "}
        {compared.length === 1 ? "program" : "programs"}.
      </>
    ) : publishedCount > 0 && publishedCount < groups.length ? (
      `${publishedCount} of ${groups.length} programs publish this seat.`
    ) : null;
  const searchHint = search && visibleCount > 0 ? `${visibleCount} of ${groups.length} match “${query.trim()}”` : null;
  const homeHint =
    hasHomeSplit && !view.homeUniversityId && publishedCount > 0
      ? "Showing home university cutoffs until you choose yours."
      : null;
  const scoreHint = scoreInvalid
    ? scoreMode === "percentile"
      ? "Enter a percentile from 0 to 100."
      : "Enter a whole-number rank, 1 or higher."
    : null;
  const status =
    statusMain || searchHint || homeHint || scoreHint ? (
      <div className="mht-xstatus" aria-live="polite">
        {scoreHint ? (
          <p className="mht-xstatus-error" id={`${scoreId}-error`}>
            {scoreHint}
          </p>
        ) : null}
        {statusMain ? <p className="mht-xstatus-main">{statusMain}</p> : null}
        {searchHint ? <p className="mht-xstatus-hint">{searchHint}</p> : null}
        {homeHint ? <p className="mht-xstatus-hint">{homeHint}</p> : null}
        {score && compared.length > 0 ? (
          <p className="mht-legend" aria-hidden="true">
            <span data-status="cleared">Cleared</span>
            <span data-status="close">Within {score.mode === "percentile" ? "1 point" : "20%"}</span>
            <span data-status="short">Short</span>
          </p>
        ) : null}
      </div>
    ) : null;

  const noSeat =
    publishedCount === 0 ? (
      <div className="mht-empty">
        <p>This seat isn’t published here. Try:</p>
        <div className="mht-empty-actions">
          {[...SELECTABLE_FAMILIES]
            .filter((family) => families.has(family) && family !== selectedFamily)
            .map((family) => (
              <button
                key={family}
                type="button"
                className="mht-btn mht-btn-sm"
                onClick={() => updateView(viewForFamily(view, family))}
              >
                {poolFamilyLabel(family)}
              </button>
            ))}
        </div>
      </div>
    ) : null;

  if (observations.length === 0) {
    return (
      <div className="mht-cutoff-explorer" id={anchorId}>
        <p className="mht-empty">No official cutoff rows for {period}. Try another year or round.</p>
        {footer}
      </div>
    );
  }

  return (
    <div className="mht-cutoff-explorer" id={anchorId} data-mode={mode} data-scored={score ? "" : undefined}>
      <div className="mht-xbar">
        <div className="mht-xbar-row">
          {scoreBox}
          {seatPills}
        </div>
        <div className="mht-xbar-row">
          <label className="mht-search">
            <span className="mht-sr">Find a program</span>
            <svg aria-hidden="true" viewBox="0 0 16 16">
              <circle cx="7" cy="7" r="5.25" />
              <path d="m11 11 3.5 3.5" />
            </svg>
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape" && query) {
                  event.preventDefault();
                  setQuery("");
                }
              }}
              placeholder="Find a program"
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="mht-kbd" aria-hidden="true">/</kbd>
          </label>
          <div className="mht-xbar-tools">
            {score ? (
              <label className="mht-check">
                <input
                  type="checkbox"
                  checked={onlyCleared}
                  onChange={(event) => setOnlyCleared(event.target.checked)}
                />
                Only what I clear
              </label>
            ) : null}
            <div className="mht-seg" role="group" aria-label="Table view">
              <button type="button" aria-pressed={mode === "seat"} onClick={() => updateMode("seat")}>
                Your seat
              </button>
              <button type="button" aria-pressed={mode === "grid"} onClick={() => updateMode("grid")}>
                All categories
              </button>
            </div>
          </div>
        </div>
      </div>

      {status}
      {noSeat}

      {visibleCount === 0 && publishedCount > 0 ? (
        <div className="mht-empty">
          {/* With only the filter active, the status line above already says "Clears 0 of N". */}
          {search ? <p>No program matches “{query.trim()}”.</p> : null}
          <div className="mht-empty-actions">
            {search ? (
              <button type="button" className="mht-btn mht-btn-sm" onClick={() => setQuery("")}>
                Clear search
              </button>
            ) : null}
            {onlyCleared ? (
              <button type="button" className="mht-btn mht-btn-sm" onClick={() => setOnlyCleared(false)}>
                Show every program
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {mode === "seat" ? (
        <table className="mht-compare" hidden={visibleCount === 0 || publishedCount === 0}>
          <caption className="mht-sr">
            {period} cutoffs, {caption}
          </caption>
          <thead>
            <tr>
              <th scope="col" className="mht-c-program" aria-sort={sortDirection("name")}>
                <button
                  type="button"
                  className="mht-sort"
                  onClick={() => setSort(sort === "name-asc" ? "name-desc" : "name-asc")}
                >
                  Program
                </button>
              </th>
              <th scope="col" className="mht-c-pct" aria-sort={sortDirection("cutoff")}>
                <button
                  type="button"
                  className="mht-sort"
                  onClick={() => setSort(sort === "cutoff-desc" ? "cutoff-asc" : "cutoff-desc")}
                >
                  Percentile
                </button>
              </th>
              <th scope="col" className="mht-c-rank">
                Rank
              </th>
              <th scope="col" className="mht-c-bar">
                <span className="mht-axis" aria-hidden="true">
                  <span>{seatScale.lo}</span>
                  <span>{(seatScale.lo + seatScale.hi) / 2}</span>
                  <span>100</span>
                </span>
                <span className="mht-sr">Position on the percentile scale</span>
              </th>
              {score ? (
                <th scope="col" className="mht-c-you">
                  vs you
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ group, headline, verdict, visible }) => {
              const open = openId === group.id;
              const panelId = `${group.anchor}-pools`;
              return (
                <Fragment key={group.id}>
                  <tr
                    className="mht-program-row"
                    data-status={verdict?.status}
                    data-open={open ? "" : undefined}
                    hidden={!visible}
                  >
                    <th scope="row" id={group.anchor} className="mht-c-program">
                      <button
                        type="button"
                        className="mht-program-toggle"
                        aria-expanded={open}
                        aria-controls={panelId}
                        onClick={() => setOpenId((current) => (current === group.id ? null : group.id))}
                      >
                        {group.name}
                      </button>
                      {score ? (
                        <span className="mht-program-meta">
                          <Verdict verdict={verdict} mode={score.mode} />
                        </span>
                      ) : null}
                    </th>
                    <td className="mht-c-pct">
                      <Percentile value={headline?.percentileValue} />
                      <span className="mht-inline-rank">{formatRank(headline?.rankValue)}</span>
                    </td>
                    <td className="mht-c-rank">
                      <strong>{formatRank(headline?.rankValue)}</strong>
                    </td>
                    <td className="mht-c-bar">
                      <ScaleBar
                        value={headline?.percentileValue}
                        scale={seatScale}
                        you={youPercentile}
                        status={verdict?.status}
                      />
                    </td>
                    {score ? (
                      <td className="mht-c-you">
                        <Verdict verdict={verdict} mode={score.mode} />
                      </td>
                    ) : null}
                  </tr>
                  <tr className="mht-compare-pools" hidden={!visible}>
                    <td colSpan={score ? 5 : 4}>
                      <details
                        id={panelId}
                        open={open}
                        onToggle={(event) => {
                          if (event.currentTarget.open) setOpenId(group.id);
                          else setOpenId((current) => (current === group.id ? null : current));
                        }}
                      >
                        <summary className="mht-sr" tabIndex={-1} aria-hidden="true">
                          All seat pools for {group.name}
                        </summary>
                        <ProgramDetail group={group} headline={headline} score={score} />
                      </details>
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      ) : (
        <>
          {gridFamilies.length > 2 ? (
            <p className="mht-grid-hint" aria-hidden="true">
              Swipe sideways for every category.
            </p>
          ) : null}
          <div
            className="mht-grid-scroll"
            role="region"
            aria-label={`${period} cutoffs for every category`}
            tabIndex={0}
            hidden={visibleCount === 0}
          >
            <table className="mht-grid" style={{ "--grid-cols": gridFamilies.length } as CSSProperties}>
              <caption className="mht-sr">
                {period} cutoffs by category, {view.gender === "ladies" ? "Ladies" : "General"} seats
              </caption>
              <thead>
                <tr>
                  <th scope="col">Program</th>
                  {gridFamilies.map((family) => (
                    <th key={family} scope="col" data-selected={family === selectedFamily ? "" : undefined}>
                      {SELECTABLE_FAMILIES.has(family) ? (
                        <button
                          type="button"
                          className="mht-sort"
                          aria-pressed={family === selectedFamily}
                          title={`Show ${poolFamilyLabel(family)} seats`}
                          onClick={() => updateView(viewForFamily(view, family))}
                        >
                          {poolFamilyLabel(family)}
                        </button>
                      ) : (
                        poolFamilyLabel(family)
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ group, visible }) => (
                  <tr key={group.id} hidden={!visible}>
                    <th scope="row">{group.name}</th>
                    {gridFamilies.map((family, index) => {
                      const cell = gridCells?.get(group.id)?.[index] ?? null;
                      const verdict = compareMhtCetScore(cell, score);
                      const heat = rankHeat(cell?.rankValue, gridRanks);
                      return (
                        <td
                          key={family}
                          data-selected={family === selectedFamily ? "" : undefined}
                          data-status={verdict?.status}
                          style={heat === null ? undefined : ({ "--heat": heat } as CSSProperties)}
                          title={
                            cell
                              ? `${poolFamilyLabel(family)}: ${cell.poolLabel}${cell.poolScope ? `, ${cell.poolScope}` : ""} (${cell.category})`
                              : `${poolFamilyLabel(family)} not published`
                          }
                        >
                          {cell ? (
                            <>
                              <span className="mht-grid-pct">
                                <Percentile value={cell.percentileValue} short />
                              </span>
                              <span className="mht-grid-rank">{formatRank(cell.rankValue)}</span>
                          </>
                        ) : (
                          <span className="mht-na">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
      {footer}
    </div>
  );
}
