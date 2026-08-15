import type { PredictionProvenance } from "@ejam/data";
import type {
  MhtCetCandidatureType,
  MhtCetCategoryId,
  MhtCetHomeUniversityId,
  MhtCetMinorityCommunityId,
  MhtCetPwdCategoryId,
} from "@ejam/data/mht-cet/browser";
import type { ResultsFilterState } from "@/components/predictor/results-filter-logic";
import type { ResultsSortKey } from "@/components/predictor/results-sort-logic";
import type {
  PredictorDisplayResult,
  PredictorExamId,
} from "@/lib/predictor-adapters";

export interface PredictorQueryOptions {
  predictorExamId: PredictorExamId;
  rank: string;
  apiSeatType: string;
  apiGender: string;
  quota: string;
  homeState: string;
  has_ews_certificate: boolean;
  include_all: boolean;
  mhtCandidatureType: MhtCetCandidatureType;
  mhtCategory: MhtCetCategoryId;
  mhtLadiesSeatEligible: boolean;
  mhtHomeUniversity: MhtCetHomeUniversityId | "";
  mhtTfwsEligible: boolean;
  mhtPwdCategory: MhtCetPwdCategoryId | "";
  mhtOrphanCertificate: boolean;
  mhtMinorityCommunity: MhtCetMinorityCommunityId | "";
  filters: ResultsFilterState;
  sortBy: ResultsSortKey;
  searchQuery: string;
}

export interface PredictorQueryResult {
  data: PredictorDisplayResult | null;
  provenance: PredictionProvenance | null;
  isLoading: boolean;
  isUpdating: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  error: string | null;
  nextPageError: string | null;
  resultKey: string;
  trigger: (
    rankOverride?: string,
    requestOverrides?: { include_all?: boolean },
  ) => Promise<boolean>;
  loadMore: () => Promise<void>;
}
