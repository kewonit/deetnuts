"use client";

import {
  Fragment,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MhtPill from "@/components/admissions/MhtPill";
import CutoffChart from "./CutoffChart";
import {
  compareMhtCetScore,
  describeMhtCetMargin,
  formatMhtCetMargin,
  rankHeat,
  type MhtCetScore,
  type MhtCetVerdict,
} from "@/lib/admissions/mht-cet-score";
import type {
  CounsellingBody,
  CutoffChartPoint,
  CutoffSelection,
  JeeExamId,
} from "@/lib/jee-cutoffs/types";
import type { JeeYearData, YearPool } from "@/lib/jee-cutoffs/year-data";

type Mode = "grid" | "seat";
type Sort = "rank" | "name";
type Slice = {
  body: CounsellingBody;
  round: number;
  quota: string;
  gender: string;
  seatType: string;
};
type Cell = { opening: number; closing: number; pool: YearPool };

const MODE_STORAGE_KEY = "deetnuts:jee-cutoff-mode:v1";
const SEAT_STORAGE_KEY = "deetnuts:jee-seat:v1";

// Main categories first, then their PwD seats, the way students scan them.
const CATEGORY_ORDER = [
  "OPEN",
  "EWS",
  "OBC-NCL",
  "SC",
  "ST",
  "OPEN (PwD)",
  "EWS (PwD)",
  "OBC-NCL (PwD)",
  "SC (PwD)",
  "ST (PwD)",
];
const QUOTA_ORDER = ["AI", "OS", "HS"];
const GENDER_ORDER = [
  "Gender-Neutral",
  "NA",
  "Female-only (including Supernumerary)",
];
const QUOTA_LABELS: Record<string, string> = {
  AI: "All India",
  HS: "Home state",
  OS: "Other state",
  GO: "Goa",
  JK: "J&K",
  LA: "Ladakh",
  AP: "Andhra Pradesh",
};

const bodyLabel = (body: CounsellingBody) =>
  body === "josaa" ? "JoSAA" : "CSAB";
const quotaLabel = (quota: string) => QUOTA_LABELS[quota] ?? quota;
const genderLabel = (gender: string) =>
  gender === "NA"
    ? "Not specified"
    : gender === "Gender-Neutral"
      ? "Gender-neutral"
      : "Female-only";
// JoSAA ranks each category seat against that category's rank list.
const rankName = (seatType: string) =>
  seatType === "OPEN"
    ? "CRL"
    : seatType.replace("OPEN", "CRL").replace(" (PwD)", "-PwD");
const formatRank = (value: number) => value.toLocaleString("en-IN");
// Architecture and planning seats are allotted on JEE Main Paper 2 ranks, so a Paper 1
// rank is never compared with them and they sort after engineering programs.
const PAPER_TWO = /arch|plan/i;

function ordered(values: Iterable<string>, order: string[]) {
  return [...new Set(values)].sort((left, right) => {
    const a = order.indexOf(left);
    const b = order.indexOf(right);
    if (a === -1 && b === -1) return left.localeCompare(right, "en");
    if (a === -1) return 1;
    if (b === -1) return -1;
    return a - b;
  });
}

function pick<T>(value: T | undefined, available: T[], preferences: T[]): T {
  if (value !== undefined && available.includes(value)) return value;
  return (
    preferences.find((preference) => available.includes(preference)) ??
    available[0]
  );
}

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName))
  );
}

function parseRank(text: string): MhtCetScore | null {
  if (!/^\d+$/.test(text.trim())) return null;
  const value = Number(text.trim());
  return value >= 1 && value <= 2_000_000 ? { mode: "rank", value } : null;
}

function Verdict({ verdict }: { verdict: MhtCetVerdict | null }) {
  if (!verdict) return <span className="mht-na">—</span>;
  return (
    <span className="mht-verdict" data-status={verdict.status}>
      <span aria-hidden="true">{formatMhtCetMargin(verdict, "rank")}</span>
      <span className="mht-sr">{describeMhtCetMargin(verdict, "rank")}</span>
    </span>
  );
}

