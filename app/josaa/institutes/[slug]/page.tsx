import { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getInstitute,
  getInstitutePageData,
  filterCutoffsForBranch,
} from "@/lib/josaa-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  MapPin,
  Globe,
  Calendar,
  Trophy,
  GraduationCap,
  TrendingDown,
  TrendingUp,
  ExternalLink,
  Table,
  GitCompare,
  BookOpen,
  Clock,
} from "lucide-react";
import JosaaCutoffChart from "@/components/josaa/CutoffChart";
import JosaaCutoffsTable from "@/components/josaa/CutoffsTable";
import JosaaBranchComparison from "@/components/josaa/BranchComparison";
import InstituteJsonLd from "@/components/josaa/InstituteJsonLd";
import { getBranchDisplayName } from "@/lib/formatBranchCode";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ year?: string; category?: string; gender?: string }>;
}

// Force dynamic rendering for PocketBase data fetching
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  // Uses React cache() - this call will be deduplicated with the page render
  const institute = await getInstitute(slug);

  if (!institute) {
    return {
      title: "Institute Not Found | JoSAA Cutoffs",
    };
  }

  const canonicalUrl = `https://deetnuts.com/josaa/institutes/${slug}`;

  return {
    title: `${institute.short_name} Cutoffs | JoSAA | DEETNUTS`,
    description: `View JoSAA cutoffs, branch comparisons, and historical trends for ${institute.name}. Find opening and closing ranks for all categories.`,
    keywords: [
      institute.short_name,
      institute.name,
      "JoSAA cutoffs",
      `${institute.short_name} cutoff`,
      "JEE Advanced",
      "JEE Main",
      "engineering admission",
    ],
    openGraph: {
      title: `${institute.short_name} JoSAA Cutoffs`,
      description: `Comprehensive cutoff data for ${institute.name}`,
      url: canonicalUrl,
      type: "website",
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

// Institute Info Card
function InstituteInfoCard({ institute }: { institute: any }) {
  const typeColors: Record<string, string> = {
    IIT: "bg-orange-200",
    NIT: "bg-blue-200",
    IIIT: "bg-green-200",
    GFTI: "bg-purple-200",
    CFTI: "bg-pink-200",
  };

  return (
    <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          {/* Institute Logo Placeholder */}
          <div
            className={`w-20 h-20 ${
              typeColors[institute.institute_type] || "bg-gray-200"
            } rounded-xl border-4 border-black flex items-center justify-center flex-shrink-0`}
          >
            <Building2 className="w-10 h-10" />
          </div>

          <div className="flex-grow">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge
                className={`${
                  typeColors[institute.institute_type] || "bg-gray-200"
                } text-black border-2 border-black`}
              >
                {institute.institute_type}
              </Badge>
              {institute.nirf_rank != null && institute.nirf_rank > 0 && (
                <Badge className="bg-yellow-200 text-black border-2 border-black">
                  <Trophy className="w-3 h-3 mr-1" />
                  NIRF #{institute.nirf_rank}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold mb-2 break-words">
              {institute.name}
            </h1>
            <p className="text-lg font-semibold text-gray-700 mb-4 break-words">
              {institute.short_name}
            </p>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {institute.city && institute.state && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {institute.city}, {institute.state}
                </div>
              )}
              {institute.established_year && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Est. {institute.established_year}
                </div>
              )}
              {institute.website && (
                <a
                  href={institute.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-blue-600 transition-colors"
                >
                  <Globe className="w-4 h-4 mr-1" />
                  Website <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Stats summary cards with animations
function StatsSummary({
  branches,
  yearsAvailable,
}: {
  branches: any[];
  yearsAvailable: number[];
}) {
  const stats = [
    {
      icon: GraduationCap,
      value: branches.length,
      label: "Programs",
      color: "bg-blue-100",
      iconBg: "bg-blue-200",
    },
    {
      icon: Calendar,
      value: yearsAvailable.length,
      label: "Years Data",
      color: "bg-green-100",
      iconBg: "bg-green-200",
    },
    {
      icon: TrendingDown,
      value: yearsAvailable[0],
      label: "Latest Year",
      color: "bg-orange-100",
      iconBg: "bg-orange-200",
    },
    {
      icon: Trophy,
      value: yearsAvailable[yearsAvailable.length - 1],
      label: "First Year",
      color: "bg-purple-100",
      iconBg: "bg-purple-200",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 mt-4">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className={`border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${stat.color}`}
        >
          <CardContent className="p-2 sm:p-3 flex items-center gap-2">
            <div
              className={`w-8 h-8 shrink-0 rounded-md ${stat.iconBg} flex items-center justify-center border border-black`}
            >
              <stat.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-bold tabular-nums leading-tight">
                {stat.value}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-600 truncate">
                {stat.label}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function InstituteContent({
  slug,
  year,
  category,
  gender,
}: {
  slug: string;
  year?: string;
  category?: string;
  gender?: string;
}) {
  // Use optimized data fetcher - single parallel fetch for all data
  const selectedYear = year ? parseInt(year) : undefined;
  const selectedCategory = category || "OPEN";
  const selectedGender = gender || "Gender-Neutral";

  const pageData = await getInstitutePageData(slug, {
    year: selectedYear,
    category: selectedCategory,
    gender: selectedGender,
  });

  if (!pageData) {
    notFound();
  }

  const {
    institute,
    branches,
    cutoffs: allCutoffs,
    yearsAvailable,
    lastRoundCutoffs,
  } = pageData;
  const actualSelectedYear = selectedYear || yearsAvailable[0];

  // Get trend data from pre-fetched cutoffs (no extra DB call!)
  let trendData: Array<{
    year: number;
    round: number;
    openingRank: number;
    closingRank: number;
  }> = [];
  if (branches.length > 0) {
    // Find CSE or first available branch
    const cseBranch =
      branches.find(
        (b) =>
          b.name.toLowerCase().includes("computer science") ||
          b.short_code.includes("CSE"),
      ) || branches[0];

    // Use the helper to filter from already-fetched data
    const branchId = (cseBranch as any).original_id || cseBranch.id;
    const rawTrendData = filterCutoffsForBranch(
      allCutoffs,
      branchId,
      selectedCategory,
      selectedGender,
    );

    // Convert snake_case to camelCase for chart compatibility
    trendData = rawTrendData.map((item) => ({
      year: item.year,
      round: item.round,
      openingRank: item.opening_rank,
      closingRank: item.closing_rank,
    }));
  }

  return (
    <>
      {/* Structured Data for SEO */}
      <InstituteJsonLd
        institute={institute}
        slug={slug}
        branchCount={branches.length}
      />

      {/* Institute Info */}
      <InstituteInfoCard institute={institute} />

      {/* Stats Summary */}
      <StatsSummary branches={branches} yearsAvailable={yearsAvailable} />

      {/* Tabs for different views */}
      <Tabs defaultValue="cutoffs" className="mt-8">
        <TabsList className="grid w-full grid-cols-3 mb-6 h-14 bg-white">
          <TabsTrigger
            value="cutoffs"
            className="h-11 text-base data-[state=active]:bg-blue-200 flex items-center justify-center gap-2"
          >
            <Table className="w-4 h-4" />
            <span className="hidden sm:inline">Cutoffs Table</span>
            <span className="sm:hidden">Cutoffs</span>
          </TabsTrigger>
          <TabsTrigger
            value="trends"
            className="h-11 text-base data-[state=active]:bg-green-200 flex items-center justify-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Trends Chart</span>
            <span className="sm:hidden">Trends</span>
          </TabsTrigger>
          <TabsTrigger
            value="compare"
            className="h-11 text-base data-[state=active]:bg-orange-200 flex items-center justify-center gap-2"
          >
            <GitCompare className="w-4 h-4" />
            <span className="hidden sm:inline">Branch Comparison</span>
            <span className="sm:hidden">Compare</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="cutoffs"
          className="animate-in fade-in-50 duration-300"
        >
          <JosaaCutoffsTable
            cutoffs={allCutoffs}
            branches={branches}
            yearsAvailable={yearsAvailable}
            defaultYear={actualSelectedYear}
            defaultCategory={selectedCategory}
            defaultGender={selectedGender}
            instituteId={institute.id}
          />
        </TabsContent>

        <TabsContent
          value="trends"
          className="animate-in fade-in-50 duration-300"
        >
          <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-gradient-to-br from-white to-green-50/30 overflow-hidden">
            <CardHeader className="border-b-2 border-black/10 bg-gradient-to-r from-green-100/50 to-emerald-100/50">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-green-200 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-lg font-bold">
                  Cutoff Trends Over Years
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <JosaaCutoffChart
                trendData={trendData}
                branches={branches}
                instituteId={institute.id}
                defaultCategory={selectedCategory}
                defaultGender={selectedGender}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="compare"
          className="animate-in fade-in-50 duration-300"
        >
          <JosaaBranchComparison
            cutoffs={lastRoundCutoffs}
            branches={branches}
            year={actualSelectedYear}
            category={selectedCategory}
            gender={selectedGender}
          />
        </TabsContent>
      </Tabs>

      {/* Branches List */}
      <Card className="mt-8 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-gradient-to-br from-white to-purple-50/30 overflow-hidden">
        <CardHeader className="border-b-2 border-black/10 bg-gradient-to-r from-purple-100/50 to-blue-100/50">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-purple-200 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold">Available Programs</span>
              <Badge variant="neutral" className="ml-3 text-sm font-bold">
                {branches.length} branches
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((branch, index) => (
              <Link
                key={branch.id}
                href={`/josaa/institutes/${slug}/${branch.id}`}
                className="group p-4 bg-white rounded-xl border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm leading-tight line-clamp-2 group-hover:text-blue-700 transition-colors">
                      {getBranchDisplayName(branch)}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge
                        variant="neutral"
                        className="text-xs font-semibold bg-purple-100 border-purple-300"
                      >
                        <BookOpen className="w-3 h-3 mr-1" />
                        {branch.degree_type}
                      </Badge>
                      <span className="text-xs text-gray-600 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {branch.duration_years} years
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// Loading skeleton with staggered animations
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="h-40 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-pulse relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-pulse relative overflow-hidden"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div
              className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent"
              style={{ animationDelay: `${i * 150}ms` }}
            />
            <div className="p-4 space-y-2">
              <div className="w-10 h-10 rounded-full bg-gray-300" />
              <div className="h-3 w-16 bg-gray-300 rounded" />
              <div className="h-5 w-20 bg-gray-300 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2 mb-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-10 w-24 bg-gray-200 rounded-lg border-2 border-black animate-pulse"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="h-96 bg-gradient-to-b from-gray-100 to-gray-200 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-pulse relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="p-6 space-y-4">
          <div className="h-8 w-48 bg-gray-300 rounded" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-12 bg-gray-300/50 rounded"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function InstitutePage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { year, category, gender } = await searchParams;

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
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
          <li
            className="px-3 py-1.5 bg-black text-white border-2 border-black font-bold truncate max-w-[200px] sm:max-w-xs"
            title={slug}
          >
            {slug}
          </li>
        </ol>
      </nav>

      <Suspense fallback={<LoadingSkeleton />}>
        <InstituteContent
          slug={slug}
          year={year}
          category={category}
          gender={gender}
        />
      </Suspense>
    </main>
  );
}
