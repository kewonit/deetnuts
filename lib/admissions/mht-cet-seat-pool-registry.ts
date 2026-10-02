import "server-only";

import { loadMhtCetSeatPoolRegistry } from "@ejam/data/mht-cet/eligibility";
import type { SeatPoolFacts } from "@/lib/admissions/mht-cet-seat-pool";

let byCode: Map<string, SeatPoolFacts> | null = null;

export function lookupMhtCetSeatPool(code: string): SeatPoolFacts | null {
  if (!byCode) {
    const loaded = new Map<string, SeatPoolFacts>();
    try {
      for (const entry of loadMhtCetSeatPoolRegistry().entries) {
        loaded.set(entry.source_code, {
          categoryId: entry.category_id,
          ladiesSeat: entry.ladies_seat,
          allocationScope: entry.allocation_scope,
          specialEligibility: entry.special_eligibility,
        });
      }
    } catch {
      byCode = loaded;
      return null;
    }
    byCode = loaded;
  }
  return byCode.get(code) ?? null;
}
