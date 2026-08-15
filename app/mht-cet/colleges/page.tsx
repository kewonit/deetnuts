import CollegeGrid from "@/components/CollegeGrid";
import Link from "next/link";
import { getCollegesData } from "@/lib/college-data";

export const dynamic = "force-dynamic";

export default async function CollegesPage() {
  const colleges = await getCollegesData();

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-full md:max-w-7xl mx-auto px-4 pt-32 pb-12">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <div className="flex items-center space-x-2 text-sm font-base">
            <Link
              href="/"
              className="hover:text-main transition-colors font-medium"
            >
              Home
            </Link>
            <span className="font-bold">🎀</span>
            <Link
              href="/mht-cet"
              className="hover:text-main transition-colors font-medium"
            >
              MHT-CET
            </Link>
            <span className="font-bold">🎀</span>
            <span className="text-black font-heading">Colleges</span>
          </div>
        </nav>

        {/* Header Section */}
        <div className="bg-white border-4 border-black rounded-base shadow-brutal p-8 sm:p-12 mb-12 text-center">
          <h1 className="text-4xl md:text-6xl font-heading mb-3 text-black">
            MHT-CET Colleges
          </h1>
          <p className="text-lg md:text-xl text-black/80 mb-2 leading-relaxed font-base">
            Browse colleges and seat matrices for MHT-CET counseling.
          </p>
        </div>

        <CollegeGrid colleges={colleges} />
      </div>
    </div>
  );
}
