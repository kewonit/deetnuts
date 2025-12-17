/**
 * Format branch codes and degree types into more readable text
 * Handles edge cases for branch naming including specializations
 */

// Common branch code abbreviations
const branchAbbreviations: Record<string, string> = {
  // Engineering branches
  'CS': 'Computer Science',
  'CSE': 'Computer Science & Engineering',
  'CSAE': 'Computer Science & Artificial Intelligence',
  'AI': 'Artificial Intelligence',
  'ML': 'Machine Learning',
  'DS': 'Data Science',
  'IT': 'Information Technology',
  'ECE': 'Electronics & Communication',
  'EACE': 'Electronics & Communication',
  'EE': 'Electrical Engineering',
  'ME': 'Mechanical Engineering',
  'CE': 'Civil Engineering',
  'CH': 'Chemical Engineering',
  'AE': 'Aerospace Engineering',
  'PE': 'Petroleum Engineering',
  'IE': 'Industrial Engineering',
  'MME': 'Metallurgical & Materials',
  'MAME': 'Mineral & Metallurgical',
  'MNC': 'Mathematics & Computing',
  'EP': 'Engineering Physics',
  'BIO': 'Biotechnology',
  'AG': 'Applied Geology',
  'ENV': 'Environmental Engineering',
  'MT': 'M.Tech',
  'BS': 'B.S.',
  'MS': 'M.S.',
  'DD': 'Dual Degree',
  'INT': 'Integrated',
};

// Degree type full names
const degreeTypes: Record<string, string> = {
  'B.Tech': 'Bachelor of Technology',
  'M.Tech': 'Master of Technology',
  'B.S.': 'Bachelor of Science',
  'M.S.': 'Master of Science',
  'Dual Degree': 'Dual Degree Program',
  'Int. MBA': 'Integrated MBA',
  'Integrated Master of Technology': 'Int. M.Tech',
};

/**
 * Parse specializations from various input formats
 * Handles: JSON strings, arrays, comma-separated strings, null/undefined
 * @param specializations - Raw specializations input
 * @returns Array of specialization strings
 */
export function parseSpecializations(specializations: unknown): string[] {
  // Handle null/undefined
  if (specializations == null) return [];
  
  // Handle empty string
  if (specializations === '') return [];
  
  // Already an array
  if (Array.isArray(specializations)) {
    return specializations
      .filter((s): s is string => typeof s === 'string' && s.trim() !== '')
      .map(s => s.trim());
  }
  
  // Handle string inputs
  if (typeof specializations === 'string') {
    const trimmed = specializations.trim();
    
    // Empty string
    if (trimmed === '' || trimmed === '[]' || trimmed === 'null') return [];
    
    // Try parsing as JSON
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((s): s is string => typeof s === 'string' && s.trim() !== '')
            .map(s => s.trim());
        }
      } catch {
        // Not valid JSON, treat as regular string
      }
    }
    
    // Handle comma-separated values
    if (trimmed.includes(',')) {
      return trimmed
        .split(',')
        .map(s => s.trim())
        .filter(s => s !== '');
    }
    
    // Single value
    return [trimmed];
  }
  
  // Unknown type
  return [];
}

/**
 * Format a branch name with optional specialization(s)
 * Handles various edge cases and naming patterns
 * 
 * @param branchName - Base branch name (e.g., "Electrical Engineering")
 * @param specializations - Array of specializations or JSON string
 * @param options - Formatting options
 * @returns Formatted branch name with specialization if applicable
 */
export function formatBranchWithSpecialization(
  branchName: string,
  specializations: unknown,
  options: {
    /** If true, shows all specializations; if false, shows first only */
    showAll?: boolean;
    /** Maximum number of specializations to show */
    maxSpecializations?: number;
    /** Custom separator between branch and specialization */
    separator?: string;
    /** Whether to include "with" before specializations */
    includeWith?: boolean;
    /** Truncate long specialization names */
    maxLength?: number;
  } = {}
): string {
  const {
    showAll = false,
    maxSpecializations = 3,
    separator = ' - ',
    includeWith = true,
    maxLength,
  } = options;

  // Handle missing branch name
  if (!branchName || branchName.trim() === '') {
    return 'Unknown Branch';
  }

  const baseName = branchName.trim();
  const specs = parseSpecializations(specializations);

  // No specializations
  if (specs.length === 0) {
    return baseName;
  }

  // Filter out "any of the listed specializations" type entries
  const meaningfulSpecs = specs.filter(s => 
    !s.toLowerCase().includes('any of the listed') &&
    !s.toLowerCase().includes('any specialization')
  );

  if (meaningfulSpecs.length === 0) {
    return baseName;
  }

  // Format specialization string
  let specString: string;
  
  if (showAll && meaningfulSpecs.length > 1) {
    const displaySpecs = meaningfulSpecs.slice(0, maxSpecializations);
    const remaining = meaningfulSpecs.length - displaySpecs.length;
    
    specString = displaySpecs.join(', ');
    if (remaining > 0) {
      specString += ` (+${remaining} more)`;
    }
  } else {
    // Show only the first/primary specialization
    specString = meaningfulSpecs[0];
  }

  // Truncate if needed
  if (maxLength && specString.length > maxLength) {
    specString = specString.substring(0, maxLength - 3) + '...';
  }

  // Build the final string
  const withPrefix = includeWith ? 'with ' : '';
  return `${baseName}${separator}${withPrefix}${specString}`;
}

