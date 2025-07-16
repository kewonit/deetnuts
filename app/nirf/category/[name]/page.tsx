// File: app/nirf/category/[name]/page.tsx

import { Montserrat } from "next/font/google";
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight } from "lucide-react";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ['400', '700', '900'],
});

const fields = [
  "Overall",
  "Universities",
  "Colleges",
  "Research Institutions",
  "Engineering",
  "Management",
  "Pharmacy",
  "Medical",
  "Dental",
  "Law",
  "Architecture and Planning",
  "Agriculture and Allied Sectors",
  "Innovation",
  "Open University",
  "Skill University",
  "State Public University"
];

const colors = [
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-lime-500",
  "bg-emerald-500",
  "bg-fuchsia-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-amber-500"
];

export async function generateMetadata({ params }: any) {
  const decodedField = params.name.replace(/-/g, ' ');
  const fieldTitle = decodedField.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return {
    title: `NIRF - ${fieldTitle}`,
    description: `National Institutional Ranking Framework - ${fieldTitle}`,
  };
}

export default async function FieldPage({ params }: any) {
  console.log("Params received:", params); // Debugging line

  const decodedField = params.name.replace(/-/g, ' ');
  const fieldTitle = decodedField.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  const colorIndex = fields.findIndex(f => f.toLowerCase() === fieldTitle.toLowerCase());
  const bgColor = colors[colorIndex % colors.length];

  return (
    <div className={montserrat.className}>
      <main className="min-h-screen bg-gradient-to-r from-violet-200 to-pink-200 p-4 sm:p-8 mt-16 overflow-hidden">
        <Link href="/nirf" className="inline-block mb-8">
          <button className="bg-white text-black font-bold py-2 px-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
            ← Back to Home
          </button>
        </Link>

        <div className={`${bgColor} border-8 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] p-8 mb-8`}>
          <h1 className="text-4xl sm:text-7xl font-black text-white mb-4 leading-none">
            {fieldTitle.split(' ').map((word: string, index: number) => (
              <span key={index} className="inline-block transform -skew-y-3 mr-2">{word}</span>
            ))}
          </h1>
          <p className="text-lg sm:text-xl font-bold text-white opacity-80">
            National Institutional Ranking Framework
          </p>
        </div>

        {/* New Creative "All data in one place" Card */}
        <div className="mb-12 relative mt-24 p-4">
          <div className="absolute -inset-4 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 transform rotate-3 rounded-2xl"></div>
          <Card className="relative border-4 border-black overflow-visible bg-white">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-4xl sm:text-5xl font-black mb-6 text-black relative inline-block">
                ALL DATA IN ONE PLACE
                <div className="absolute -bottom-2 left-0 w-full h-3 bg-yellow-300 -z-10 transform -rotate-1"></div>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                {[
                  { label: 'Institutions', value: '1000+' },
                  { label: 'Rankings', value: 'Top 100' },
                  { label: 'Metrics', value: '20+' },
                ].map((item, index) => (
                  <div key={index} className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-indigo-100 transform group-hover:-translate-y-1 transition-transform rounded-lg"></div>
                    <div className="relative bg-white p-4 border-2 border-black">
                      <p className="font-bold text-lg text-gray-600">{item.label}</p>
                      <p className="text-3xl font-black">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <button className="relative group bg-black text-white font-bold py-2 px-4 border-2 border-black overflow-hidden">
                  <span className="relative z-10">Explore Data</span>
                  <div className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                  <span className="absolute inset-0 flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-opacity">Explore Data</span>
                </button>
              </div>
            </CardContent>
          </Card>
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-yellow-300 rounded-full border-4 border-black z-10 flex items-center justify-center shadow-lg">
            <span className="font-black text-xl text-black transform -rotate-12">NEW</span>
          </div>
        </div>

        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">Top Institutions in {fieldTitle}</h2>
            <ScrollArea className="h-[60vh]">
              <ul className="space-y-2">
                {/* Placeholder for institution list */}
                {[...Array(20)].map((_, index) => (
                  <li key={index} className="bg-gray-100 p-4 rounded-lg border-2 border-black">
                    <h3 className="font-bold">Institution {index + 1}</h3>
                    <p>Rank: {index + 1}</p>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}