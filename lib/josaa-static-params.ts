import { getInstitutes, getBranchesForInstitute } from "@/lib/josaa-client";

/**
 * Generate static params for institute pages
 * This enables static generation at build time for better performance
 */
export async function generateStaticParams() {
  try {
    const institutes = await getInstitutes();

    return institutes.map((institute) => ({
      slug: institute.slug,
    }));
  } catch (error) {
    console.error("Error generating static params for institutes:", error);
    return [];
  }
}

/**
 * Generate static params for branch pages
 * Returns all institute + branch combinations
 */
export async function generateBranchStaticParams() {
  try {
    const institutes = await getInstitutes();
    const params: { slug: string; branchCode: string }[] = [];

    // Process in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < institutes.length; i += batchSize) {
      const batch = institutes.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (institute) => {
          try {
            const branches = await getBranchesForInstitute(institute.id);
            branches.forEach((branch) => {
              params.push({
                slug: institute.slug,
                branchCode: encodeURIComponent(branch.code),
              });
            });
          } catch (error) {
            console.error(
              `Error fetching branches for ${institute.slug}:`,
              error,
            );
          }
        }),
      );
    }

    return params;
  } catch (error) {
    console.error("Error generating static params for branches:", error);
    return [];
  }
}

// Renamed alias for institute params
export const generateInstituteStaticParams = generateStaticParams;
