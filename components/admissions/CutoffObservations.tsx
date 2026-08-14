import type { AdmissionsCutoffObservation } from "@/lib/admissions/types";

function formatNumber(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: digits,
  }).format(value);
}

export default function CutoffObservations({
  observations,
  limit,
}: {
  observations: AdmissionsCutoffObservation[];
  system: "mht-cet";
  limit?: number;
}) {
  const rowLimit = typeof limit === "number" ? limit : 100;
  const rows = typeof rowLimit === "number" ? observations.slice(0, rowLimit) : observations;

  if (rows.length === 0) {
    return (
      <div className="border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
        <p className="font-semibold text-slate-900">No comparable official cutoff rows</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Try another year, round, or exact seat pool. Missing data is not treated as a zero cutoff.
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className="overflow-x-auto lg:border lg:border-slate-200"
        tabIndex={0}
        role="region"
        aria-label="Scrollable cutoff observations table"
      >
        <table className="block w-full border-collapse text-left text-sm lg:table lg:min-w-[820px]">
          <thead className="sr-only lg:not-sr-only lg:sticky lg:top-16 lg:z-10 lg:table-header-group lg:bg-slate-100 lg:text-xs lg:uppercase lg:tracking-[0.08em] lg:text-slate-600">
            <tr>
              <th scope="col" className="px-4 py-3 font-bold">Program</th>
              <th scope="col" className="px-4 py-3 font-bold">Seat pool</th>
              <th scope="col" className="px-4 py-3 font-bold">Year / round</th>
              <th scope="col" className="px-4 py-3 text-right font-bold">Percentile</th>
              <th scope="col" className="px-4 py-3 text-right font-bold">Last rank</th>
            </tr>
          </thead>
          <tbody className="block space-y-3 lg:table-row-group lg:divide-y lg:divide-slate-200 lg:space-y-0 lg:bg-white">
            {rows.map((row) => (
              <tr
                key={row.id}
                className="relative grid grid-cols-2 gap-4 border border-slate-200 bg-white p-4 hover:bg-violet-50/50 lg:table-row lg:border-0 lg:p-0"
              >
                <th
                  scope="row"
                  className="col-span-2 min-w-0 pr-24 font-semibold text-slate-950 lg:table-cell lg:px-4 lg:py-3 lg:pr-4"
                >
                  {row.programName}
                  <span className="mt-0.5 block font-mono text-xs font-normal text-slate-500">
                    {row.programCode}
                  </span>
                </th>
                <td className="col-span-2 min-w-0 text-slate-700 lg:table-cell lg:px-4 lg:py-3">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 lg:hidden">
                    Seat pool
                  </span>
                  {[row.category, row.gender, row.quota || row.allocation]
                    .filter(Boolean)
                    .join(" · ")}
                </td>
                <td className="absolute right-4 top-4 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 lg:static lg:table-cell lg:bg-transparent lg:px-4 lg:py-3 lg:text-sm lg:font-normal">
                  {row.year} · Round {row.round}
                </td>
                <td className="min-w-0 font-semibold tabular-nums text-slate-950 lg:table-cell lg:px-4 lg:py-3 lg:text-right">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 lg:hidden">
                    Percentile
                  </span>
                  {formatNumber(row.percentileValue, 7)}
                </td>
                <td className="min-w-0 font-semibold tabular-nums text-slate-950 lg:table-cell lg:px-4 lg:py-3 lg:text-right">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 lg:hidden">
                    Last rank
                  </span>
                  {formatNumber(row.rankValue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rowLimit && observations.length > rowLimit && (
        <p className="mt-3 text-sm text-slate-500">
          Showing {rowLimit} of {observations.length} exact rows in this view.
        </p>
      )}
    </>
  );
}
