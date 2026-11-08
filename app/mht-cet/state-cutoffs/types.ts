// Types
export interface CutoffRecord {
  id: string;
  college_code: string;
  college_name: string;
  course_code: string;
  course_name: string;
  category: string;
  seat_allocation_section: string;
  cutoff_score: string;
  last_rank: string;
  total_admitted: number;
  status: string;
  home_university: string;
  institute_home_university_id?: string | null;
  affiliating_university_id?: string | null;
  minority_community_id?: string | null;
  created: string;
  updated: string;
  /**
   * Candidate-profile results show one row per college branch. The row is the
   * candidate's best route into the branch; these are the other seat pools
   * (other categories, or other intakes such as TFWS "T" or "E" choice codes)
   * that also match the profile.
   */
  alternative_pools?: AlternativeSeatPool[];
}

export interface AlternativeSeatPool {
  course_code: string;
  category: string;
  seat_allocation_section: string;
  last_rank: number;
  cutoff_score: number;
}

export interface CandidateProfileMetadata {
  ignoredRequestedCodes: string[];
  excludedUnmappedRows: number;
  stageSemanticsAvailable: false;
  /** Seat pools folded into another row of the same college branch. */
  collapsedSeatPools?: number;
}

export interface FilterState {
  search: string;
  categories: string[];
  courses: string[];
  statuses: string[];
  homeUniversities: string[];
  percentileInput: string;
  round: number;
  year: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export interface PendingFilters {
  search: string;
  categories: string[];
  courses: string[];
  statuses: string[];
  homeUniversities: string[];
  percentileInput: string;
  round: number;
  year: number;
}

export interface RoundOption {
  value: number;
  label: string;
  collection: string;
  description: string;
}

export interface CollectionConfig {
  [key: number]: {
    collection: string;
    displayName: string;
    description: string;
  };
}
