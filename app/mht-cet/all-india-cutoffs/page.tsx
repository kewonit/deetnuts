import AllIndiaCutoffs from "./all-india-cutoffs";
import {
  allIndiaQueryString,
  DEFAULT_SORTING,
  EMPTY_FILTERS,
  type AllIndiaInitialPage,
} from "./query";
import { resolveAllIndiaSelection } from "@/lib/mht-cet/all-india/config";
import { ALL_INDIA_PER_PAGE, queryAllIndiaCutoffs } from "@/lib/mht-cet/all-india/query";

// The first page is rendered on the server so the list arrives complete. The
// data lives in PocketBase, which the build cannot reach, and the page is the
// same for every visitor, so it is cached at the edge instead.
export const dynamic = "force-dynamic";

export default async function AllIndiaCutoffsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string | string[]; round?: string | string[] }>;
}) {
  const params = await searchParams;
  const { year, round, collection } = resolveAllIndiaSelection(params.year, params.round);
  const query = {
    year,
    round,
    filters: EMPTY_FILTERS,
    sorting: DEFAULT_SORTING,
    page: 1,
    perPage: ALL_INDIA_PER_PAGE,
  };
  let initial: AllIndiaInitialPage | null = null;
  try {
    const key = allIndiaQueryString(query);
    initial = { key, ...(await queryAllIndiaCutoffs(collection, new URLSearchParams(key))) };
  } catch (error) {
    // The browser retries through the API.
    console.error("All India cutoffs first page failed:", error);
  }
  return <AllIndiaCutoffs initialYear={year} initialRound={round} initial={initial} />;
}
