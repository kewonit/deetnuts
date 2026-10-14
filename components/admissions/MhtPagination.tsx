"use client";

import MhtPill from "@/components/admissions/MhtPill";

type PageItem = number | "gap";

function pageItems(page: number, totalPages: number): PageItem[] {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const items: PageItem[] = [];
  for (const p of sorted) {
    const last = items.at(-1);
    if (typeof last === "number" && p - last > 1) items.push(p - last === 2 ? last + 1 : "gap");
    items.push(p);
  }
  return items;
}

export function MhtPagination({
  page,
  perPage,
  totalItems,
  onPageChange,
  perPageOptions,
  onPerPageChange,
  busy = false,
}: {
  page: number;
  perPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  perPageOptions?: number[];
  onPerPageChange?: (perPage: number) => void;
  busy?: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const from = totalItems === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, totalItems);

  return (
    <nav className="mht-pager" aria-label="Pagination" data-busy={busy ? "" : undefined}>
      <span className="mht-pager-range">
        {from.toLocaleString("en-IN")}–{to.toLocaleString("en-IN")} of {totalItems.toLocaleString("en-IN")}
      </span>
      {perPageOptions && onPerPageChange ? (
        <MhtPill
          label="Rows"
          value={String(perPage)}
          options={perPageOptions.map((option) => ({ value: String(option), label: String(option) }))}
          onChange={(next) => onPerPageChange(Number(next))}
        />
      ) : null}
      {totalPages > 1 ? (
        <div className="mht-pager-pages">
          <button
            type="button"
            className="mht-pager-step"
            aria-label="Previous page"
            disabled={page <= 1 || busy}
            onClick={() => onPageChange(page - 1)}
          >
            ‹
          </button>
          {pageItems(page, totalPages).map((item, index) =>
            item === "gap" ? (
              <span key={`gap-${index}`} className="mht-pager-gap" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                aria-current={item === page ? "page" : undefined}
                aria-label={`Page ${item}`}
                disabled={busy}
                onClick={() => onPageChange(item)}
              >
                {item}
              </button>
            ),
          )}
          <button
            type="button"
            className="mht-pager-step"
            aria-label="Next page"
            disabled={page >= totalPages || busy}
            onClick={() => onPageChange(page + 1)}
          >
            ›
          </button>
        </div>
      ) : null}
    </nav>
  );
}
