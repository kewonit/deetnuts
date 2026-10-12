"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import MhtPill from "@/components/admissions/MhtPill";
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
  const [pending, startTransition] = useTransition();
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
    startTransition(() => {
      router.replace(`${pathname}?${query.toString()}${hash}`, { scroll: false });
    });
  }

  return (
    <div
      className="mht-year-round"
      data-pending={pending ? "" : undefined}
      aria-busy={pending}
    >
      <MhtPill
        label="Year"
        value={String(year)}
        options={yearOptions.map((option) => ({
          value: String(option),
          label: String(option),
        }))}
        onChange={(next) => apply(Number(next), round)}
      />
      <MhtPill
        label="Round"
        value={String(selectedRound)}
        options={roundOptions.map((option) => ({
          value: String(option),
          label: String(option),
        }))}
        onChange={(next) => apply(year, Number(next))}
      />
    </div>
  );
}
