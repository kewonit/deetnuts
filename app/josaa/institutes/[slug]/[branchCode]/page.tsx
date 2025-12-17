import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getInstitute,
  getBranchDetails,
  getCutoffTrends,
} from "@/lib/josaa-client";
import { CutoffChart } from "@/components/josaa/CutoffChart";
import { Badge } from "@/components/ui/badge";
import YearwiseCutoffs from "@/components/josaa/YearwiseCutoffs";
import {
  getBranchDisplayName,
  parseSpecializations,
} from "@/lib/formatBranchCode";
import { BranchJsonLd } from "@/components/josaa/InstituteJsonLd";

// Helper to get clean base branch name (without specializations)
function getCleanBranchName(name?: string): string {
  if (!name) return "Unknown";
  let baseName = name.trim();
  if (baseName.toLowerCase().endsWith(" with")) {
    baseName = baseName.slice(0, -5).trim();
  }
  return baseName;
}

interface PageProps {
  params: Promise<{ slug: string; branchCode: string }>;
  searchParams: Promise<{ year?: string; category?: string; gender?: string }>;
}

// Force dynamic rendering for PocketBase data fetching
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug, branchCode } = await params;
  const institute = await getInstitute(slug);

  if (!institute) {
    return { title: "Branch Not Found" };
  }

  const decodedBranchCode = decodeURIComponent(branchCode);

  // Get branch details for proper naming
  const branch = await getBranchDetails(institute.id, decodedBranchCode);
  const branchName = branch?.name || decodedBranchCode;
  const instituteName = institute.short_name || institute.code;

  return {
    title: `${branchName} at ${instituteName} - JoSAA Cutoffs`,
    description: `View JoSAA cutoff ranks for ${branchName} at ${institute.name}. Historical trends and admission data for all categories.`,
    openGraph: {
      title: `${branchName} - ${instituteName}`,
      description: `JoSAA cutoff trends and analysis for ${branchName} at ${instituteName}`,
    },
  };
}

