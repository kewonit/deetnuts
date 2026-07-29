import { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getAllInstitutes } from "@/lib/josaa-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, GraduationCap, MapPin, ChevronRight } from "lucide-react";
import { getBranchDisplayName } from "@/lib/formatBranchCode";
import { DirectoryJsonLd } from "@/components/josaa/InstituteJsonLd";

export const metadata: Metadata = {
  title:
    "JoSAA Colleges & Branches Directory | IIT, NIT, IIIT, GFTI",
  description:
    "Browse the 2024 JoSAA institute directory with IITs, NITs, IIITs, GFTIs and their branches, then explore historical cutoff data through 2025.",
  keywords: [
    "JoSAA colleges list",
    "IIT branches list",
    "NIT branches list",
    "IIIT colleges",
    "GFTI colleges",
    "JEE colleges directory",
    "engineering colleges India",
    "JoSAA 2026 counselling",
    "JoSAA 2025 cutoffs",
    "JoSAA 2024 colleges",
    "IIT JEE colleges",
    "NIT JEE colleges",
  ],
  openGraph: {
    title: "All JoSAA Colleges & Branches | Complete Directory",
    description:
      "Browse 150+ engineering colleges and 1000+ programs under JoSAA. IITs, NITs, IIITs, GFTIs with all branches.",
    type: "website",
  },
  alternates: {
    canonical: "https://deetnuts.com/josaa/all-colleges",
  },
};

export const dynamic = "force-dynamic";

// Type colors
const typeColors: Record<string, string> = {
  IIT: "bg-orange-200 border-orange-400",
  NIT: "bg-blue-200 border-blue-400",
  IIIT: "bg-green-200 border-green-400",
  GFTI: "bg-purple-200 border-purple-400",
  CFTI: "bg-pink-200 border-pink-400",
};

// Loading skeleton for Suspense fallback
function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Stats skeleton */}
      <div className="flex flex-wrap gap-4">
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-32" />
      </div>
      {/* Quick links skeleton */}
      <Skeleton className="h-24 w-full" />
      {/* Institute cards skeleton */}
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-48 w-full" />
      ))}
    </div>
  );
}

