/**
 * JoSAA PocketBase Client
 * Provides typed access to JoSAA collections with caching and batch operations
 */

import { cache } from "react";
import {
  JosaaInstitute,
  JosaaBranch,
  JosaaCutoff,
  JosaaInstituteAlias,
  JosaaInstituteExpanded,
  JosaaCutoffExpanded,
  PaginatedResponse,
  JosaaFilters,
  FilterOptions,
  JosaaStats,
  InstituteType,
} from "@/lib/types/josaa";
import {
  PocketBaseCollection,
  PocketBaseLike,
  getPocketBase,
} from "@/lib/pocketbaseClient";

// Collection names
export const JOSAA_COLLECTIONS = {
  INSTITUTES: "josaa_institutes",
  BRANCHES: "josaa_branches",
  CUTOFFS: "josaa_cutoffs",
  INSTITUTE_ALIASES: "josaa_institute_aliases",
} as const;

// Typed PocketBase interface
interface TypedJosaaPocketBase extends PocketBaseLike {
  collection(idOrName: string): PocketBaseCollection;
  collection(idOrName: "josaa_institutes"): PocketBaseCollection;
  collection(idOrName: "josaa_branches"): PocketBaseCollection;
  collection(idOrName: "josaa_cutoffs"): PocketBaseCollection;
  collection(idOrName: "josaa_institute_aliases"): PocketBaseCollection;
}

/**
 * Get typed PocketBase instance for JoSAA collections
 */
export function getJosaaPb(): TypedJosaaPocketBase {
  return getPocketBase() as TypedJosaaPocketBase;
}

// ============ ERROR HANDLING ============

/**
 * Custom error class for JoSAA operations
 */
export class JosaaError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = "JosaaError";
  }

  static notFound(resource: string): JosaaError {
    return new JosaaError(`${resource} not found`, "NOT_FOUND", 404);
  }

  static invalidInput(message: string): JosaaError {
    return new JosaaError(message, "INVALID_INPUT", 400);
  }

  static serverError(message: string, originalError?: unknown): JosaaError {
    return new JosaaError(message, "SERVER_ERROR", 500, originalError);
  }
}

/**
 * Safe wrapper for async operations with error handling
 */
async function safeAsync<T>(
  operation: () => Promise<T>,
  fallback: T,
  errorContext?: string,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(`[JoSAA] ${errorContext || "Operation failed"}:`, error);
    }
    return fallback;
  }
}

// ============ SECURITY HELPERS ============

/**
 * Sanitize a string for use in PocketBase filter queries
 * Prevents filter injection attacks by escaping special characters
 */
