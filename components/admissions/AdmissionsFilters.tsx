"use client";

import { usePathname, useRouter } from "next/navigation";
import { ROUNDS_BY_YEAR } from "@/lib/mht-cet/state-cutoffs/config";

export default function AdmissionsFilters({
  year,
  round,
  years,
}: {
  year: number;
  round: number;
  years: number[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const yearOptions = years.length > 0 ? years : [year];
  const roundOptions = ROUNDS_BY_YEAR[year] ?? [round];
  const selectedRound = roundOptions.includes(round) ? round : roundOptions[0];

  function apply(nextYear: number, nextRound: number) {
    const allowed = ROUNDS_BY_YEAR[nextYear] ?? [1];
    const roundValue = allowed.includes(nextRound) ? nextRound : (allowed[0] ?? 1);
    const query = new URLSearchParams(window.location.search);
    query.set("year", String(nextYear));
    query.set("round", String(roundValue));
    const hash = window.location.hash;
    router.replace(`${pathname}?${query.toString()}${hash}`, { scroll: false });
  }

  return (
    <div className="mht-year-round">
      <label>
        <span className="cutoff-sr-table">Year</span>
        <select
          className="mht-toolbar-select mht-year-select"
          value={String(year)}
          onChange={(event) => apply(Number(event.target.value), round)}
        >
          {yearOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="cutoff-sr-table">Round</span>
        <select
          className="mht-toolbar-select mht-round-select"
          value={String(selectedRound)}
          onChange={(event) => apply(year, Number(event.target.value))}
        >
          {roundOptions.map((option) => (
            <option key={option} value={option}>{`R${option}`}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
