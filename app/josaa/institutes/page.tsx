import { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getInstitutes, getInstitutesByType } from "@/lib/josaa-client";
import { InstituteType } from "@/lib/types/josaa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Building2,
  MapPin,
  Trophy,
  ArrowRight,
  Search,
  Filter,
} from "lucide-react";
import InstitutesFilter from "@/components/josaa/InstitutesFilter";

export const metadata: Metadata = {
  title: "All Institutes | JoSAA Cutoffs | DEETNUTS",
  description:
    "Browse all IITs, NITs, IIITs, and GFTIs participating in JoSAA counseling. View cutoffs and branch details.",
};

// Force dynamic rendering for PocketBase data fetching
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ type?: string; state?: string; q?: string }>;
}

// Institute card component
function InstituteCard({ institute }: { institute: any }) {
  const typeColors: Record<string, string> = {
    IIT: "bg-orange-200 hover:bg-orange-300",
    NIT: "bg-blue-200 hover:bg-blue-300",
    IIIT: "bg-green-200 hover:bg-green-300",
    GFTI: "bg-purple-200 hover:bg-purple-300",
    CFTI: "bg-pink-200 hover:bg-pink-300",
  };

  return (
    <Link
      href={`/josaa/institutes/${institute.short_name
        .toLowerCase()
        .replace(/\s+/g, "-")}`}
    >
      <Card
        className={`border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
          typeColors[institute.institute_type] || "bg-gray-100"
        } hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer h-full`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-white/50 rounded-lg border-2 border-black flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge className="bg-white/80 text-black border border-black text-xs">
                  {institute.institute_type}
                </Badge>
                {institute.nirf_rank != null &&
                  institute.nirf_rank > 0 &&
                  institute.nirf_rank <= 50 && (
                    <Badge className="bg-yellow-400 text-black border border-black text-xs">
                      <Trophy className="w-3 h-3 mr-1" />#{institute.nirf_rank}
                    </Badge>
                  )}
              </div>
              <h3 className="font-bold text-sm leading-tight mb-1 line-clamp-2">
                {institute.name}
              </h3>
              {(institute.city || institute.state) && (
                <div className="flex items-center text-xs text-gray-600 mt-2">
                  <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">
                    {[institute.city, institute.state]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

async function InstitutesContent({
  type,
  state,
  query,
}: {
  type?: string;
  state?: string;
  query?: string;
}) {
  const institutesByType = await getInstitutesByType();

  // Flatten all institutes
  let allInstitutes = Object.values(institutesByType).flat();

  // Apply filters
  if (type && type !== "all") {
    allInstitutes = allInstitutes.filter((i) => i.institute_type === type);
  }

  if (state) {
    allInstitutes = allInstitutes.filter((i) =>
      i.state?.toLowerCase().includes(state.toLowerCase())
    );
  }

  if (query) {
    const q = query.toLowerCase();
    allInstitutes = allInstitutes.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.short_name.toLowerCase().includes(q) ||
        i.city?.toLowerCase().includes(q) ||
        i.state?.toLowerCase().includes(q)
    );
  }

  // Get unique states for filter
  const allStates = [
    ...new Set(
      Object.values(institutesByType)
        .flat()
        .map((i) => i.state)
        .filter(Boolean)
    ),
  ].sort();

  // Group by type for display
  const groupedByType: Record<string, typeof allInstitutes> = {};
  allInstitutes.forEach((inst) => {
    if (!groupedByType[inst.institute_type]) {
      groupedByType[inst.institute_type] = [];
    }
    groupedByType[inst.institute_type].push(inst);
  });

  const typeOrder: InstituteType[] = ["IIT", "NIT", "IIIT", "GFTI", "CFTI"];
  const orderedTypes = typeOrder.filter((t) => groupedByType[t]?.length > 0);

  return (
    <>
      {/* Filters */}
      <InstitutesFilter
        states={allStates}
        currentType={type}
        currentState={state}
        currentQuery={query}
        counts={{
          IIT: institutesByType.IIT?.length || 0,
          NIT: institutesByType.NIT?.length || 0,
          IIIT: institutesByType.IIIT?.length || 0,
          GFTI: institutesByType.GFTI?.length || 0,
          CFTI: institutesByType.CFTI?.length || 0,
          all: Object.values(institutesByType).flat().length,
        }}
      />

      {/* Results count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-gray-600">
          Showing <span className="font-bold">{allInstitutes.length}</span>{" "}
          institutes
        </p>
      </div>

      {/* Institutes Grid */}
      {allInstitutes.length === 0 ? (
        <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-yellow-50">
          <CardContent className="p-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-semibold">No institutes found</p>
            <p className="text-gray-500 mt-2">
              Try adjusting your search or filters
            </p>
          </CardContent>
        </Card>
      ) : type && type !== "all" ? (
        // Single type view
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {allInstitutes.map((institute) => (
            <InstituteCard key={institute.id} institute={institute} />
          ))}
        </div>
      ) : (
        // Grouped view
        <div className="space-y-8">
          {orderedTypes.map((instituteType) => (
            <div key={instituteType}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center">
                  {instituteType}s
                  <Badge className="ml-2 bg-gray-200 text-black border border-black">
                    {groupedByType[instituteType].length}
                  </Badge>
                </h2>
                <Link
                  href={`/josaa/institutes?type=${instituteType}`}
                  className="text-sm text-blue-600 hover:underline flex items-center"
                >
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {groupedByType[instituteType].slice(0, 8).map((institute) => (
                  <InstituteCard key={institute.id} institute={institute} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-16 bg-gray-200 rounded-xl border-4 border-black animate-pulse" />
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <div className="h-8 w-32 bg-gray-200 rounded mb-4 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((j) => (
              <div
                key={j}
                className="h-32 bg-gray-200 rounded-xl border-4 border-black animate-pulse"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function InstitutesPage({ searchParams }: PageProps) {
  const { type, state, q } = await searchParams;

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
            Institutes
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">All Institutes</h1>
        <p className="text-gray-600">
          Browse IITs, NITs, IIITs, GFTIs and CFTIs participating in JoSAA
          counseling
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <InstitutesContent type={type} state={state} query={q} />
      </Suspense>
    </main>
  );
}