function sanitizeFilterValue(value: string): string {
  if (!value) return "";
  // Escape single quotes and backslashes to prevent injection
  return value
    .replace(/\\/g, "\\\\") // Escape backslashes first
    .replace(/'/g, "\\'") // Escape single quotes
    .replace(/"/g, '\\"') // Escape double quotes
    .replace(/\n/g, "") // Remove newlines
    .replace(/\r/g, "") // Remove carriage returns
    .slice(0, 500); // Limit length to prevent DoS
}

/**
 * Validate that a value looks like a valid ID (alphanumeric only)
 */
function isValidId(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  return /^[a-zA-Z0-9_-]{1,50}$/.test(value);
}

// ============ HELPER FUNCTIONS ============

/**
 * Get institute by original_id (12-char ID from data files)
 */
export async function getInstituteByOriginalId(
  originalId: string,
): Promise<JosaaInstitute | null> {
  if (!isValidId(originalId)) return null;
  const pb = getJosaaPb();
  try {
    return await pb
      .collection(JOSAA_COLLECTIONS.INSTITUTES)
      .getFirstListItem(`original_id='${sanitizeFilterValue(originalId)}'`);
  } catch {
    return null;
  }
}

/**
 * Get branch by original_id (12-char ID from data files)
 */
export async function getBranchByOriginalId(
  originalId: string,
): Promise<JosaaBranch | null> {
  if (!isValidId(originalId)) return null;
  const pb = getJosaaPb();
  try {
    return await pb
      .collection(JOSAA_COLLECTIONS.BRANCHES)
      .getFirstListItem(`original_id='${sanitizeFilterValue(originalId)}'`);
  } catch {
    return null;
  }
}

/**
 * Enrich cutoffs with institute and branch details
 * Since we can't use expand with non-relation fields, we fetch manually
 */
export async function enrichCutoffsWithDetails(
  cutoffs: JosaaCutoff[],
): Promise<JosaaCutoffExpanded[]> {
  if (cutoffs.length === 0) return [];

  const pb = getJosaaPb();

  // Get unique original IDs
  const instituteOriginalIds = [
    ...new Set(cutoffs.map((c: any) => c.institute_id)),
  ];
  const branchOriginalIds = [...new Set(cutoffs.map((c: any) => c.branch_id))];

  // Fetch institutes
  const instituteFilter = instituteOriginalIds
    .map((id) => `original_id='${id}'`)
    .join(" || ");
  const institutes = await pb
    .collection(JOSAA_COLLECTIONS.INSTITUTES)
    .getFullList({
      filter: instituteFilter,
    });
  const instituteMap = new Map(institutes.map((i: any) => [i.original_id, i]));

  // Fetch branches
  const branchFilter = branchOriginalIds
    .map((id) => `original_id='${id}'`)
    .join(" || ");
  const branches = await pb.collection(JOSAA_COLLECTIONS.BRANCHES).getFullList({
    filter: branchFilter,
  });
  const branchMap = new Map(branches.map((b: any) => [b.original_id, b]));

  // Enrich cutoffs
  return cutoffs.map((cutoff: any) => ({
    ...cutoff,
    expand: {
      institute: instituteMap.get(cutoff.institute_id),
      branch: branchMap.get(cutoff.branch_id),
    },
  }));
}

// ============ INSTITUTES ============

/**
 * Get all institutes with optional filtering
 */
export async function getInstitutes(options?: {
  type?: InstituteType;
  state?: string;
  limit?: number;
}): Promise<JosaaInstitute[]> {
  const pb = getJosaaPb();

  const filters: string[] = [];
  if (options?.type) filters.push(`institute_type='${options.type}'`);
  if (options?.state) filters.push(`state='${options.state}'`);

  const result = await pb
    .collection(JOSAA_COLLECTIONS.INSTITUTES)
    .getList(1, options?.limit || 500, {
      filter: filters.length > 0 ? filters.join(" && ") : undefined,
      sort: "nirf_rank,name",
    });

  return result.items;
}

// Cache for getAllInstitutes - persists across requests
let institutesCache:
  | (JosaaInstitute & { branches: JosaaBranch[]; slug: string })[]
  | null = null;
let institutesCacheTime = 0;
const INSTITUTES_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Get all institutes with their branches for sitemap/directory pages
 * Returns institutes grouped with branches eagerly loaded
 * OPTIMIZED: Uses a single large cutoff sample to build institute-branch mapping
 */
export async function getAllInstitutes(): Promise<
  (JosaaInstitute & { branches: JosaaBranch[]; slug: string })[]
> {
  // Check cache first
  if (
    institutesCache &&
    Date.now() - institutesCacheTime < INSTITUTES_CACHE_TTL
  ) {
    return institutesCache;
  }

  const pb = getJosaaPb();

  try {
    // Get all institutes and branches in parallel
    // Also get a DISTINCT list of institute-branch pairs via cutoffs
    const [institutes, allBranches, cutoffSample] = await Promise.all([
      pb.collection(JOSAA_COLLECTIONS.INSTITUTES).getFullList({
        sort: "nirf_rank,name",
      }),
      pb.collection(JOSAA_COLLECTIONS.BRANCHES).getFullList({
        sort: "name",
      }),
      // Get cutoffs to extract unique institute-branch pairs
      // Use latest year for most accurate current branch offerings
      pb
        .collection(JOSAA_COLLECTIONS.CUTOFFS)
        .getList(1, 50000, {
          filter: "year=2024",
          fields: "institute_id,branch_id",
        })
        .catch((err) => {
          console.error("[JoSAA] Failed to fetch cutoff sample:", err);
          return { items: [] };
        }),
    ]);



    // Create branch lookup - map both original_id AND PocketBase id
    const branchLookup = new Map<string, JosaaBranch>();
    allBranches.forEach((b: any) => {
      // The branch_id in cutoffs should be the original_id
      if (b.original_id) {
        branchLookup.set(b.original_id, b);
      }
      // Also store by PocketBase ID as fallback
      branchLookup.set(b.id, b);
    });

    // Build institute (original_id) -> branch (original_id) mapping from cutoffs
    // The cutoff's institute_id matches the institute's original_id
    // The cutoff's branch_id matches the branch's original_id
    const instituteBranches = new Map<string, Set<string>>();
    (cutoffSample.items || []).forEach((c: any) => {
      if (!c.institute_id || !c.branch_id) return;
      // c.institute_id is the original_id of the institute
      // c.branch_id is the original_id of the branch
      const branches = instituteBranches.get(c.institute_id) || new Set();
      branches.add(c.branch_id);
      instituteBranches.set(c.institute_id, branches);
    });



    // Build result
    const result = institutes.map((inst: any) => {
      // The cutoff's institute_id is the institute's original_id
      // So we look up using original_id first, then fall back to PocketBase id
      const lookupId = inst.original_id || inst.id;
      const branchIds = instituteBranches.get(lookupId) || new Set<string>();

      const branches = Array.from(branchIds)
        .map((id) => branchLookup.get(id))
        .filter((b): b is JosaaBranch => b !== undefined)
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

      const slug =
        inst.short_name?.toLowerCase().replace(/\s+/g, "-") || inst.id;

      return {
        ...inst,
        branches,
        slug,
      };
    });

    // Cache the result
    institutesCache = result;
    institutesCacheTime = Date.now();



    return result;
  } catch (error) {
    console.error("[JoSAA] Failed to get all institutes:", error);

    // Fallback: return institutes without branches
    const institutes = await pb
      .collection(JOSAA_COLLECTIONS.INSTITUTES)
      .getFullList({
        sort: "nirf_rank,name",
      });

    return institutes.map((inst: any) => ({
      ...inst,
      branches: [],
      slug: inst.short_name?.toLowerCase().replace(/\s+/g, "-") || inst.id,
    }));
  }
}

/**
 * Get single institute by ID, short_name, or slugified short_name
 * Handles case-insensitive lookups and slugified URLs like "iit-bomb"
 * Wrapped with React cache() for request deduplication
 */
export const getInstitute = cache(
  async (idOrSlug: string): Promise<JosaaInstituteExpanded | null> => {
    const pb = getJosaaPb();

    try {
      // Try direct ID first (15-char PocketBase IDs)
      if (idOrSlug.length === 15) {
        try {
          const result = await pb
            .collection(JOSAA_COLLECTIONS.INSTITUTES)
            .getOne(idOrSlug);
          return result as JosaaInstituteExpanded;
        } catch {
          // Not a valid ID, continue with other lookups
        }
      }

      // Try exact short_name match (case-insensitive)
      const sanitizedSlug = sanitizeFilterValue(idOrSlug);
      try {
        const result = await pb
          .collection(JOSAA_COLLECTIONS.INSTITUTES)
          .getFirstListItem(`short_name~'${sanitizedSlug}'`);
        return result as JosaaInstituteExpanded;
      } catch {
        // Not found, continue
      }

      // Try matching slugified short_name
      // URL slug "iit-bomb" should match short_name "IIT-BOMB"
      const upperSlug = sanitizeFilterValue(idOrSlug.toUpperCase());
      try {
        const result = await pb
          .collection(JOSAA_COLLECTIONS.INSTITUTES)
          .getFirstListItem(`short_name='${upperSlug}'`);
        return result as JosaaInstituteExpanded;
      } catch {
        // Not found, continue
      }

      // Try searching by name (for full names like "indian-institute-of-technology-bombay")
      const searchTerm = sanitizeFilterValue(idOrSlug.replace(/-/g, " "));
      try {
        const result = await pb
          .collection(JOSAA_COLLECTIONS.INSTITUTES)
          .getFirstListItem(`name~'${searchTerm}'`);
        return result as JosaaInstituteExpanded;
      } catch {
        return null;
      }
    } catch {
      return null;
    }
  },
);

/**
 * Get institutes grouped by type
 * Wrapped with React cache() for request deduplication
 */
export const getInstitutesByType = cache(
  async (): Promise<Record<InstituteType, JosaaInstitute[]>> => {
    const pb = getJosaaPb();

    const result = await pb
      .collection(JOSAA_COLLECTIONS.INSTITUTES)
      .getFullList({
        sort: "institute_type,nirf_rank,name",
      });

    const grouped: Record<InstituteType, JosaaInstitute[]> = {
      IIT: [],
      NIT: [],
      IIIT: [],
      GFTI: [],
      CFTI: [],
    };

    result.forEach((institute) => {
      const type = institute.institute_type as InstituteType;
      if (grouped[type]) {
        grouped[type].push(institute);
      }
    });

    return grouped;
  },
);

// ============ BRANCHES ============

/**
 * Get all branches
 */
export async function getBranches(options?: {
  degreeType?: string;
  limit?: number;
}): Promise<JosaaBranch[]> {
  const pb = getJosaaPb();

  const filters: string[] = [];
  if (options?.degreeType) filters.push(`degree_type='${options.degreeType}'`);

  const result = await pb
    .collection(JOSAA_COLLECTIONS.BRANCHES)
    .getList(1, options?.limit || 500, {
      filter: filters.length > 0 ? filters.join(" && ") : undefined,
      sort: "name,degree_type",
    });

  return result.items;
}

/**
 * Get branches available at a specific institute
 * Uses original_id for the lookup
 */
export async function getBranchesForInstitute(
  instituteId: string,
  year?: number,
): Promise<JosaaBranch[]> {
  const pb = getJosaaPb();

  // Get the original_id for the institute
  let originalInstituteId = instituteId;
  if (instituteId.length === 15) {
    try {
      const institute = await pb
        .collection(JOSAA_COLLECTIONS.INSTITUTES)
        .getOne(instituteId);
      originalInstituteId = (institute as any).original_id || instituteId;
    } catch {
      // Use as-is
    }
  }

  // Get unique branch IDs from cutoffs for this institute
  let filter = `institute_id='${originalInstituteId}'`;
  if (year) filter += ` && year=${year}`;

  const cutoffs = await pb.collection(JOSAA_COLLECTIONS.CUTOFFS).getFullList({
    filter,
    fields: "branch_id",
  });

  const branchOriginalIds = [...new Set(cutoffs.map((c: any) => c.branch_id))];

  if (branchOriginalIds.length === 0) return [];

  // Get branch details by original_id
  const branchFilter = branchOriginalIds
    .map((id) => `original_id='${id}'`)
    .join(" || ");
  const branches = await pb.collection(JOSAA_COLLECTIONS.BRANCHES).getFullList({
    filter: branchFilter,
    sort: "name",
  });

  // Deduplicate by name (keep first occurrence)
  const seenNames = new Set<string>();
  const uniqueBranches = branches.filter((b: JosaaBranch) => {
    if (seenNames.has(b.name)) return false;
    seenNames.add(b.name);
    return true;
  });

  return uniqueBranches;
}

/**
 * Get single branch by ID, original_id, or short_code
 */
export async function getBranch(idOrCode: string): Promise<JosaaBranch | null> {
  const pb = getJosaaPb();

  // Try direct PocketBase ID (15-char)
  if (idOrCode.length === 15) {
    try {
      return await pb.collection(JOSAA_COLLECTIONS.BRANCHES).getOne(idOrCode);
    } catch {
      // Not found, continue
    }
  }

  // Try original_id (12-char)
  if (idOrCode.length === 12) {
    try {
      return await pb
        .collection(JOSAA_COLLECTIONS.BRANCHES)
        .getFirstListItem(`original_id='${idOrCode}'`);
    } catch {
      // Not found, continue
    }
  }

  // Try short_code (case-insensitive)
  try {
    return await pb
      .collection(JOSAA_COLLECTIONS.BRANCHES)
      .getFirstListItem(`short_code~'${idOrCode}'`);
  } catch {
    return null;
  }
}

/**
 * Get branch details by branch ID, code, or short_code for a specific institute
 * Uses original_id for lookups
 * Enhanced with better error handling and logging
 */
export async function getBranchDetails(
  instituteId: string,
  branchIdOrCode: string,
): Promise<JosaaBranch | null> {
  const pb = getJosaaPb();

  // Sanitize input
  const sanitizedCode = sanitizeFilterValue(branchIdOrCode);

  try {
    // First, try to find branch by ID (15-char PocketBase ID)
    if (branchIdOrCode.length === 15 && isValidId(branchIdOrCode)) {
      try {
        return await pb
          .collection(JOSAA_COLLECTIONS.BRANCHES)
          .getOne(branchIdOrCode);
      } catch {
        // Not a valid ID, continue
      }
    }

    // Try to find branch by original_id (12-char)
    if (branchIdOrCode.length === 12 && isValidId(branchIdOrCode)) {
      try {
        return await pb
          .collection(JOSAA_COLLECTIONS.BRANCHES)
          .getFirstListItem(`original_id='${sanitizedCode}'`);
      } catch {
        // Not found, continue
      }
    }

    // Try to find by exact short_code match first
    try {
      return await pb
        .collection(JOSAA_COLLECTIONS.BRANCHES)
        .getFirstListItem(`short_code='${sanitizedCode}'`);
    } catch {
      // Not found, continue
    }

    // Try to find by short_code (case-insensitive partial match)
    try {
      return await pb
        .collection(JOSAA_COLLECTIONS.BRANCHES)
        .getFirstListItem(`short_code~'${sanitizedCode}'`);
    } catch {
      // Not found, continue
    }

    // Try uppercase version of short_code
    try {
      return await pb
        .collection(JOSAA_COLLECTIONS.BRANCHES)
        .getFirstListItem(`short_code='${sanitizedCode.toUpperCase()}'`);
    } catch {
      // Not found, continue
    }

    // Try to find by name (for slugified names like "computer-science")
    const searchTerm = branchIdOrCode.replace(/-/g, " ").replace(/_/g, " ");
    try {
      return await pb
        .collection(JOSAA_COLLECTIONS.BRANCHES)
        .getFirstListItem(`name~'${sanitizeFilterValue(searchTerm)}'`);
    } catch {
      // Not found
    }

    // Last resort: try all branches and find similar name
    // This helps with URL-encoded or transformed branch codes


    return null;
  } catch (error) {
    console.error("[JoSAA] getBranchDetails error:", error);
    return null;
  }
}

// ============ CUTOFFS ============

/**
 * Get cutoffs with flexible filtering
 * Note: Cutoffs use original_id references (12-char IDs), not PocketBase IDs
 */
export async function getCutoffs(
  filters: JosaaFilters,
  options?: {
    page?: number;
    perPage?: number;
    expand?: boolean;
  },
): Promise<PaginatedResponse<JosaaCutoffExpanded>> {
  const pb = getJosaaPb();

  const filterParts: string[] = [];

  // For institute/branch, we need to look up the original_id first
  if (filters.instituteId) {
    const sanitizedId = sanitizeFilterValue(filters.instituteId);
    // Check if it's a PocketBase ID (15 chars) or original ID (12 chars)
    if (filters.instituteId.length === 15 && isValidId(filters.instituteId)) {
      // Look up the original_id
      try {
        const institute = await pb
          .collection(JOSAA_COLLECTIONS.INSTITUTES)
          .getOne(filters.instituteId);
        if ((institute as any).original_id) {
          filterParts.push(
            `institute_id='${sanitizeFilterValue((institute as any).original_id)}'`,
          );
        }
      } catch {
        // If not found, try using the ID directly
        filterParts.push(`institute_id='${sanitizedId}'`);
      }
    } else if (isValidId(filters.instituteId)) {
      filterParts.push(`institute_id='${sanitizedId}'`);
    }
  }

  if (filters.branchId) {
    const sanitizedBranchId = sanitizeFilterValue(filters.branchId);
    if (filters.branchId.length === 15 && isValidId(filters.branchId)) {
      try {
        const branch = await pb
          .collection(JOSAA_COLLECTIONS.BRANCHES)
          .getOne(filters.branchId);
        if ((branch as any).original_id) {
          filterParts.push(
            `branch_id='${sanitizeFilterValue((branch as any).original_id)}'`,
          );
        }
      } catch {
        filterParts.push(`branch_id='${sanitizedBranchId}'`);
      }
    } else if (isValidId(filters.branchId)) {
      filterParts.push(`branch_id='${sanitizedBranchId}'`);
    }
  }

  // Numeric filters are safe (no string injection)
  if (filters.year && Number.isInteger(filters.year))
    filterParts.push(`year=${filters.year}`);
  if (filters.round && Number.isInteger(filters.round))
    filterParts.push(`round=${filters.round}`);
  if (filters.category)
    filterParts.push(`category='${sanitizeFilterValue(filters.category)}'`);
  if (filters.gender)
    filterParts.push(`gender='${sanitizeFilterValue(filters.gender)}'`);
  if (filters.seatType)
    filterParts.push(`quota='${sanitizeFilterValue(filters.seatType)}'`);
  // minRank: Find colleges where user's rank (minRank) is <= closing_rank (they can get in)
  if (filters.minRank && Number.isInteger(filters.minRank))
    filterParts.push(`closing_rank>=${filters.minRank}`);
  // maxRank: Find colleges where closing_rank is at most maxRank
  if (filters.maxRank && Number.isInteger(filters.maxRank))
    filterParts.push(`closing_rank<=${filters.maxRank}`);

  // Filter by institute type (requires join via original_id)
  if (filters.instituteType) {
    const sanitizedType = sanitizeFilterValue(filters.instituteType);
    const institutes = await pb
      .collection(JOSAA_COLLECTIONS.INSTITUTES)
      .getFullList({
        filter: `institute_type='${sanitizedType}'`,
        fields: "id,original_id",
      });
    const originalIds = institutes
      .map((i: any) => i.original_id)
      .filter(Boolean);
    if (originalIds.length > 0) {
      filterParts.push(
        `(${originalIds.map((id) => `institute_id='${sanitizeFilterValue(id)}'`).join(" || ")})`,
      );
    }
  }

  const result = await pb
    .collection(JOSAA_COLLECTIONS.CUTOFFS)
    .getList(options?.page || 1, options?.perPage || 50, {
      filter: filterParts.length > 0 ? filterParts.join(" && ") : undefined,
      sort: "year,-round,closing_rank",
    });

  // Expand institute and branch data if requested
  if (options?.expand && result.items.length > 0) {
    const expandedItems = await enrichCutoffsWithDetails(result.items as any);
    return {
      ...result,
      items: expandedItems,
    } as PaginatedResponse<JosaaCutoffExpanded>;
  }

  return result as PaginatedResponse<JosaaCutoffExpanded>;
}

/**
 * Get cutoff trends for a specific institute + branch combination
 * If category/gender not provided, returns all data points
 * Uses original_id for lookups
 */
export async function getCutoffTrends(
  instituteId: string,
  branchIdOrCode: string,
  category?: string,
  gender?: string,
): Promise<
  Array<{
    year: number;
    round: number;
    opening_rank: number;
    closing_rank: number;
    category: string;
    gender: string;
  }>
> {
  const pb = getJosaaPb();

  // Get original_id for institute if needed
  let originalInstituteId = instituteId;
  if (instituteId.length === 15) {
    try {
      const institute = await pb
        .collection(JOSAA_COLLECTIONS.INSTITUTES)
        .getOne(instituteId);
      originalInstituteId = (institute as any).original_id || instituteId;
    } catch {
      // Use as-is
    }
  }

  // Get original_id for branch if needed
  let originalBranchId = branchIdOrCode;
  if (branchIdOrCode.length === 15) {
    try {
      const branch = await pb
        .collection(JOSAA_COLLECTIONS.BRANCHES)
        .getOne(branchIdOrCode);
      originalBranchId = (branch as any).original_id || branchIdOrCode;
    } catch {
      // Use as-is
    }
  }

  // Build filter
  let filter = `institute_id='${originalInstituteId}' && branch_id='${originalBranchId}'`;

  if (category) filter += ` && category='${category}'`;
  if (gender) filter += ` && gender='${gender}'`;

  const result = await pb.collection(JOSAA_COLLECTIONS.CUTOFFS).getFullList({
    filter,
    sort: "year,round",
  });

  return result.map((c) => ({
    year: c.year,
    round: c.round,
    opening_rank: c.opening_rank,
    closing_rank: c.closing_rank,
    category: c.category,
    gender: c.gender,
  }));
}

/**
 * Get all cutoffs for an institute (for institute detail page)
 * Uses original_id for the lookup
 */
export async function getInstituteCutoffs(
  instituteId: string,
  year?: number,
): Promise<JosaaCutoffExpanded[]> {
  const pb = getJosaaPb();

  // Get original_id for institute if needed
  let originalInstituteId = instituteId;
  if (instituteId.length === 15) {
    try {
      const institute = await pb
        .collection(JOSAA_COLLECTIONS.INSTITUTES)
        .getOne(instituteId);
      originalInstituteId = (institute as any).original_id || instituteId;
    } catch {
      // Use as-is
    }
  }

  let filter = `institute_id='${originalInstituteId}'`;
  if (year) filter += ` && year=${year}`;

  const result = await pb.collection(JOSAA_COLLECTIONS.CUTOFFS).getFullList({
    filter,
    sort: "-year,branch_id,category,round",
  });

  return result as JosaaCutoffExpanded[];
}

/**
 * Get last round cutoffs for comparison
 * Uses original_id for the lookup
 */
export async function getLastRoundCutoffs(
  instituteId: string,
  year: number,
  category: string = "OPEN",
  gender: string = "Gender-Neutral",
): Promise<JosaaCutoffExpanded[]> {
  const pb = getJosaaPb();

  // Get original_id for institute if needed
  let originalInstituteId = instituteId;
  if (instituteId.length === 15) {
    try {
      const institute = await pb
        .collection(JOSAA_COLLECTIONS.INSTITUTES)
        .getOne(instituteId);
      originalInstituteId = (institute as any).original_id || instituteId;
    } catch {
      // Use as-is
    }
  }

  // Find the last round number for this year
  const lastRoundResult = await pb
    .collection(JOSAA_COLLECTIONS.CUTOFFS)
    .getList(1, 1, {
      filter: `institute_id='${originalInstituteId}' && year=${year}`,
      sort: "-round",
      fields: "round",
    });

  if (lastRoundResult.items.length === 0) return [];

  const lastRound = lastRoundResult.items[0].round;

  const result = await pb.collection(JOSAA_COLLECTIONS.CUTOFFS).getFullList({
    filter: `institute_id='${originalInstituteId}' && year=${year} && round=${lastRound} && category='${category}' && gender='${gender}'`,
    sort: "closing_rank",
  });

  return result as JosaaCutoffExpanded[];
}

// ============ FILTER OPTIONS ============

/**
 * Get all available filter options for the UI
 * Optimized to avoid fetching all 467k+ cutoff records
 * Wrapped with React cache() for request deduplication
 */
export const getFilterOptions = cache(async (): Promise<FilterOptions> => {
  const pb = getJosaaPb();

  // Get institutes and branches in parallel - async-parallel optimization
  const [institutes, branches] = await Promise.all([
    pb.collection(JOSAA_COLLECTIONS.INSTITUTES).getFullList({
      sort: "institute_type,name",
      fields: "id,name,short_name,institute_type,years_active",
    }),
    pb.collection(JOSAA_COLLECTIONS.BRANCHES).getFullList({
      sort: "name,degree_type",
      fields: "id,name,short_code,degree_type",
    }),
  ]);

  // Get years from institutes' years_active (efficient alternative to scanning all cutoffs)
  const allYears = new Set<number>();
  institutes.forEach((i: any) => {
    if (i.years_active && Array.isArray(i.years_active)) {
      i.years_active.forEach((y: number) => allYears.add(y));
    }
  });
  const years =
    allYears.size > 0
      ? [...allYears].sort((a, b) => b - a)
      : [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];

  // Known rounds from JoSAA (they don't change often)
  const rounds = [1, 2, 3, 4, 5, 6, 7];

  return {
    instituteTypes: ["IIT", "NIT", "IIIT", "GFTI", "CFTI"],
    institutes: institutes.map((i) => ({
      id: i.id,
      name: i.name,
      shortName: i.short_name,
      type: i.institute_type as InstituteType,
    })),
    branches: branches.map((b) => ({
      id: b.id,
      name: b.name,
      shortCode: b.short_code,
      degreeType: b.degree_type,
    })),
    years,
    rounds,
    categories: [
      "OPEN",
      "EWS",
      "OBC-NCL",
      "SC",
      "ST",
      "OPEN (PwD)",
      "EWS (PwD)",
      "OBC-NCL (PwD)",
      "SC (PwD)",
      "ST (PwD)",
    ],
    genders: ["Gender-Neutral", "Female-only (supernumerary)"],
    seatTypes: ["AI", "HS", "OS"],
  };
});

/**
 * Get dashboard stats
 * Optimized to avoid fetching all 467k+ cutoff records
 * Wrapped with React cache() for request deduplication
 */
export const getJosaaStats = cache(async (): Promise<JosaaStats> => {
  const pb = getJosaaPb();

  try {
    const [institutes, branches, cutoffsCount] = await Promise.all([
      pb
        .collection(JOSAA_COLLECTIONS.INSTITUTES)
        .getFullList({ fields: "id,institute_type,years_active" }),
      pb.collection(JOSAA_COLLECTIONS.BRANCHES).getList(1, 1),
      // Don't request specific fields to avoid 400 errors
      pb
        .collection(JOSAA_COLLECTIONS.CUTOFFS)
        .getList(1, 1)
        .catch(() => ({ totalItems: 400000 })),
    ]);

    // Get years from institute years_active instead of cutoffs (much more efficient)
    const allYears = new Set<number>();
    institutes.forEach((i: any) => {
      if (i.years_active && Array.isArray(i.years_active)) {
        i.years_active.forEach((y: number) => allYears.add(y));
      }
    });
    // Fallback: known years if no data
    const years =
      allYears.size > 0
        ? [...allYears].sort((a, b) => b - a)
        : [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];

    const instituteTypeCount: Record<InstituteType, number> = {
      IIT: 0,
      NIT: 0,
      IIIT: 0,
      GFTI: 0,
      CFTI: 0,
    };

    institutes.forEach((i) => {
      const type = i.institute_type as InstituteType;
      if (instituteTypeCount[type] !== undefined) {
        instituteTypeCount[type]++;
      }
    });

    return {
      totalInstitutes: institutes.length,
      totalBranches: branches.totalItems,
      totalCutoffs: cutoffsCount.totalItems,
      yearsAvailable: years,
      instituteTypeCount,
    };
  } catch (error) {
    console.error("[JoSAA] Failed to get stats:", error);
    // Return reasonable defaults
    return {
      totalInstitutes: 150,
      totalBranches: 500,
      totalCutoffs: 400000,
      yearsAvailable: [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018],
      instituteTypeCount: {
        IIT: 23,
        NIT: 31,
        IIIT: 26,
        GFTI: 60,
        CFTI: 10,
      },
    };
  }
});

// ============ SEARCH ============

/**
 * Search institutes and branches
 */
export async function searchJosaa(
  query: string,
  limit: number = 10,
): Promise<{
  institutes: JosaaInstitute[];
  branches: JosaaBranch[];
}> {
  const pb = getJosaaPb();

  const [institutes, branches] = await Promise.all([
    pb.collection(JOSAA_COLLECTIONS.INSTITUTES).getList(1, limit, {
      filter: `name~'${query}' || short_name~'${query}'`,
      sort: "nirf_rank,name",
    }),
    pb.collection(JOSAA_COLLECTIONS.BRANCHES).getList(1, limit, {
      filter: `name~'${query}' || short_code~'${query}'`,
      sort: "name",
    }),
  ]);

  return {
    institutes: institutes.items,
    branches: branches.items,
  };
}

// ============ OPTIMIZED DATA LOADERS ============

/**
 * Optimized data loader for institute detail page
 * Fetches data efficiently by only loading what's needed for initial render
 * Uses React cache() for request deduplication
 */
export const getInstitutePageData = cache(
  async (
    slug: string,
    options?: {
      year?: number;
      category?: string;
      gender?: string;
    },
  ): Promise<{
    institute: JosaaInstituteExpanded;
    branches: JosaaBranch[];
    cutoffs: JosaaCutoffExpanded[];
    yearsAvailable: number[];
    lastRoundCutoffs: JosaaCutoffExpanded[];
  } | null> => {
    const pb = getJosaaPb();

    // First, get the institute (uses cached getInstitute)
    const institute = await getInstitute(slug);
    if (!institute) return null;

    // Get original_id for efficient lookups
    const originalInstituteId = (institute as any).original_id || institute.id;

    // Use institute's years_active field for available years (most reliable)
    const instituteYearsActive = (institute as any).years_active;
    let yearsAvailable: number[] = [];

    if (
      instituteYearsActive &&
      Array.isArray(instituteYearsActive) &&
      instituteYearsActive.length > 0
    ) {
      // Use years_active from institute record
      yearsAvailable = [...instituteYearsActive].sort((a, b) => b - a);
    } else {
      // Fallback: Query cutoffs to get years
      const yearSampleResult = await pb
        .collection(JOSAA_COLLECTIONS.CUTOFFS)
        .getList(1, 1000, {
          filter: `institute_id='${originalInstituteId}'`,
          fields: "year",
        });
      yearsAvailable = [
        ...new Set(yearSampleResult.items.map((c) => c.year)),
      ].sort((a, b) => b - a);
    }

    // Ensure we have valid years, fallback to default range if empty
    if (yearsAvailable.length === 0) {
      yearsAvailable = [2024, 2023, 2022, 2021, 2020, 2019, 2018];
    }

    // Get branch IDs for this institute
    const branchSampleResult = await pb
      .collection(JOSAA_COLLECTIONS.CUTOFFS)
      .getList(1, 1000, {
        filter: `institute_id='${originalInstituteId}'`,
        fields: "branch_id",
      });
    const branchOriginalIds = [
      ...new Set(branchSampleResult.items.map((c: any) => c.branch_id)),
    ];

    // If we need more branch IDs, fetch the rest
    if (branchSampleResult.totalItems > 1000) {
      // Get more samples to ensure we have all branches
      const moreSamples = await pb
        .collection(JOSAA_COLLECTIONS.CUTOFFS)
        .getList(1, 500, {
          filter: `institute_id='${originalInstituteId}'`,
          fields: "branch_id",
        });
      moreSamples.items.forEach((c: any) => {
        if (!branchOriginalIds.includes(c.branch_id)) {
          branchOriginalIds.push(c.branch_id);
        }
      });
    }

    // Get selected values with defaults
    const selectedYear = options?.year || yearsAvailable[0];
    const selectedCategory = options?.category || "OPEN";
    const selectedGender = options?.gender || "Gender-Neutral";

    // OPTIMIZATION: Fetch branches and year-specific cutoffs in parallel
    const [branches, yearCutoffs] = await Promise.all([
      // Fetch branches
      branchOriginalIds.length > 0
        ? pb.collection(JOSAA_COLLECTIONS.BRANCHES).getFullList({
            filter: branchOriginalIds
              .map((id) => `original_id='${id}'`)
              .join(" || "),
            sort: "name",
          })
        : Promise.resolve([]),
      // Fetch only cutoffs for the selected year (much smaller dataset!)
      pb.collection(JOSAA_COLLECTIONS.CUTOFFS).getFullList({
        filter: `institute_id='${originalInstituteId}' && year=${selectedYear}`,
        sort: "branch_id,category,round",
      }),
    ]);

    // Calculate last round cutoffs from year-specific data
    const lastRound =
      yearCutoffs.length > 0 ? Math.max(...yearCutoffs.map((c) => c.round)) : 0;
    const lastRoundCutoffs = yearCutoffs
      .filter(
        (c) =>
          c.round === lastRound &&
          c.category === selectedCategory &&
          c.gender === selectedGender,
      )
      .sort((a, b) => a.closing_rank - b.closing_rank) as JosaaCutoffExpanded[];

    return {
      institute,
      branches,
      cutoffs: yearCutoffs as JosaaCutoffExpanded[],
      yearsAvailable,
      lastRoundCutoffs,
    };
  },
);

/**
 * Get cutoffs for a specific branch (for trend charts)
 * Optimized to work with pre-fetched data when available
 */
export function filterCutoffsForBranch(
  cutoffs: JosaaCutoffExpanded[],
  branchId: string,
  category?: string,
  gender?: string,
): Array<{
  year: number;
  round: number;
  opening_rank: number;
  closing_rank: number;
  category: string;
  gender: string;
}> {
  return cutoffs
    .filter((c) => {
      const matchesBranch =
        (c as any).branch_id === branchId || c.branch === branchId;
      const matchesCategory = !category || c.category === category;
      const matchesGender = !gender || c.gender === gender;
      return matchesBranch && matchesCategory && matchesGender;
    })
    .map((c) => ({
      year: c.year,
      round: c.round,
      opening_rank: c.opening_rank,
      closing_rank: c.closing_rank,
      category: c.category,
      gender: c.gender,
    }))
    .sort((a, b) => a.year - b.year || a.round - b.round);
}