export default async function BranchPage({ params, searchParams }: PageProps) {
  const { slug, branchCode } = await params;
  const search = await searchParams;

  const institute = await getInstitute(slug);

  if (!institute) {
    notFound();
  }

  const decodedBranchCode = decodeURIComponent(branchCode);

  // Get branch details and trends
  const [branch, trends] = await Promise.all([
    getBranchDetails(institute.id, decodedBranchCode),
    getCutoffTrends(institute.id, decodedBranchCode),
  ]);

  if (!branch) {
    notFound();
  }

  // Group trends by category
  const trendsByCategory = trends.reduce((acc, trend) => {
    const key = `${trend.category}-${trend.gender}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(trend);
    return acc;
  }, {} as Record<string, typeof trends>);

  // Get unique years and categories
  const years = [...new Set(trends.map((t) => t.year))].sort((a, b) => b - a);
  const categories = [...new Set(trends.map((t) => t.category))];

  return (
    <div className="min-h-screen bg-background">
      {/* Structured Data for SEO */}
      <BranchJsonLd
        institute={institute}
        branch={branch}
        instituteSlug={slug}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex flex-wrap items-center gap-2 text-sm">
            <li>
              <Link
                href="/josaa"
                className="px-3 py-1.5 bg-white border-2 border-black hover:bg-yellow-100 transition-colors duration-200 font-semibold"
              >
                JoSAA
              </Link>
            </li>
            <li className="text-gray-400 font-bold">/</li>
            <li>
              <Link
                href="/josaa/institutes"
                className="px-3 py-1.5 bg-white border-2 border-black hover:bg-blue-100 transition-colors duration-200 font-semibold"
              >
                Institutes
              </Link>
            </li>
            <li className="text-gray-400 font-bold">/</li>
            <li>
              <Link
                href={`/josaa/institutes/${slug}`}
                className="px-3 py-1.5 bg-white border-2 border-black hover:bg-green-100 transition-colors duration-200 font-semibold"
              >
                {institute.short_name || institute.code}
              </Link>
            </li>
            <li className="text-gray-400 font-bold">/</li>
            <li
              className="px-3 py-1.5 bg-black text-white border-2 border-black font-bold truncate max-w-[200px] sm:max-w-xs"
              title={getBranchDisplayName(branch)}
            >
              {getBranchDisplayName(branch, { showCount: true })}
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="inline-block px-3 py-1 text-sm font-bold bg-primary text-primary-foreground border-2 border-foreground mb-3">
            {institute.institute_type}
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2 break-words">
            {getCleanBranchName(branch.name)}
          </h1>
          <p className="text-lg text-muted-foreground mb-2 break-words">
            {institute.name}
          </p>
          <p className="text-sm text-muted-foreground break-words">
            {branch.short_code && (
              <>
                Branch Code:{" "}
                <span className="font-mono font-bold">{branch.short_code}</span>{" "}
                •{" "}
              </>
            )}
            {branch.degree_type && (
              <>
                Degree:{" "}
                <span className="font-semibold">{branch.degree_type}</span> •{" "}
              </>
            )}
            Duration:{" "}
            <span className="font-semibold">
              {branch.duration_years || 4} years
            </span>
          </p>

          {/* Specializations */}
          {(() => {
            const specs = parseSpecializations(branch.specializations).filter(
              (s) => !s.toLowerCase().includes("any of the listed")
            );
            if (specs.length === 0) return null;
            return (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-gray-700">
                  Specializations:
                </span>
                {specs.map((spec, index) => (
                  <Badge
                    key={index}
                    className="border-2 border-black bg-purple-100 text-black font-semibold px-3 py-1 shadow-[2px_2px_0_0_#000]"
                  >
                    {spec}
                  </Badge>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="border-2 border-black bg-red-100 p-2 sm:p-3 shadow-[2px_2px_0_0_#000] flex items-center gap-2">
            <div className="w-8 h-8 shrink-0 rounded-md bg-red-200 flex items-center justify-center border border-black">
              <span className="text-sm font-bold">#</span>
            </div>
            <div className="min-w-0">
              <div className="text-base sm:text-lg font-bold leading-tight">
                {years.length}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-600 truncate">
                Years
              </div>
            </div>
          </div>
          <div className="border-2 border-black bg-yellow-100 p-2 sm:p-3 shadow-[2px_2px_0_0_#000] flex items-center gap-2">
            <div className="w-8 h-8 shrink-0 rounded-md bg-yellow-200 flex items-center justify-center border border-black">
              <span className="text-sm font-bold">C</span>
            </div>
            <div className="min-w-0">
              <div className="text-base sm:text-lg font-bold leading-tight">
                {categories.length}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-600 truncate">
                Categories
              </div>
            </div>
          </div>
          <div className="border-2 border-black bg-orange-100 p-2 sm:p-3 shadow-[2px_2px_0_0_#000] flex items-center gap-2">
            <div className="w-8 h-8 shrink-0 rounded-md bg-orange-200 flex items-center justify-center border border-black">
              <span className="text-sm font-bold">Y</span>
            </div>
            <div className="min-w-0">
              <div className="text-base sm:text-lg font-bold leading-tight">
                {years[0] || "-"}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-600 truncate">
                Latest
              </div>
            </div>
          </div>
          <div className="border-2 border-black bg-green-100 p-2 sm:p-3 shadow-[2px_2px_0_0_#000] flex items-center gap-2">
            <div className="w-8 h-8 shrink-0 rounded-md bg-green-200 flex items-center justify-center border border-black">
              <span className="text-sm font-bold">D</span>
            </div>
            <div className="min-w-0">
              <div className="text-base sm:text-lg font-bold leading-tight">
                {trends.length}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-600 truncate">
                Data Points
              </div>
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="mb-8">
          <CutoffChart
            trends={trends}
            title={`${branch.name} - Cutoff Trends at ${
              institute.short_name || institute.code
            }`}
          />
        </div>

        {/* Interactive Historical Cutoffs Component */}
        <YearwiseCutoffs
          trends={trends}
          branchName={branch.name}
          instituteName={institute.short_name || institute.code}
        />

        {/* Related Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href={`/josaa/institutes/${slug}`}
            className="border-4 border-foreground bg-card p-6 shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
          >
            <h3 className="font-bold text-lg mb-2">← View All Branches</h3>
            <p className="text-sm text-muted-foreground">
              See all branches at {institute.code} with their cutoffs
            </p>
          </Link>

          <Link
            href={`/josaa/compare?institutes=${slug}`}
            className="border-4 border-foreground bg-card p-6 shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
          >
            <h3 className="font-bold text-lg mb-2">Compare Institutes →</h3>
            <p className="text-sm text-muted-foreground">
              Compare {decodedBranchCode} cutoffs across different institutes
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
