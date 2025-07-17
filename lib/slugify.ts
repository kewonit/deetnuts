export function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Function to normalize college codes for comparison (pad with leading zeros)
export function normalizeCollegeCode(code: string | number): string {
    return String(code).padStart(4, '0');
}

export function createCollegeSlug(collegeName: string, collegeId: string): string {
    const nameSlug = slugify(collegeName);
    // Normalize the college ID to ensure consistent formatting
    const normalizedId = normalizeCollegeCode(collegeId);
    return `${nameSlug}-${normalizedId}`;
}

export function parseCollegeSlug(slug: string): { id: string; name?: string; normalizedId?: string } {
    // Extract ID from the end of the slug (after the last hyphen)
    const lastHyphenIndex = slug.lastIndexOf('-');
    if (lastHyphenIndex === -1) {
        // If no hyphen found, assume the entire slug is the ID
        const normalizedId = normalizeCollegeCode(slug);
        return { id: slug, normalizedId };
    }

    const id = slug.substring(lastHyphenIndex + 1);
    const name = slug.substring(0, lastHyphenIndex);
    const normalizedId = normalizeCollegeCode(id);

    return { id, name, normalizedId };
}
