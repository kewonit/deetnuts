/**
 * JoSAA Type Definitions
 * Matches the PocketBase schema from scraped data
 */

// Institute types based on JoSAA categorization
export type InstituteType = 'IIT' | 'NIT' | 'IIIT' | 'GFTI' | 'CFTI';

// Degree types
export type DegreeType = 'B.Tech' | 'B.Arch' | 'B.Des' | 'B.Plan' | 'Dual Degree' | 'Integrated M.Tech' | 'Integrated M.Sc' | 'M.Tech' | 'M.Sc' | 'M.Des';

// Category types
export type CategoryType = 
  | 'OPEN' 
  | 'EWS' 
  | 'OBC-NCL' 
  | 'SC' 
  | 'ST' 
  | 'OPEN (PwD)' 
  | 'EWS (PwD)' 
  | 'OBC-NCL (PwD)' 
  | 'SC (PwD)' 
  | 'ST (PwD)';

// Gender types
export type GenderType = 'Gender-Neutral' | 'Female-only (supernumerary)';

// Seat type (for state quota NITs)
export type SeatType = 'AI' | 'HS' | 'OS';

// Base PocketBase record fields
interface BaseRecord {
  id: string;
  created: string;
  updated: string;
  collectionId: string;
  collectionName: string;
}

// Institute record
export interface JosaaInstitute extends BaseRecord {
  name: string;
  code: string; // e.g., "IITD" - short code for display
  short_name: string;
  slug: string; // URL-friendly identifier
  institute_type: InstituteType;
  state: string;
  city: string;
  established_year?: number;
  nirf_rank?: number;
  website?: string;
  logo_url?: string;
  years_active: number[];
  original_id?: string; // Original 12-char ID from data files
}

// Institute alias for fuzzy search
export interface JosaaInstituteAlias extends BaseRecord {
  institute: string; // Relation to josaa_institutes
  alias: string;
  is_official: boolean;
}

// Branch/Program record
export interface JosaaBranch extends BaseRecord {
  name: string;
  code: string; // Branch code like "CS101"
  short_code: string;
  degree_type: DegreeType;
  duration: number; // Duration in years
  duration_years: number;
  specializations: string[];
  years_active: number[];
  original_id?: string; // Original 12-char ID from data files
}

// Main cutoffs record
export interface JosaaCutoff extends BaseRecord {
  institute: string; // Relation to josaa_institutes (legacy, may not be set)
  institute_id: string; // Original 12-char ID from data files
  branch: string; // Relation to josaa_branches (legacy, may not be set)
  branch_id: string; // Original 12-char ID from data files
  branch_code: string; // Branch code for direct filtering
  year: number;
  round: number;
  category: CategoryType;
  gender: GenderType;
  seat_type?: SeatType;
  opening_rank: number;
  closing_rank: number;
  quota?: string;
  is_pwd?: boolean;
  source?: string;
}

// Expanded versions for API responses
export interface JosaaInstituteExpanded extends JosaaInstitute {
  expand?: {
    aliases?: JosaaInstituteAlias[];
  };
}

export interface JosaaCutoffExpanded extends JosaaCutoff {
  expand?: {
    institute?: JosaaInstitute;
    branch?: JosaaBranch;
  };
}

// API response types
export interface PaginatedResponse<T> {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: T[];
}

// Filter state for the UI
export interface JosaaFilters {
  instituteType?: InstituteType;
  instituteId?: string;
  branchId?: string;
  year?: number;
  round?: number;
  category?: CategoryType;
  gender?: GenderType;
  seatType?: SeatType;
  minRank?: number;
  maxRank?: number;
}

// Chart data types
export interface CutoffTrendData {
  year: number;
  openingRank: number;
  closingRank: number;
  category: string;
}

export interface BranchComparisonData {
  branchName: string;
  branchShortCode: string;
  closingRank: number;
  openingRank: number;
}

// Stats for dashboard cards
export interface JosaaStats {
  totalInstitutes: number;
  totalBranches: number;
  totalCutoffs: number;
  yearsAvailable: number[];
  instituteTypeCount: Record<InstituteType, number>;
}

// Search result item
export interface SearchResultItem {
  type: 'institute' | 'branch';
  id: string;
  name: string;
  subtitle: string;
  instituteType?: InstituteType;
  degreeType?: DegreeType;
}

// Form options (for dropdowns)
export interface FilterOptions {
  instituteTypes: InstituteType[];
  institutes: Array<{ id: string; name: string; shortName: string; type: InstituteType }>;
  branches: Array<{ id: string; name: string; shortCode: string; degreeType: DegreeType }>;
  years: number[];
  rounds: number[];
  categories: CategoryType[];
  genders: GenderType[];
  seatTypes: SeatType[];
}
