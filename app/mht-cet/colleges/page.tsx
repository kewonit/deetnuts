import CollegeGrid from '@/components/CollegeGrid';
import Link from 'next/link';

async function getColleges() {
  // This is a server component, so we can fetch directly without exposing an API route if we wanted to.
  // However, for this implementation, we will use the API route we created.
  // This also allows the client-side to use the same endpoint.
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/mht-cet/colleges`, { cache: 'no-store' });
  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error('Failed to fetch colleges');
  }
  return res.json();
}

export default async function CollegesPage() {
  const colleges = await getColleges();

  return (
    <div className="min-h-screen bg-bg">
      <div className="container mx-auto px-4 pt-32 pb-12">
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
        <div className="bg-white border-8 border-black rounded-base shadow-brutal p-8 sm:p-14 mb-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-20 select-none flex justify-center items-center">
            <img src="/MHT-CET_logo.png" alt="MHT-CET Logo" className="w-1/2 max-w-xs mx-auto blur-sm" />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-heading mb-4 text-black leading-tight tracking-tight drop-shadow-text-heavy">
              <span className="inline-block bg-main/20 border-b-4 border-main px-4 rounded-lg">MHT-CET <span className="text-main">COLLEGES</span></span>
            </h1>
            <p className="text-lg md:text-2xl text-black mb-10 leading-relaxed font-base drop-shadow-text-light">
              <span className="font-heading text-main text-2xl md:text-3xl">✨ Discover. Explore. Decide. ✨</span><br />
              <span className="block mt-2">Browse all participating colleges in the MHT-CET counseling process, compare seat matrix, and explore detailed course offerings.<br />
                Find the perfect fit for your future in engineering!</span>
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <div className="flex items-center bg-white border-2 border-black rounded-base px-6 py-4 shadow-base hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none hover:scale-105 transition-all">
                <span className="text-2xl mr-3">✅</span>
                <span className="font-heading text-black text-lg">Comprehensive College Database</span>
              </div>
              <div className="flex items-center bg-purple-200 border-2 border-black rounded-base px-6 py-4 shadow-base hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none hover:scale-105 transition-all">
                <span className="text-2xl mr-3">📊</span>
                <span className="font-heading text-black text-lg">Detailed Seat Matrix</span>
              </div>
              <div className="flex items-center bg-yellow-200 border-2 border-black rounded-base px-6 py-4 shadow-base hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none hover:scale-105 transition-all">
                <span className="text-2xl mr-3">🔍</span>
                <span className="font-heading text-black text-lg">Advanced Search & Filters</span>
              </div>
            </div>
          </div>
        </div>

        <CollegeGrid colleges={colleges} />
      </div>
    </div>
  );
}
