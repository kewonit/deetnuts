import { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getFilterOptions } from "@/lib/josaa-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  Filter,
  TrendingDown,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import JosaaSearchForm from "@/components/josaa/SearchForm";

export const metadata: Metadata = {
  title: "Search JoSAA Cutoffs | Find Your Best College",
  description:
    "Search JoSAA cutoffs by rank, category, and preferences. Find colleges where you can get admission based on your JEE rank.",
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
          <li className="px-3 py-1.5 bg-black text-white border-2 border-black font-bold">
            Search Cutoffs
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center">
          <Search className="w-8 h-8 mr-3" />
          Find Your Dream College
        </h1>
        <p className="text-gray-600 max-w-2xl">
          Enter your JEE rank and preferences to discover colleges where you
          have a high chance of getting admission.
        </p>
      </div>

      {/* Quick Tips */}
      <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-yellow-100 mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Sparkles className="w-5 h-5 mr-2" />
            Pro Tips for Better Results
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700 space-y-2">
          <p>• Enter your expected rank to see colleges within your reach</p>
          <p>
            • Filter by institute type (IIT/NIT/IIIT) to narrow down options
          </p>
          <p>
            • Check multiple rounds - cutoffs usually increase in later rounds
          </p>
          <p>• Use the latest year&apos;s data for most accurate predictions</p>
        </CardContent>
      </Card>

      <Suspense fallback={<LoadingSkeleton />}>
        <SearchContent searchParams={params} />
      </Suspense>

      {/* Help Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Understanding Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-700 space-y-2">
            <p>
              <strong>OPEN:</strong> General category (unreserved)
            </p>
            <p>
              <strong>EWS:</strong> Economically Weaker Section (10%
              reservation)
            </p>
            <p>
              <strong>OBC-NCL:</strong> Other Backward Classes (27% reservation)
            </p>
            <p>
              <strong>SC/ST:</strong> Scheduled Castes/Tribes (15%/7.5%)
            </p>
          </CardContent>
        </Card>

        <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <TrendingDown className="w-5 h-5 mr-2" />
              Reading Cutoffs
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-700 space-y-2">
            <p>
              <strong>Opening Rank:</strong> Best rank that got this seat
            </p>
            <p>
              <strong>Closing Rank:</strong> Last rank that got this seat
            </p>
            <p>
              <strong>Your Target:</strong> Your rank should be ≤ closing rank
            </p>
            <p>
              <strong>Safe Margin:</strong> Add 10-15% buffer for safety
            </p>
          </CardContent>
        </Card>

        <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-purple-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              Seat Types (NITs)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-700 space-y-2">
            <p>
              <strong>AI (All India):</strong> Available to all states
            </p>
            <p>
              <strong>HS (Home State):</strong> Reserved for home state students
            </p>
            <p>
              <strong>OS (Other State):</strong> For students from other states
            </p>
            <p>Home state cutoffs are usually higher!</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