// Async content component for streaming
async function AllCollegesContent() {
  const institutes = await getAllInstitutes();

  // Group by type
  const groupedInstitutes = institutes.reduce(
    (acc, inst) => {
      const type = inst.institute_type || "Other";
      if (!acc[type]) acc[type] = [];
      acc[type].push(inst);
      return acc;
    },
    {} as Record<string, typeof institutes>,
  );

  // Sort institutes by name within each group
  Object.keys(groupedInstitutes).forEach((type) => {
    groupedInstitutes[type].sort((a, b) => a.name.localeCompare(b.name));
  });

  // Calculate totals
  const totalInstitutes = institutes.length;
  const totalBranches = institutes.reduce(
    (sum, inst) => sum + (inst.branches?.length || 0),
    0,
  );

  // Order of types
  const typeOrder = ["IIT", "NIT", "IIIT", "GFTI", "CFTI"];
  const sortedTypes = [...Object.keys(groupedInstitutes)].sort(
    (a, b) => (typeOrder.indexOf(a) ?? 99) - (typeOrder.indexOf(b) ?? 99),
  );

  return (
    <>
      <DirectoryJsonLd
        totalInstitutes={totalInstitutes}
        totalBranches={totalBranches}
      />

      {/* Quick Stats */}
      <div className="flex flex-wrap gap-4 mb-8">
        <Badge className="border-2 border-black bg-yellow-100 text-black font-bold px-4 py-2 text-base">
          <Building2 className="w-4 h-4 mr-2" />
          {totalInstitutes} Institutes
        </Badge>
        <Badge className="border-2 border-black bg-green-100 text-black font-bold px-4 py-2 text-base">
          <GraduationCap className="w-4 h-4 mr-2" />
          {totalBranches}+ Programs
        </Badge>
        <Badge className="border-2 border-black bg-blue-100 text-black font-bold px-4 py-2 text-base">
          2016-2024 Data
        </Badge>
      </div>

      {/* Quick Links */}
      <div className="mb-8 p-4 border-4 border-black bg-gray-50 shadow-[4px_4px_0_0_#000]">
        <p className="font-bold mb-3">Jump to:</p>
        <div className="flex flex-wrap gap-2">
          {sortedTypes.map((type) => (
            <a
              key={type}
              href={`#${type.toLowerCase()}`}
              className={`px-4 py-2 border-2 border-black font-bold hover:scale-105 transition-transform ${
                typeColors[type] || "bg-gray-200"
              }`}
            >
              {type} ({groupedInstitutes[type].length})
            </a>
          ))}
        </div>
      </div>

      {/* Institute Sections */}
      {sortedTypes.map((type) => (
        <section
          key={type}
          id={type.toLowerCase()}
          className="mb-12 scroll-mt-4"
        >
          <div className="flex items-center gap-3 mb-6">
            <h2
              className={`text-2xl md:text-3xl font-black px-4 py-2 border-4 border-black ${
                typeColors[type] || "bg-gray-200"
              } shadow-[4px_4px_0_0_#000]`}
            >
              {type === "IIT" && "Indian Institutes of Technology (IITs)"}
              {type === "NIT" && "National Institutes of Technology (NITs)"}
              {type === "IIIT" &&
                "Indian Institutes of Information Technology (IIITs)"}
              {type === "GFTI" &&
                "Government Funded Technical Institutes (GFTIs)"}
              {type === "CFTI" &&
                "Centrally Funded Technical Institutes (CFTIs)"}
              {!["IIT", "NIT", "IIIT", "GFTI", "CFTI"].includes(type) && type}
            </h2>
            <Badge className="border-2 border-black bg-white font-bold">
              {groupedInstitutes[type].length} Institutes
            </Badge>
          </div>

          <div className="space-y-4">
            {groupedInstitutes[type].map((institute) => (
              <Card
                key={institute.id}
                className="border-4 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] transition-shadow bg-white"
              >
                <CardHeader
                  className={`${
                    typeColors[type] || "bg-gray-100"
                  } border-b-4 border-black py-4`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <Link
                        href={`/josaa/institutes/${
                          institute.slug || institute.id
                        }`}
                        className="hover:underline"
                      >
                        <CardTitle className="text-xl font-black">
                          {institute.name}
                        </CardTitle>
                      </Link>
                      <p className="text-sm font-semibold text-gray-700">
                        {institute.short_name}
                        {institute.city && institute.state && (
                          <span className="ml-2 inline-flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {institute.city}, {institute.state}
                          </span>
                        )}
                      </p>
                    </div>
                    <Link
                      href={`/josaa/institutes/${
                        institute.slug || institute.id
                      }`}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-black text-white font-bold border-2 border-black hover:bg-gray-800 transition-colors"
                    >
                      View Cutoffs <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  {institute.branches && institute.branches.length > 0 ? (
                    <>
                      <p className="text-sm font-bold text-gray-600 mb-3">
                        {institute.branches.length} Programs Available:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {institute.branches.slice(0, 15).map((branch: any) => (
                          <Link
                            key={branch.id}
                            href={`/josaa/institutes/${
                              institute.slug || institute.id
                            }/${branch.short_code || branch.id}`}
                            className="text-xs px-3 py-1.5 border-2 border-black bg-gray-50 hover:bg-yellow-100 transition-colors font-medium"
                          >
                            {getBranchDisplayName(branch, {
                              showCount: true,
                            })}
                          </Link>
                        ))}
                        {institute.branches.length > 15 && (
                          <span className="text-xs px-3 py-1.5 border-2 border-black bg-gray-200 font-bold">
                            +{institute.branches.length - 15} more
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <GraduationCap className="w-4 h-4" />
                      <Link
                        href={`/josaa/institutes/${
                          institute.slug || institute.id
                        }`}
                        className="font-medium hover:underline"
                      >
                        View all programs and cutoffs →
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}

      {/* SEO Content */}
      <section className="mt-16 prose prose-lg max-w-none">
        <h2 className="text-2xl font-black border-b-4 border-black pb-2 mb-4">
          About JoSAA Engineering Colleges
        </h2>
        <p>
          The Joint Seat Allocation Authority (JoSAA) manages admissions to{" "}
          {totalInstitutes} premier engineering institutions in India, including
          the prestigious Indian Institutes of Technology (IITs), National
          Institutes of Technology (NITs), Indian Institutes of Information
          Technology (IIITs), and other Government Funded Technical Institutes
          (GFTIs).
        </p>
        <p>
          This comprehensive directory lists all JoSAA colleges with their
          complete branch offerings, helping students explore admission
          opportunities based on their JEE Main and JEE Advanced ranks. Our
          database includes historical cutoff data from 2016 to 2024 across all
          categories and rounds.
        </p>

        <h3 className="text-xl font-black mt-6 mb-3">Key Features</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Complete Institute Coverage:</strong> All {totalInstitutes}{" "}
            institutes under JoSAA counseling
          </li>
          <li>
            <strong>Branch-wise Data:</strong> {totalBranches}+ engineering
            programs with detailed cutoffs
          </li>
          <li>
            <strong>Historical Trends:</strong> Cutoff data spanning 2016-2024
            for trend analysis
          </li>
          <li>
            <strong>Category-wise Cutoffs:</strong> OPEN, OBC-NCL, SC, ST, EWS,
            and PwD categories
          </li>
          <li>
            <strong>Round-wise Data:</strong> Opening and closing ranks across
            all counseling rounds
          </li>
        </ul>
      </section>
    </>
  );
}

export default async function AllCollegesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link
                href="/josaa"
                className="px-3 py-1.5 bg-white border-2 border-black hover:bg-yellow-100 transition-colors font-semibold"
              >
                JoSAA
              </Link>
            </li>
            <li className="text-gray-400 font-bold">/</li>
            <li className="px-3 py-1.5 bg-black text-white border-2 border-black font-bold">
              All Colleges Directory
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black mb-3">
            Complete JoSAA Colleges & Branches Directory
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Browse all engineering institutes under JoSAA with their programs,
            cutoffs, and admission data.
          </p>
        </div>

        {/* Suspense boundary for streaming content */}
        <Suspense fallback={<LoadingSkeleton />}>
          <AllCollegesContent />
        </Suspense>
      </div>
    </div>
  );
}
