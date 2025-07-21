import CollegeGrid from '@/components/CollegeGrid';
import Link from 'next/link';
import { getCollegesData } from '@/lib/college-data';

export default async function CollegesPage() {
  const colleges = await getCollegesData();

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-full md:max-w-7xl mx-auto px-4 pt-32 pb-12">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <div className="flex items-center space-x-2 text-sm font-base">
            <Link href="/" className="hover:text-main transition-colors font-medium">Home</Link>
            <span className="font-bold">🎀</span>
            <Link href="/mht-cet" className="hover:text-main transition-colors font-medium">MHT-CET</Link>
            <span className="font-bold">🎀</span>
            <span className="text-black font-heading">Colleges</span>
          </div>
        </nav>

        {/* Header Section */}
        <div className="bg-white border-4 border-black rounded-base shadow-brutal p-8 sm:p-12 mb-12 text-center relative">
          <div className="relative z-10 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-heading mb-3 text-black">
              MHT-CET Colleges
            </h1>
            <p className="text-lg md:text-xl text-black/80 mb-8 leading-relaxed font-base">
              Your complete guide to MHT-CET counseling. Browse colleges, compare seat matrices, and find the perfect fit for your future in engineering.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Discover Card */}
              <div className="bg-main border-2 border-black rounded-base p-6 shadow-base hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-all">
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="text-xl font-heading text-black">Discover</h3>
                <p className="font-base text-black/70 mt-1">A comprehensive, filterable database of all participating colleges.</p>
              </div>

              {/* Explore Card */}
              <div className="bg-yellow-200 border-2 border-black rounded-base p-6 shadow-base hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-all">
                <div className="text-4xl mb-3">📊</div>
                <h3 className="text-xl font-heading text-black">Explore</h3>
                <p className="font-base text-black/70 mt-1">In-depth details for each college, including seat matrices and courses.</p>
              </div>

              {/* Decide Card */}
              <div className="bg-purple-300 border-2 border-black rounded-base p-6 shadow-base hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-all">
                <div className="text-4xl mb-3">✅</div>
                <h3 className="text-xl font-heading text-black">Decide</h3>
                <p className="font-base text-black/70 mt-1">Make informed decisions with accurate and up-to-date information.</p>
              </div>
            </div>
          </div>
        </div>

        <CollegeGrid colleges={colleges} />
      </div>
    </div>
  );
}
