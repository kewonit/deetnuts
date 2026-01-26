import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getInstitutesByType, getJosaaStats } from "@/lib/josaa-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FAQJsonLd, { JOSAA_FAQS } from "@/components/FAQJsonLd";
import {
  Building2,
  GraduationCap,
  BarChart3,
  Calendar,
  TrendingDown,
  Search,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "JoSAA Cutoffs Explorer | DEETNUTS",
  description:
    "Explore JEE Main & Advanced cutoffs for IITs, NITs, IIITs and GFTIs. View historical trends, compare branches, and find your best college options.",
  keywords: [
    "JoSAA",
    "JEE Advanced cutoffs",
    "JEE Main cutoffs",
    "IIT cutoffs",
    "NIT cutoffs",
    "IIIT cutoffs",
    "GFTI cutoffs",
    "JoSAA counselling",
    "engineering admission",
  ],
  openGraph: {
    title: "JoSAA Cutoffs Explorer | DEETNUTS",
    description:
      "Comprehensive JoSAA cutoff data for IITs, NITs, IIITs and GFTIs with trend analysis.",
    url: "https://deetnuts.com/josaa",
    type: "website",
  },
  alternates: {
    canonical: "https://deetnuts.com/josaa",
  },
};

// Force dynamic rendering to avoid static generation issues with PocketBase
export const dynamic = "force-dynamic";

// Stats Card Component
function StatsCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card
      className={`border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${color}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">{title}</p>
            <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-white/50 rounded-xl border-2 border-black">
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Institute Type Card
function InstituteTypeCard({
  type,
  count,
  color,
  description,
}: {
  type: string;
  count: number;
  color: string;
  description: string;
}) {
  return (
    <Link href={`/josaa/institutes?type=${type}`}>
      <Card
        className={`border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${color} hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group`}
      >
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span className="text-2xl font-bold">{type}s</span>
            <Badge
              variant="neutral"
              className="bg-white/80 text-black border-2 border-black text-lg px-3"
            >
              {count}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4">{description}</p>
          <div className="flex items-center text-sm font-semibold group-hover:translate-x-1 transition-transform">
            View all {type}s <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Quick Action Card
function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
  color,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Link href={href}>
      <Card
        className={`border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${color} hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer h-full`}
      >
        <CardContent className="p-6 flex flex-col h-full">
          <div className="p-3 bg-white/50 rounded-xl border-2 border-black w-fit mb-4">
            <Icon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold mb-2">{title}</h3>
          <p className="text-gray-700 text-sm flex-grow">{description}</p>
          <div className="flex items-center text-sm font-semibold mt-4">
            Explore <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

async function JosaaContent() {
  const [stats, institutesByType] = await Promise.all([
    getJosaaStats(),
    getInstitutesByType(),
  ]);

  const typeDescriptions: Record<
    string,
    { color: string; description: string }
  > = {
    IIT: {
      color: "bg-orange-200",
      description:
        "Indian Institutes of Technology - Premier engineering institutes",
    },
    NIT: {
      color: "bg-blue-200",
      description:
        "National Institutes of Technology - Top government colleges",
    },
    IIIT: {
      color: "bg-green-200",
      description: "Indian Institutes of Information Technology - IT focused",
    },
    GFTI: {
      color: "bg-purple-200",
      description: "Government Funded Technical Institutes",
    },
    CFTI: {
      color: "bg-pink-200",
      description: "Centrally Funded Technical Institutes",
    },
  };

  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Institutes"
          value={stats.totalInstitutes}
          icon={Building2}
          color="bg-blue-100"
        />
        <StatsCard
          title="Branches/Programs"
          value={stats.totalBranches}
          icon={GraduationCap}
          color="bg-green-100"
        />
        <StatsCard
          title="Cutoff Records"
          value={stats.totalCutoffs}
          icon={BarChart3}
          color="bg-orange-100"
        />
        <StatsCard
          title="Years of Data"
          value={`${stats.yearsAvailable[stats.yearsAvailable.length - 1]}-${
            stats.yearsAvailable[0]
          }`}
          icon={Calendar}
          color="bg-purple-100"
        />
      </div>

      {/* Institute Types */}
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        <Building2 className="w-6 h-6 mr-2" />
        Browse by Institute Type
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {Object.entries(institutesByType).map(([type, institutes]) => (
          <InstituteTypeCard
            key={type}
            type={type}
            count={institutes.length}
            color={typeDescriptions[type]?.color || "bg-gray-100"}
            description={typeDescriptions[type]?.description || ""}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        <TrendingDown className="w-6 h-6 mr-2" />
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          title="Search Cutoffs"
          description="Find cutoffs by entering your JEE rank and preferences"
          href="/josaa/search"
          icon={Search}
          color="bg-yellow-100"
        />
        <QuickActionCard
          title="Compare Branches"
          description="Compare cutoff trends across different branches and institutes"
          href="/josaa/compare"
          icon={BarChart3}
          color="bg-cyan-100"
        />
        <QuickActionCard
          title="Trend Analysis"
          description="View historical cutoff trends and predictions"
          href="/josaa/trends"
          icon={TrendingDown}
          color="bg-rose-100"
        />
      </div>

      {/* Years Available */}
      <div className="mt-8 p-4 bg-gray-100 rounded-xl border-4 border-black">
        <h3 className="font-bold mb-2">Available Years:</h3>
        <div className="flex flex-wrap gap-2">
          {stats.yearsAvailable.map((year) => (
            <Badge
              key={year}
              variant="neutral"
              className="bg-white border-2 border-black text-lg px-3 py-1"
            >
              {year}
            </Badge>
          ))}
        </div>
      </div>
    </>
  );
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 bg-gray-200 rounded-xl border-4 border-black"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-40 bg-gray-200 rounded-xl border-4 border-black"
          />
        ))}
      </div>
    </div>
  );
}

export default function JosaaPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      {/* FAQ Schema for SEO */}
      <FAQJsonLd faqs={JOSAA_FAQS} />

      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          JoSAA Cutoffs Explorer
        </h1>
        <p className="text-lg text-gray-700 max-w-3xl mb-4">
          Explore comprehensive JEE Main & Advanced cutoff data for IITs, NITs,
          IIITs, and GFTIs. View historical trends, compare branches, and make
          informed decisions for your engineering journey.
        </p>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/josaa/all-colleges"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-200 border-4 border-black font-bold shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <Building2 className="w-5 h-5" />
            Browse All Colleges & Branches
          </Link>
          <Link
            href="/josaa/search"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-200 border-4 border-black font-bold shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <Search className="w-5 h-5" />
            Search Cutoffs
          </Link>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <JosaaContent />
      </Suspense>
    </main>
  );
}
