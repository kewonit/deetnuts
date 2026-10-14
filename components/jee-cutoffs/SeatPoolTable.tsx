"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import MhtPill from "@/components/admissions/MhtPill";
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

function orderedValues(
  rows: SeatPoolRow[],
  key: "quota" | "seatType" | "genderLabel",
  order: string[],
) {
  const values = [...new Set(rows.map((row) => row[key]).filter(Boolean))];
  return values.sort((left, right) => {
    const leftIndex = order.indexOf(left);
    const rightIndex = order.indexOf(right);
    if (leftIndex === -1 && rightIndex === -1)
      return left.localeCompare(right, "en");
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  });
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
  const [quota, setQuota] = useState("");
  const [category, setCategory] = useState("");
  const [gender, setGender] = useState("");

  const quotas = useMemo(
    () => orderedValues(profiles, "quota", quotaOrder),
    [profiles],
  );
  const categories = useMemo(
    () => orderedValues(profiles, "seatType", categoryOrder),
    [profiles],
  );
  const genders = useMemo(
    () => orderedValues(profiles, "genderLabel", genderOrder),
    [profiles],
  );

  const visible = profiles.filter(
    (row) =>
      (!quota || row.quota === quota) &&
      (!category || row.seatType === category) &&
      (!gender || row.genderLabel === gender),
  );
  const bodies = bodyOrder.filter((body) =>
    visible.some((row) => row.body === body),
  );
  const grouped =
    bodyOrder.filter((body) => profiles.some((row) => row.body === body))
      .length > 1;
  const filters = [
    { label: "Quota", value: quota, values: quotas, set: setQuota },
    {
      label: "Category",
      value: category,
      values: categories,
      set: setCategory,
    },
    { label: "Gender", value: gender, values: genders, set: setGender },
  ].filter((filter) => filter.values.length > 1);

  return (
    <>
      {filters.length ? (
        <div className="mht-dir-bar jee-pool-filters">
          {filters.map((filter) => (
            <MhtPill
              key={filter.label}
              label={filter.label}
              value={filter.value}
              emptyLabel="All"
              options={filter.values.map((value) => ({ value, label: value }))}
              onChange={filter.set}
            />
          ))}
        </div>
      ) : null}
      {visible.length ? (
        bodies.map((body) => {
          const rows = visible.filter((row) => row.body === body);
          return (
            <div className="jee-pool-group" key={body}>
              {grouped ? <h3>{rows[0].bodyLabel}</h3> : null}
              <div className="mht-card jee-table-scroll">
                <table className="mht-table jee-pools" data-release={release}>
                  <caption className="mht-sr">
                    {grouped ? `${rows[0].bodyLabel} seat pools` : "Seat pools"}{" "}
                    for {offeringName}
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Category</th>
                      <th scope="col">Quota</th>
                      <th scope="col">Gender</th>
                      <th scope="col" className="mht-num">
                        Round
                      </th>
                      <th scope="col" className="mht-num">
                        Opening
                      </th>
                      <th scope="col" className="mht-num">
                        Closing
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.path}>
                        <th scope="row" data-field="category">
                          <Link
                            href={row.path}
                            aria-label={`${row.seatType}, ${row.quota} quota, ${row.genderLabel}${grouped ? `, ${row.bodyLabel}` : ""}`}
                          >
                            {row.seatType}
                          </Link>
                        </th>
                        <td data-field="quota">{row.quota}</td>
                        <td data-field="gender">{row.genderLabel}</td>
                        <td className="mht-num" data-field="latest-round">
                          {row.latestRound}
                        </td>
                        <td className="mht-num" data-field="opening-rank">
                          {row.openingRank.toLocaleString("en-IN")}
                        </td>
                        <td className="mht-num" data-field="closing-rank">
                          <strong>
                            {row.closingRank.toLocaleString("en-IN")}
                          </strong>
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
        <div className="mht-card mht-dir-empty">
          <span>No seat pools match.</span>
          <button
            type="button"
            className="mht-btn mht-btn-sm"
            onClick={() => {
              setQuota("");
              setCategory("");
              setGender("");
            }}
          >
            Clear
          </button>
        </div>
      )}
    </>
  );
}
