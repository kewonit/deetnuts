import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { formatInstituteName } from '@/lib/formatInstituteName';
import { Montserrat } from "next/font/google"
{/*
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
*/}
const lato = Montserrat({
  subsets: ["latin"],
  weight: ['400', '700', '900'],
})

interface Institute {
  institute_id: number;
  institute_name: string;
}

const InstitutesList = async () => {
  const { data } = await supabase.from('nirf').select('*');

  return (
    <div className={lato.className}>
      <main className='mt-20 p-4 sm:p-20 text-center'>
        <section className='pt-20 pb-32'>
          <div>
            <h1 className='text-9xl font-bold text-center'>NIRF</h1>
          </div>
          {/*
          <div className="flex w-full max-w-3xl items-center space-x-2 mx-auto">
            <Input type="search" placeholder="Search Institute" />
            <Button type="submit">Search</Button>
          </div>
          */}
        </section>
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
      </main>
    </div>
  );
};

export default InstitutesList;