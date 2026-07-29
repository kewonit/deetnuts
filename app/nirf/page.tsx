import Link from "next/link";
import { Metadata } from "next";
import { supabase } from "@/lib/supabaseClient";
import { formatInstituteName } from "@/lib/formatInstituteName";
import { Montserrat } from "next/font/google";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
{
  /*
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
*/
}
const lato = Montserrat({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: "NIRF Rankings | National Institutional Ranking Framework",
  description:
    "Explore the available NIRF ranking data for Engineering, Medical, Management, Law, and other categories across IITs, NITs and Indian universities.",
  keywords: [
    "NIRF",
    "NIRF Rankings",
    "NIRF ranking data",
    "National Institutional Ranking Framework",
    "IIT ranking",
    "NIT ranking",
    "engineering college ranking",
    "university rankings India",
    "best colleges India",
  ],
  openGraph: {
    title: "NIRF Rankings | National Institutional Ranking Framework",
    description:
      "Explore NIRF Rankings for Engineering, Medical, Management, and other categories.",
    url: "https://deetnuts.com/nirf",
    type: "website",
  },
  alternates: {
    canonical: "https://deetnuts.com/nirf",
  },
};

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
  "State Public University",
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
  "bg-amber-500",
];

interface Institute {
  institute_id: number;
  institute_name: string;
}

const InstitutesList = async () => {
  const { data } = await supabase.from("nirf").select("*");

  return (
    <main>
      <div className={lato.className}>
        <div className="pt-20 sm:p-20 bg-gradient-to-r from-violet-200 to-pink-200">
          <section className="mt-8">
            <div>
              <h1 className="text-9xl font-bold text-center">NIRF</h1>
              <p className="text-2xl font-bold text-center px-4 mb-8">
                National Institutional Ranking Framework
              </p>
            </div>
            {/*
            <div className="flex w-full max-w-3xl items-center space-x-2 mx-auto">
              <Input type="search" placeholder="Search Institute" />
              <Button type="submit">Search</Button>
            </div>
            */}
            <div className="w-full p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {fields.map((field, index) => (
                  <Link
                    href={`/nirf/${field.toLowerCase().replace(/ /g, "-")}`}
                    key={field}
                    className="h-full"
                  >
                    <Card
                      className={`group relative overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] ${colors[index % colors.length]} cursor-pointer h-full flex flex-col justify-between`}
                    >
                      <CardContent className="p-6 flex-grow">
                        <h2 className="text-2xl font-black text-white mb-2 group-hover:scale-110 transition-transform duration-200">
                          {field}
                        </h2>
                        <p className="text-sm font-bold text-white opacity-80">
                          Explore {field.toLowerCase()} programs and
                          opportunities
                        </p>
                      </CardContent>
                      <div className="absolute bottom-[-20px] right-[-20px] transform rotate-6">
                        <button className="bg-white text-black font-bold py-2 px-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                          Explore
                        </button>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
          {/*
          <div className="overflow-x-auto">
            <table className="max-w-7xl mx-auto rounded-lg divide-y-2 divide-gray-200 bg-white text-sm">
              <thead className="text-left">
                <tr>
                  <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">NIRF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-left">
                {data?.map((institute: Institute) => (
                  <tr key={institute.institute_id} className='odd:bg-gray-50'>
                    <td className='whitespace-nowrap px-4 py-1 font-medium text-gray-900'>
                      <Link href={`/nirf/${institute.institute_id}/${formatInstituteName(institute.institute_name)}`}>
                        {institute.institute_name}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          */}
        </div>
      </div>
    </main>
  );
};

export default InstitutesList;
