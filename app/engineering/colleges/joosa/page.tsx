import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { formatInstituteName } from '@/lib/formatInstituteName';
import { Montserrat } from "next/font/google"

const lato = Montserrat({
  subsets: ["latin"],
  weight: ['400', '700', '900'],
})

interface Institute {
  UID: string;
  Name: string;
}

const InstitutesList = async () => {
  const { data } = await supabase.from('Real_JOOSA_College').select('UID, Name');

  return (
    <div className={lato.className}>
      <main className='mt-20 p-4 sm:p-20 text-center'>
        <section className='pt-20 pb-32'>
          <div>
             <h1 className='text-5xl sm:text-9xl font-bold text-center'>JOSAA</h1>
          </div>
            {/*
            <div className="flex w-full max-w-3xl items-center space-x-2 mx-auto">
              <Input type="search" placeholder="Search Institute" />
              <Button type="submit">Search</Button>
            </div>
            */}
        </section>
        <ul className='p-4 text-center'>
          <div className="overflow-x-auto">
            <table className="max-w-7xl mx-auto rounded-lg divide-y-2 divide-gray-200 bg-white text-sm">
              <thead className="text-left">
                <tr>
                  <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Josaa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.map((institute: Institute) => (
                  <tr key={institute.UID} className='odd:bg-gray-50 text-left '>
                      <td className='whitespace-nowrap truncate ... inline-block max-w-2xl px-4 py-1 font-medium text-gray-900'>
                          <Link href={`/engineering/colleges/joosa/${institute.UID}/${formatInstituteName(institute.Name)}`}>
                          {institute.Name}
                          </Link>
                      </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ul>
      </main>
    </div>
  );
};

export default InstitutesList;