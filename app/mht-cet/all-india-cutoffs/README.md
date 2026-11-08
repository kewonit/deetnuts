# MHT-CET All India cutoffs

`/mht-cet/all-india-cutoffs?year=2026&round=1` lists the closing All India merit
rank for every choice code in a CAP round (2026 Rounds 1-4, 2024 Rounds 1-3;
see `lib/mht-cet/all-india/config.ts`).

- `page.tsx` renders the first page on the server (`lib/mht-cet/all-india/query.ts`),
  so the list arrives complete. College names and page links are resolved there too.
- Year, round, filters, sorting and paging then load from
  `GET /api/mht-cet/all-india-cutoffs`, which takes the same `year`, `round`,
  `page`, `perPage`, `sort`, `search`, `branches`, `minPercentile`/`maxPercentile`,
  `minRank`/`maxRank` and `collegeName` parameters and is cached publicly, since
  published cutoffs only change on a data import.
- 2026 rows come from the institute-wise allotment lists
  (`scripts/scrape_mahacet_allotments.py`, `scripts/import-mahacet-2026-cap-rounds.ts`)
  and include admitted counts; `MI-AI` rows are minority seats released to All
  India candidates.