/**
 * Get a display-friendly branch name for UI
 * Optimized for cards, lists, and compact displays
 * 
 * @param branch - Branch object with name and specializations
 * @returns Formatted display name
 */
export function getBranchDisplayName(branch: {
  name?: string;
  short_code?: string;
  specializations?: unknown;
  degree_type?: string;
}, options?: { showCount?: boolean }): string {
  const { showCount = false } = options || {};
  const rawName = branch.name || formatBranchCode(branch.short_code || '') || 'Unknown';
  const specs = parseSpecializations(branch.specializations);
  
  // Filter out placeholder specializations
  const meaningfulSpecs = specs.filter(s => 
    !s.toLowerCase().includes('any of the listed') &&
    !s.toLowerCase().includes('any specialization')
  );
  
  // Clean up trailing "with" from the base name
  let baseName = rawName.trim();
  if (baseName.toLowerCase().endsWith(' with')) {
    baseName = baseName.slice(0, -5).trim();
  }
  
  if (meaningfulSpecs.length === 0) {
    return baseName;
  }
  
  // If showCount is true and there are 3+ specializations, show count
  if (showCount && meaningfulSpecs.length >= 3) {
    return `${baseName} (${meaningfulSpecs.length} specializations)`;
  }
  
  // For single specialization, show it inline with "with"
  if (meaningfulSpecs.length === 1) {
    return `${baseName} with ${meaningfulSpecs[0]}`;
  }
  
  // For 2 specializations, join with "&"
  if (meaningfulSpecs.length === 2) {
    return `${baseName} with ${meaningfulSpecs[0]} & ${meaningfulSpecs[1]}`;
  }
  
  // 3+ specializations - show all with commas and "or"
  const lastSpec = meaningfulSpecs[meaningfulSpecs.length - 1];
  const otherSpecs = meaningfulSpecs.slice(0, -1).join(', ');
  return `${baseName} with ${otherSpecs} or ${lastSpec}`;
}

/**
 * Format a branch short code into readable text
 * @param shortCode - Branch code like "CSAE-BT", "EE-MT"
 * @returns Formatted readable string
 */
export function formatBranchCode(shortCode: string): string {
  if (!shortCode) return '';
  
  // Remove special characters and split by common separators
  const parts = shortCode.split(/[-_\s]+/);
  
  return parts
    .map(part => {
      const upper = part.toUpperCase();
      return branchAbbreviations[upper] || part;
    })
    .join(' ');
}

/**
 * Get a shorter, more readable degree type
 * @param degreeType - Full degree type name
 * @returns Shortened version
 */
export function formatDegreeType(degreeType: string): string {
  if (!degreeType) return '';
  
  // Check if we have a short form
  return degreeTypes[degreeType] || degreeType;
}

/**
 * Format branch information for display
 * @param branchName - Full branch name
 * @param shortCode - Branch short code
 * @param degreeType - Degree type
 * @param specializations - Branch specializations
 * @returns Object with formatted text
 */
export function formatBranchInfo(
  branchName?: string,
  shortCode?: string,
  degreeType?: string,
  specializations?: unknown
) {
  const specs = parseSpecializations(specializations);
  const baseName = branchName || formatBranchCode(shortCode || '') || 'Unknown';
  
  return {
    name: baseName,
    displayName: getBranchDisplayName({ name: baseName, specializations }),
    fullName: specs.length > 0 
      ? formatBranchWithSpecialization(baseName, specs, { showAll: true })
      : baseName,
    code: shortCode ? formatBranchCode(shortCode) : null,
    degree: degreeType ? formatDegreeType(degreeType) : null,
    specializations: specs,
    hasSpecializations: specs.length > 0,
  };
}

/**
 * Format institute name for URL-friendly slug
 * @param name - Institute name
 * @returns URL-safe slug
 */
export function formatInstituteSlug(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Parse and validate a value that should be a positive number
 * Returns null if invalid/zero, to prevent rendering 0 in UI
 * @param value - Value to check
 * @returns The number if valid and positive, null otherwise
 */
export function parsePositiveNumber(value: unknown): number | null {
  if (value == null) return null;
  const num = typeof value === 'number' ? value : parseInt(String(value), 10);
  return !isNaN(num) && num > 0 ? num : null;
}
