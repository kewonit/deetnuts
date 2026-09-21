"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FilterChip } from "@ejam/ui/components/predictor/filter-chip";
import type { CounsellingBody } from "@/lib/jee-cutoffs/types";

export type SeatPoolRow = {
  path: string;
  body: CounsellingBody;
  bodyLabel: string;
  quota: string;
  seatType: string;
  gender: string;
  genderLabel: string;
  latestRound: number;
  openingRank: number;
  closingRank: number;
  indexable: boolean;
};

const bodyOrder: CounsellingBody[] = ["josaa", "csab"];
const quotaOrder = ["AI", "OS", "HS"];
const categoryOrder = [
  "OPEN",
  "OPEN (PwD)",
  "EWS",
  "EWS (PwD)",
  "OBC-NCL",
  "OBC-NCL (PwD)",
  "SC",
  "SC (PwD)",
  "ST",
  "ST (PwD)",
];
const genderOrder = ["Gender-Neutral", "Female-only"];

function orderedValues(rows: SeatPoolRow[], key: "quota" | "seatType" | "genderLabel", order: string[]) {
  const values = [...new Set(rows.map((row) => row[key]).filter(Boolean))];
  return values.sort((left, right) => {
    const leftIndex = order.indexOf(left);
    const rightIndex = order.indexOf(right);
    if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right, "en");
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  });
}

function PoolFilter({
  label,
  values,
  active,
  onSelect,
}: {
  label: string;
  values: string[];
  active: string | null;
  onSelect: (value: string) => void;
}) {
  if (values.length < 2) return null;
  return (
    <div className="cutoff-pool-filter" role="group" aria-label={label}>
      <span>{label}</span>
      <div>
        {values.map((value) => (
          <FilterChip
            key={value}
            instant
            label={value}
            active={active === value}
            onClick={() => onSelect(value)}
          />
        ))}
      </div>
    </div>
  );
}

export function SeatPoolTable({
  profiles,
  offeringName,
  release,
}: {
  profiles: SeatPoolRow[];
  offeringName: string;
  release: string;
}) {
  const [quotaFilter, setQuotaFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [genderFilter, setGenderFilter] = useState<string | null>(null);

  const quotas = useMemo(() => orderedValues(profiles, "quota", quotaOrder), [profiles]);
  const categories = useMemo(() => orderedValues(profiles, "seatType", categoryOrder), [profiles]);
  const genders = useMemo(() => orderedValues(profiles, "genderLabel", genderOrder), [profiles]);

  const visible = useMemo(
    () =>
      profiles.filter((row) => {
        if (quotaFilter && row.quota !== quotaFilter) return false;
        if (categoryFilter && row.seatType !== categoryFilter) return false;
        if (genderFilter && row.genderLabel !== genderFilter) return false;
        return true;
      }),
    [profiles, quotaFilter, categoryFilter, genderFilter],
  );

  const bodies = bodyOrder.filter((body) => visible.some((row) => row.body === body));
  const showGroupHeadings = bodyOrder.filter((body) => profiles.some((row) => row.body === body)).length > 1;
  const showShortlist = quotas.length > 1 || categories.length > 1 || genders.length > 1;

  return (
    <div>
      {showShortlist ? (
        <div className="cutoff-pool-shortlist">
          <PoolFilter
            label="Quota"
            values={quotas}
            active={quotaFilter}
            onSelect={(quota) => setQuotaFilter((current) => (current === quota ? null : quota))}
          />
          <PoolFilter
            label="Category"
            values={categories}
            active={categoryFilter}
            onSelect={(category) => setCategoryFilter((current) => (current === category ? null : category))}
          />
          <PoolFilter
            label="Gender"
            values={genders}
            active={genderFilter}
            onSelect={(gender) => setGenderFilter((current) => (current === gender ? null : gender))}
          />
        </div>
      ) : null}
      {visible.length ? (
        bodies.map((body) => {
          const rows = visible.filter((row) => row.body === body);
          if (!rows.length) return null;
          return (
            <div className="cutoff-pool-group" key={body}>
              {showGroupHeadings ? <h3>{rows[0].bodyLabel}</h3> : null}
              <div className="cutoff-table-scroll">
                <table className="cutoff-table" data-release={release}>
                  <caption>
                    {showGroupHeadings ? `${rows[0].bodyLabel} seat pools` : `Seat pools`} for {offeringName}
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Quota</th>
                      <th scope="col">Category</th>
                      <th scope="col">Gender</th>
                      <th scope="col">Latest</th>
                      <th scope="col">Opening</th>
                      <th scope="col">Closing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.path}>
                        <th scope="row" data-label="Quota" data-field="quota">
                          {row.quota}
                        </th>
                        <td data-label="Category" data-field="category">
                          <Link
                            href={row.path}
                            aria-label={`${row.seatType}, ${row.quota} quota, ${row.genderLabel}${showGroupHeadings ? `, ${row.bodyLabel}` : ""}`}
                          >
                            {row.seatType}
                          </Link>
                          {row.indexable ? null : <small>One published round</small>}
                        </td>
                        <td data-label="Gender" data-field="gender">
                          {row.genderLabel}
                        </td>
                        <td data-label="Latest" data-field="latest-round">
                          {row.latestRound}
                        </td>
                        <td data-label="Opening" data-field="opening-rank">
                          {row.openingRank.toLocaleString("en-IN")}
                        </td>
                        <td data-label="Closing" data-field="closing-rank">
                          <strong>{row.closingRank.toLocaleString("en-IN")}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      ) : (
        <p className="cutoff-empty">No seat pools match this shortlist.</p>
      )}
    </div>
  );
}