type SeatMemory = Partial<
  Record<
    JeeExamId,
    { seatType?: string; gender?: string; ranks?: Record<string, string> }
  >
>;

function readSeatMemory(): SeatMemory {
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(SEAT_STORAGE_KEY) ?? "{}",
    );
    return parsed && typeof parsed === "object" ? (parsed as SeatMemory) : {};
  } catch {
    return {};
  }
}

function writeSeatMemory(
  exam: JeeExamId,
  update: { seatType?: string; gender?: string; rank?: [string, string] },
) {
  try {
    const memory = readSeatMemory();
    const current = memory[exam] ?? {};
    const ranks = { ...current.ranks };
    if (update.rank) {
      if (update.rank[1]) ranks[update.rank[0]] = update.rank[1];
      else delete ranks[update.rank[0]];
    }
    memory[exam] = {
      seatType: update.seatType ?? current.seatType,
      gender: update.gender ?? current.gender,
      ranks,
    };
    window.localStorage.setItem(SEAT_STORAGE_KEY, JSON.stringify(memory));
  } catch {
    // Without storage the choice still applies on this page.
  }
}

export function JeeYearExplorer({
  exam,
  year,
  years,
  collegePath,
  data,
  initial,
}: {
  exam: JeeExamId;
  year: number;
  years: number[];
  collegePath: string;
  data: JeeYearData;
  initial: CutoffSelection;
}) {
  const router = useRouter();
  const yearPath = `${collegePath}/cutoffs/${year}`;
  const rows = useMemo(
    () =>
      data.rows.map(([program, pool, round, opening, closing]) => ({
        program,
        pool: data.pools[pool],
        round,
        opening,
        closing,
      })),
    [data],
  );

  const [slice, setSlice] = useState<Slice>(() => ({
    body: initial.body,
    round: initial.round,
    quota: initial.quota,
    gender: initial.gender,
    seatType: initial.seatType,
  }));
  const [openId, setOpenId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("grid");
  const [sort, setSort] = useState<Sort>("rank");
  const [query, setQuery] = useState("");
  const [rankText, setRankText] = useState("");
  const [onlyCleared, setOnlyCleared] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const rankId = useId();

  // Every choice cascades from the data this college published, so no combination is empty.
  const resolve = (next: Partial<Slice>): Slice => {
    const body = pick<CounsellingBody>(
      next.body,
      ordered(
        rows.map((row) => row.pool.body),
        ["josaa", "csab"],
      ) as CounsellingBody[],
      ["josaa"],
    );
    const bodyRows = rows.filter((row) => row.pool.body === body);
    const rounds = [...new Set(bodyRows.map((row) => row.round))].sort(
      (a, b) => a - b,
    );
    const round = pick(next.round, rounds, [rounds.at(-1)!]);
    const roundRows = bodyRows.filter((row) => row.round === round);
    const quota = pick(
      next.quota,
      ordered(
        roundRows.map((row) => row.pool.quota),
        QUOTA_ORDER,
      ),
      QUOTA_ORDER,
    );
    const quotaRows = roundRows.filter((row) => row.pool.quota === quota);
    const gender = pick(
      next.gender,
      ordered(
        quotaRows.map((row) => row.pool.gender),
        GENDER_ORDER,
      ),
      GENDER_ORDER,
    );
    const genderRows = quotaRows.filter((row) => row.pool.gender === gender);
    const seatType = pick(
      next.seatType,
      ordered(
        genderRows.map((row) => row.pool.seatType),
        CATEGORY_ORDER,
      ),
      CATEGORY_ORDER,
    );
    return { body, round, quota, gender, seatType };
  };

  const writeHash = (
    next: Slice,
    nextOpen: string | null,
    nextMode: Mode,
    push: boolean,
  ) => {
    const params = new URLSearchParams({
      body: next.body,
      round: String(next.round),
      quota: next.quota,
      seatType: next.seatType,
      gender: next.gender,
    });
    if (nextOpen) params.set("offering", nextOpen);
    if (nextMode === "seat") params.set("view", "seat");
    history[push ? "pushState" : "replaceState"](
      null,
      "",
      `${location.pathname}#${params}`,
    );
  };

  const update = (next: Partial<Slice>) => {
    // A new counselling body starts from its latest round, as the published lists do.
    const resolved = resolve({
      ...slice,
      ...next,
      ...(next.body && next.body !== slice.body ? { round: undefined } : {}),
    });
    setSlice(resolved);
    if (next.seatType || next.gender) {
      writeSeatMemory(exam, {
        seatType: resolved.seatType,
        gender: resolved.gender,
      });
      setRankText(readSeatMemory()[exam]?.ranks?.[resolved.seatType] ?? "");
    }
    writeHash(resolved, openId, mode, true);
  };

  useEffect(() => {
    const fromHash = () => {
      const hash = new URLSearchParams(location.hash.slice(1));
      return {
        hasSeat: hash.has("seatType") || hash.has("gender"),
        slice: resolve({
          body: (hash.get("body") as CounsellingBody | null) ?? undefined,
          round: Number(hash.get("round")) || undefined,
          quota: hash.get("quota") ?? undefined,
          gender: hash.get("gender") ?? undefined,
          seatType: hash.get("seatType") ?? undefined,
        }),
        open: hash.get("offering"),
        mode: hash.get("view") === "seat" ? ("seat" as const) : null,
      };
    };
    const memory = readSeatMemory()[exam];
    const state = fromHash();
    const restored = state.hasSeat
      ? state.slice
      : resolve({
          ...state.slice,
          seatType: memory?.seatType ?? state.slice.seatType,
          gender: memory?.gender ?? state.slice.gender,
        });
    setSlice(restored);
    setOpenId(state.open);
    setRankText(memory?.ranks?.[restored.seatType] ?? "");
    setMode(
      state.mode ??
        (window.localStorage.getItem(MODE_STORAGE_KEY) === "seat"
          ? "seat"
          : "grid"),
    );

    const onPopState = () => {
      const next = fromHash();
      setSlice(next.slice);
      setOpenId(next.open);
      if (next.mode) setMode(next.mode);
    };
    const focusSearch = (event: KeyboardEvent) => {
      if (
        event.key !== "/" ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isTyping(event.target)
      )
        return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("popstate", onPopState);
    window.addEventListener("keydown", focusSearch);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("keydown", focusSearch);
    };
    // The fragment and saved seat are read once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bodies = ordered(
    rows.map((row) => row.pool.body),
    ["josaa", "csab"],
  ) as CounsellingBody[];
  const bodyRows = rows.filter((row) => row.pool.body === slice.body);
  const rounds = [...new Set(bodyRows.map((row) => row.round))].sort(
    (a, b) => a - b,
  );
  const roundRows = bodyRows.filter((row) => row.round === slice.round);
  const quotas = ordered(
    roundRows.map((row) => row.pool.quota),
    QUOTA_ORDER,
  );
  const quotaRows = roundRows.filter((row) => row.pool.quota === slice.quota);
  const genders = ordered(
    quotaRows.map((row) => row.pool.gender),
    GENDER_ORDER,
  );
  const sliceRows = quotaRows.filter((row) => row.pool.gender === slice.gender);
  const columns = ordered(
    sliceRows.map((row) => row.pool.seatType),
    CATEGORY_ORDER,
  );

  const cells = new Map<number, Map<string, Cell>>();
  for (const row of sliceRows) {
    let programCells = cells.get(row.program);
    if (!programCells) cells.set(row.program, (programCells = new Map()));
    programCells.set(row.pool.seatType, {
      opening: row.opening,
      closing: row.closing,
      pool: row.pool,
    });
  }

  const score = parseRank(rankText);
  const rankInvalid = rankText.trim() !== "" && !score;
  const search = query.trim().toLocaleLowerCase("en-IN");
  const listed = [...cells.keys()].map((index) => {
    const program = data.programs[index];
    const cell = cells.get(index)!.get(slice.seatType) ?? null;
    const paperTwo = PAPER_TWO.test(program.degree);
    const verdict =
      cell && !paperTwo
        ? compareMhtCetScore({ rankValue: cell.closing }, score)
        : null;
    const matches =
      !search ||
      `${program.name} ${program.degree}`
        .toLocaleLowerCase("en-IN")
        .includes(search);
    return {
      index,
      program,
      cell,
      paperTwo,
      verdict,
      visible:
        matches &&
        (mode === "grid" || cell !== null) &&
        (!onlyCleared || verdict?.status === "cleared"),
    };
  });
  listed.sort((a, b) => {
    if (sort === "rank") {
      if (a.paperTwo !== b.paperTwo) return a.paperTwo ? 1 : -1;
      if (a.cell && b.cell && a.cell.closing !== b.cell.closing)
        return a.cell.closing - b.cell.closing;
      if (a.cell && !b.cell) return -1;
      if (!a.cell && b.cell) return 1;
    }
    return (
      a.program.name.localeCompare(b.program.name, "en") ||
      a.program.degree.localeCompare(b.program.degree, "en")
    );
  });

  const visibleCount = listed.filter((row) => row.visible).length;
  const published = listed.filter((row) => row.cell);
  const compared = published.filter((row) => row.verdict);
  const clearedCount = compared.filter(
    (row) => row.verdict?.status === "cleared",
  ).length;
  // Category ranks run on different scales, so each column is shaded against itself.
  const columnRanks = new Map(
    columns.map((column) => [
      column,
      [...cells.values()].map(
        (programCells) => programCells.get(column)?.closing,
      ),
    ]),
  );

  const programPath = (index: number) => {
    const slug = data.programs[index].slug;
    return slug ? `${yearPath}/programs/${slug}` : null;
  };
  const poolPath = (index: number, pool: YearPool) => {
    const base = programPath(index);
    return base && pool.suffix ? `${base}/${pool.suffix}` : null;
  };
  const degreeLine = (index: number) => {
    const { degree, years: duration } = data.programs[index];
    if (PAPER_TWO.test(degree))
      return `${degree} · ${duration} years · Paper 2 rank`;
    return degree === "B.Tech" && duration === 4
      ? null
      : `${degree} · ${duration} years`;
  };

  const chartFor = (index: number): CutoffChartPoint[] => {
    const maxRound = rounds.at(-1) ?? 1;
    const matching = bodyRows.filter(
      (row) =>
        row.program === index &&
        row.pool.quota === slice.quota &&
        row.pool.gender === slice.gender &&
        row.pool.seatType === slice.seatType,
    );
    return Array.from({ length: maxRound }, (_, offset) => {
      const row = matching.find((candidate) => candidate.round === offset + 1);
      return {
        label: `R${offset + 1}`,
        round: offset + 1,
        openingRank: row?.opening ?? null,
        closingRank: row?.closing ?? null,
      };
    });
  };

  const changeMode = (next: Mode) => {
    setMode(next);
    window.localStorage.setItem(MODE_STORAGE_KEY, next);
    writeHash(slice, openId, next, false);
  };
  const toggleProgram = (id: string) => {
    const next = openId === id ? null : id;
    setOpenId(next);
    writeHash(slice, next, mode, false);
  };
  const changeRank = (text: string) => {
    setRankText(text);
    writeSeatMemory(exam, { rank: [slice.seatType, text.trim()] });
    if (!text.trim()) setOnlyCleared(false);
  };

  const caption = `${bodyLabel(slice.body)} ${year} Round ${slice.round}, ${quotaLabel(slice.quota)} quota, ${genderLabel(slice.gender)}`;

  return (
    <div
      className="mht-cutoff-explorer jee-explorer"
      data-mode={mode}
      data-scored={score ? "" : undefined}
    >
      <div className="mht-xbar">
        <div className="mht-xbar-row">
          <div
            className="mht-score"
            data-filled={score ? "" : undefined}
            data-invalid={rankInvalid ? "" : undefined}
          >
            <div className="mht-score-field">
              <label className="mht-score-label" htmlFor={rankId}>
                Your {rankName(slice.seatType)} rank
              </label>
              <input
                id={rankId}
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={rankText}
                placeholder="e.g. 25000"
                aria-invalid={rankInvalid}
                onChange={(event) => changeRank(event.target.value)}
              />
              {rankText ? (
                <button
                  type="button"
                  className="mht-score-clear"
                  onClick={() => changeRank("")}
                >
                  <span aria-hidden="true">×</span>
                  <span className="mht-sr">Clear rank</span>
                </button>
              ) : null}
            </div>
          </div>
          <div className="mht-seat-pills">
            {columns.length > 1 ? (
              <MhtPill
                label="Category"
                value={slice.seatType}
                options={columns.map((column) => ({
                  value: column,
                  label: column,
                }))}
                onChange={(seatType) => update({ seatType })}
              />
            ) : null}
            {quotas.length > 1 ? (
              <MhtPill
                label="Quota"
                value={slice.quota}
                options={quotas.map((quota) => ({
                  value: quota,
                  label: quotaLabel(quota),
                }))}
                onChange={(quota) => update({ quota })}
              />
            ) : null}
            {genders.length > 1 ? (
              <MhtPill
                label="Seats"
                value={slice.gender}
                options={genders.map((gender) => ({
                  value: gender,
                  label: genderLabel(gender),
                }))}
                onChange={(gender) => update({ gender })}
              />
            ) : null}
            {years.length > 1 ? (
              <MhtPill
                label="Year"
                value={String(year)}
                options={years.map((value) => ({
                  value: String(value),
                  label: String(value),
                }))}
                onChange={(value) =>
                  router.push(`${collegePath}/cutoffs/${value}${location.hash}`)
                }
              />
            ) : null}
          </div>
        </div>
        <div className="mht-xbar-row">
          {bodies.length > 1 ? (
            <div className="mht-seg" role="group" aria-label="Counselling">
              {bodies.map((body) => (
                <button
                  key={body}
                  type="button"
                  aria-pressed={slice.body === body}
                  onClick={() => update({ body })}
                >
                  {bodyLabel(body)}
                </button>
              ))}
            </div>
          ) : null}
          <div className="mht-seg jee-rounds" role="group" aria-label="Round">
            <span aria-hidden="true">Round</span>
            {rounds.map((round) => (
              <button
                key={round}
                type="button"
                aria-pressed={slice.round === round}
                onClick={() => update({ round })}
              >
                {round}
              </button>
            ))}
          </div>
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
            <kbd className="mht-kbd" aria-hidden="true">
              /
            </kbd>
          </label>
          <div className="mht-xbar-tools">
            {score && mode === "seat" ? (
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
              <button
                type="button"
                aria-pressed={mode === "seat"}
                onClick={() => changeMode("seat")}
              >
                Your seat
              </button>
              <button
                type="button"
                aria-pressed={mode === "grid"}
                onClick={() => changeMode("grid")}
              >
                All categories
              </button>
            </div>
          </div>
        </div>
      </div>

      {rankInvalid ||
      (score && compared.length > 0) ||
      (search && visibleCount > 0) ? (
        <div className="mht-xstatus" aria-live="polite">
          {rankInvalid ? (
            <p className="mht-xstatus-error">
              Enter a whole-number rank, 1 or higher.
            </p>
          ) : null}
          {score && compared.length > 0 ? (
            <p className="mht-xstatus-main">
              Clears{" "}
              <strong>
                {clearedCount} of {compared.length}
              </strong>{" "}
              {compared.length === 1 ? "program" : "programs"}.
            </p>
          ) : null}
          {search && visibleCount > 0 ? (
            <p className="mht-xstatus-hint">
              {visibleCount} of {listed.length} match “{query.trim()}”
            </p>
          ) : null}
          {score && compared.length > 0 ? (
            <p className="mht-legend" aria-hidden="true">
              <span data-status="cleared">Cleared</span>
              <span data-status="close">Within 20%</span>
              <span data-status="short">Short</span>
            </p>
          ) : null}
        </div>
      ) : null}

      {visibleCount === 0 ? (
        <div className="mht-empty">
          <p>
            {search
              ? `No program matches “${query.trim()}”.`
              : `No ${slice.seatType} seats in this round.`}
          </p>
          <div className="mht-empty-actions">
            {search ? (
              <button
                type="button"
                className="mht-btn mht-btn-sm"
                onClick={() => setQuery("")}
              >
                Clear search
              </button>
            ) : onlyCleared ? (
              <button
                type="button"
                className="mht-btn mht-btn-sm"
                onClick={() => setOnlyCleared(false)}
              >
                Show every program
              </button>
            ) : (
              <button
                type="button"
                className="mht-btn mht-btn-sm"
                onClick={() => changeMode("grid")}
              >
                All categories
              </button>
            )}
          </div>
        </div>
      ) : null}

      {mode === "seat" ? (
        <table
          className="mht-compare jee-seat-table"
          hidden={visibleCount === 0}
        >
          <caption className="mht-sr">
            {slice.seatType} closing and opening ranks, {caption}
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="mht-c-program"
                aria-sort={sort === "name" ? "ascending" : "none"}
              >
                <button
                  type="button"
                  className="mht-sort"
                  onClick={() => setSort("name")}
                >
                  Program
                </button>
              </th>
              <th
                scope="col"
                className="mht-c-pct"
                aria-sort={sort === "rank" ? "ascending" : "none"}
              >
                <button
                  type="button"
                  className="mht-sort"
                  onClick={() => setSort("rank")}
                >
                  Closing
                </button>
              </th>
              <th scope="col" className="mht-c-rank">
                Opening
              </th>
              {score ? (
                <th scope="col" className="mht-c-you">
                  vs you
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {listed.map(({ index, program, cell, verdict, visible }) => {
              if (!cell) return null;
              const open = openId === program.id;
              const panelId = `program-${program.id}`;
              const programHref = programPath(index);
              const poolHref = poolPath(index, cell.pool);
              return (
                <Fragment key={program.id}>
                  <tr
                    className="mht-program-row"
                    data-status={verdict?.status}
                    data-open={open ? "" : undefined}
                    hidden={!visible}
                  >
                    <th scope="row" className="mht-c-program">
                      <button
                        type="button"
                        className="mht-program-toggle"
                        aria-expanded={open}
                        aria-controls={panelId}
                        onClick={() => toggleProgram(program.id)}
                      >
                        <span>
                          {program.name}
                          {degreeLine(index) ? (
                            <small className="jee-degree">
                              {degreeLine(index)}
                            </small>
                          ) : null}
                        </span>
                      </button>
                      {score ? (
                        <span className="mht-program-meta">
                          <Verdict verdict={verdict} />
                        </span>
                      ) : null}
                    </th>
                    <td className="mht-c-pct">
                      <strong>{formatRank(cell.closing)}</strong>
                      <span className="mht-inline-rank">
                        {formatRank(cell.opening)}
                      </span>
                    </td>
                    <td className="mht-c-rank">{formatRank(cell.opening)}</td>
                    {score ? (
                      <td className="mht-c-you">
                        <Verdict verdict={verdict} />
                      </td>
                    ) : null}
                  </tr>
                  <tr className="mht-compare-pools" hidden={!visible || !open}>
                    <td colSpan={score ? 4 : 3}>
                      {open ? (
                        <div className="mht-detail jee-detail" id={panelId}>
                          <div className="mht-detail-head">
                            <span>
                              {bodyLabel(slice.body)} ·{" "}
                              {quotaLabel(slice.quota)} · {slice.seatType} ·{" "}
                              {genderLabel(slice.gender)}
                            </span>
                            <span className="mht-detail-count jee-detail-links">
                              {programHref ? (
                                <Link href={programHref}>Program page</Link>
                              ) : null}
                              {poolHref ? (
                                <Link href={poolHref}>Seat pool page</Link>
                              ) : null}
                            </span>
                          </div>
                          <CutoffChart
                            points={chartFor(index)}
                            label={`${program.name} ${slice.seatType} ranks by round`}
                          />
                        </div>
                      ) : null}
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      ) : (
        <>
          {columns.length > 3 ? (
            <p className="mht-grid-hint" aria-hidden="true">
              Swipe sideways for every category.
            </p>
          ) : null}
          <div
            className="mht-grid-scroll"
            role="region"
            aria-label={`Closing ranks for every category, ${caption}`}
            tabIndex={0}
            hidden={visibleCount === 0}
          >
            <table
              className="mht-grid jee-grid"
              style={{ "--grid-cols": columns.length } as CSSProperties}
            >
              <caption className="mht-sr">
                Closing and opening ranks by category, {caption}
              </caption>
              <thead>
                <tr>
                  <th scope="col">
                    <button
                      type="button"
                      className="mht-sort"
                      aria-pressed={sort === "name"}
                      onClick={() => setSort(sort === "name" ? "rank" : "name")}
                    >
                      Program
                    </button>
                  </th>
                  {columns.map((column) => (
                    <th
                      key={column}
                      scope="col"
                      data-selected={column === slice.seatType ? "" : undefined}
                    >
                      <button
                        type="button"
                        className="mht-sort"
                        aria-pressed={column === slice.seatType}
                        title={`Sort by ${column} closing rank`}
                        onClick={() => {
                          setSort("rank");
                          if (column !== slice.seatType)
                            update({ seatType: column });
                        }}
                      >
                        {column.replace(" (PwD)", " PwD")}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {listed.map(({ index, program, visible }) => {
                  const programHref = programPath(index);
                  return (
                    <tr
                      key={program.id}
                      hidden={!visible}
                      data-current={openId === program.id ? "" : undefined}
                    >
                      <th scope="row">
                        {programHref ? (
                          <Link href={programHref}>{program.name}</Link>
                        ) : (
                          program.name
                        )}
                        {degreeLine(index) ? (
                          <small className="jee-degree">
                            {degreeLine(index)}
                          </small>
                        ) : null}
                      </th>
                      {columns.map((column) => {
                        const cell = cells.get(index)?.get(column) ?? null;
                        const selected = column === slice.seatType;
                        const verdict =
                          selected && cell && !PAPER_TWO.test(program.degree)
                            ? compareMhtCetScore(
                                { rankValue: cell.closing },
                                score,
                              )
                            : null;
                        const heat = cell
                          ? rankHeat(
                              cell.closing,
                              columnRanks.get(column) ?? [],
                            )
                          : null;
                        const href = cell ? poolPath(index, cell.pool) : null;
                        return (
                          <td
                            key={column}
                            data-selected={selected ? "" : undefined}
                            data-status={verdict?.status}
                            style={
                              heat === null
                                ? undefined
                                : ({ "--heat": heat } as CSSProperties)
                            }
                          >
                            {cell ? (
                              href ? (
                                <Link
                                  href={href}
                                  className="jee-cell"
                                  title={`${column}: opening ${formatRank(cell.opening)}, closing ${formatRank(cell.closing)}`}
                                >
                                  <span className="mht-grid-pct">
                                    {formatRank(cell.closing)}
                                  </span>
                                  <span className="mht-grid-rank">
                                    {formatRank(cell.opening)}
                                  </span>
                                </Link>
                              ) : (
                                <>
                                  <span className="mht-grid-pct">
                                    {formatRank(cell.closing)}
                                  </span>
                                  <span className="mht-grid-rank">
                                    {formatRank(cell.opening)}
                                  </span>
                                </>
                              )
                            ) : (
                              <span className="mht-na">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
