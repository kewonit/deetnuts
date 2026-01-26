import { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getFilterOptions } from "@/lib/josaa-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, TrendingDown, Lightbulb } from "lucide-react";
import JosaaSearchForm from "@/components/josaa/SearchForm";

export const metadata: Metadata = {
  title: "Search JoSAA Cutoffs | Find Your Best College",
  description:
    "Search JoSAA cutoffs by rank, category, and preferences. Find colleges where you can get admission based on your JEE rank.",
  keywords: [
    "JoSAA search",
    "JEE rank search",
    "college finder",
    "cutoff search",
    "engineering admission",
  ],
  openGraph: {
    title: "Search JoSAA Cutoffs | Find Your Best College",
    description: "Search JoSAA cutoffs by rank, category, and preferences.",
    url: "https://deetnuts.com/josaa/search",
    type: "website",
  },
  alternates: {
    canonical: "https://deetnuts.com/josaa/search",
  },
};

// Force dynamic rendering for PocketBase data fetching
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

async function SearchContent({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const filterOptions = await getFilterOptions();

  return (
    <JosaaSearchForm
      filterOptions={filterOptions}
      initialParams={searchParams}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-48 bg-gray-200 rounded-xl border-4 border-black animate-pulse" />
      <div className="h-96 bg-gray-200 rounded-xl border-4 border-black animate-pulse" />
    </div>
  );
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Breadcrumb */}
      <nav className="mb-6">
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
          <li className="px-3 py-1.5 bg-black text-white border-2 border-black font-bold">
            Search Cutoffs
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1 flex items-center">
          <Search className="w-7 h-7 mr-2" />
          Find Your Dream College
        </h1>
        <p className="text-gray-600 text-sm">
          Enter your JEE rank to discover colleges where you have a chance.
        </p>
      </div>

      {/* Compact Quick Tips - inline badges */}
      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
        <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300 font-medium">
          <Lightbulb className="w-3 h-3 mr-1" />
          Enter rank to see options
        </Badge>
        <Badge className="bg-blue-50 text-blue-700 border border-blue-200 font-medium">
          Use latest year for accuracy
        </Badge>
        <Badge className="bg-green-50 text-green-700 border border-green-200 font-medium">
          Later rounds have higher cutoffs
        </Badge>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <SearchContent searchParams={params} />
      </Suspense>

      {/* Collapsible Help Section - moved to bottom */}
      <details className="mt-10">
        <summary className="cursor-pointer text-sm font-semibold text-gray-600 hover:text-black mb-4">
          ℹ️ Need help understanding cutoffs?
        </summary>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-blue-50">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-700 space-y-1 px-4 pb-3">
              <p>
                <strong>OPEN:</strong> General (unreserved)
              </p>
              <p>
                <strong>EWS:</strong> Economically Weaker Section
              </p>
              <p>
                <strong>OBC-NCL:</strong> Other Backward Classes
              </p>
              <p>
                <strong>SC/ST:</strong> Scheduled Castes/Tribes
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-green-50">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center">
                <TrendingDown className="w-4 h-4 mr-2" />
                Reading Cutoffs
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-700 space-y-1 px-4 pb-3">
              <p>
                <strong>Opening:</strong> Best rank that got seat
              </p>
              <p>
                <strong>Closing:</strong> Last rank that got seat
              </p>
              <p>
                <strong>Target:</strong> Your rank ≤ closing rank
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-purple-50">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Seat Types (NITs)</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-700 space-y-1 px-4 pb-3">
              <p>
                <strong>AI:</strong> All India quota
              </p>
              <p>
                <strong>HS:</strong> Home State quota
              </p>
              <p>
                <strong>OS:</strong> Other State quota
              </p>
            </CardContent>
          </Card>
        </div>
      </details>
    </main>
  );
}
