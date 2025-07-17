import Link from 'next/link';
import { parseCollegeSlug } from '@/lib/slugify';
import SeatMatrix from '@/components/SeatMatrix';
import { Suspense } from 'react';

async function getCollege(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/mht-cet/colleges/${slug}`, { cache: 'no-store' });
    if (!res.ok) {
      if (res.status === 404) {
        return null; // Return null instead of throwing notFound
      }
      throw new Error(`Failed to fetch college data for slug: ${slug}. Status: ${res.status}`);
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching college:', error);
    return null; // Return null for any fetch errors
  }
}

async function getSeatMatrix(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/mht-cet/colleges/${slug}/seat-matrix`, { cache: 'no-store' });
    if (!res.ok) {
      if (res.status === 404) {
        return { seatMatrix: [], matchInfo: null };
      }
      throw new Error(`Failed to fetch seat matrix data for slug: ${slug}`);
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching seat matrix:', error);
    return { seatMatrix: [], matchInfo: null };
  }
}

export async function generateMetadata({ params }: any) {
  const resolvedParams = await params;
  const { name } = parseCollegeSlug(resolvedParams.id);

  try {
    const college = await getCollege(resolvedParams.id);
    if (college) {
      return {
        title: `${college.college_name} - MHT-CET College Details`,
        description: `Complete information about ${college.college_name}, including seat matrix, courses, and admission details for MHT-CET counseling.`,
      };
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
  }

  return {
    title: name ? `${name.replace(/-/g, ' ')} - MHT-CET College` : 'MHT-CET College Details',
    description: 'MHT-CET college information and seat matrix details.',
  };
}

export default async function CollegePage({ params }: any) {
  const resolvedParams = await params;

  let college;
  let seatMatrix;
  let collegeError = null;
  let seatMatrixError = null;

  try {
    college = await getCollege(resolvedParams.id);
  } catch (error: any) {
    collegeError = error.message;
    // Don't throw here, let the component handle the error state
  }

  try {
    seatMatrix = await getSeatMatrix(resolvedParams.id);
  } catch (error: any) {
    seatMatrixError = error.message;
  }

  // If we don't have college data, render an error state instead of calling notFound()
  if (!college) {
    return (
      <div className="min-h-screen bg-bg">
        <div className="container mx-auto px-4 pt-32 pb-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white border-4 border-black rounded-base shadow-base p-12">
              <div className="text-8xl mb-6">😿</div>
              <h1 className="text-4xl font-heading text-black mb-6">COLLEGE NOT FOUND</h1>
              <p className="text-xl font-base text-black mb-8 leading-relaxed">
                we couldn&apos;t find the college you&apos;re looking for! 🔍<br />
                this might be due to an invalid ID or the college data might not be available.
              </p>
              <div className="space-y-4">
                <Link
                  href="/mht-cet/colleges"
                  className="inline-block bg-main text-black px-8 py-4 border-2 border-black rounded-base shadow-base font-heading text-lg hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-all"
                >
                  Browse All Colleges 📚
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="container mx-auto max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-7xl px-2 sm:px-4 pt-28 sm:pt-32 pb-8 sm:pb-12">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <div className="flex items-center space-x-2 text-sm font-base">
            <Link href="/" className="hover:text-main transition-colors font-medium">Home</Link>
            <span className="font-bold">🎀</span>
            <Link href="/mht-cet" className="hover:text-main transition-colors font-medium">MHT-CET</Link>
            <span className="font-bold">🎀</span>
            <Link href="/mht-cet/colleges" className="hover:text-main transition-colors font-medium">Colleges</Link>
            <span className="font-bold">🎀</span>
            <span className="text-black font-heading">{college.college_name}</span>
          </div>
        </nav>

        {/* College Header Card */}
        <div className="bg-white border-4 border-black rounded-base shadow-base p-4 sm:p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-4xl md:text-6xl font-heading mb-4 text-black leading-tight tracking-tight">
                {college.college_name}
              </h1>
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="bg-purple-300 text-black px-4 py-2 border-2 border-black rounded-base font-heading text-sm">
                  🆔 ID: {college.college_id}
                </span>
                <span className={`px-4 py-2 border-2 border-black rounded-base font-heading text-sm ${college.status === 'Active'
                  ? 'bg-green-300 text-black'
                  : 'bg-red-300 text-black'
                  }`}>
                  {college.status === 'Active' ? '✅' : '🔴'} {college.status}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-main border-2 border-black rounded-base flex items-center justify-center mr-4">
                  <span className="text-2xl">🆔</span>
                </div>
                <div>
                  <span className="font-heading text-black block text-lg">College ID</span>
                  <span className="font-base text-black text-xl">{college.college_id}</span>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-12 h-12 bg-green-300 border-2 border-black rounded-base flex items-center justify-center mr-4">
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <span className="font-heading text-black block text-lg">Status</span>
                  <span className="font-base text-black text-xl italic">{college.status}</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-purple-300 border-2 border-black rounded-base flex items-center justify-center mr-4">
                  <span className="text-2xl">🏫</span>
                </div>
                <div>
                  <span className="font-heading text-black block text-lg">Home University</span>
                  <span className="font-base text-black text-xl">{college.home_university}</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-yellow-300 border-2 border-black rounded-base flex items-center justify-center mr-4">
                  <span className="text-2xl">🗂️</span>
                </div>
                <div>
                  <span className="font-heading text-black block text-lg">Record ID</span>
                  <span className="font-base text-black text-sm font-mono">{college.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seat Matrix Section */}
        <Suspense fallback={<SeatMatrix data={[]} isLoading={true} />}>
          <div className="space-y-6">
            <SeatMatrix
              data={seatMatrix?.seatMatrix || []}
              error={seatMatrixError}
              isLoading={false}
            />
          </div>
        </Suspense>
      </div>
    </div>
  );
}