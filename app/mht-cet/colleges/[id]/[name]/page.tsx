import { notFound, redirect } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { formatInstituteName } from '@/lib/formatInstituteName';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Montserrat } from "next/font/google"
import { z } from 'zod';
import { DataTable } from './components/data-table';
import { columns } from '@/app/mht-cet/all-state-cutoffs/components/columns';
import { taskSchema } from "@/app/mht-cet/all-state-cutoffs/data/schema";

const lato = Montserrat({
  subsets: ["latin"],
  weight: ['400', '700', '900'],
})

export const dynamicParams = true;

type Params = {
  id: number;
  name: string;
};

type InstituteData = {
  'ID': number;
  'College': string;
  [key: string]: any; 
};

async function getCollegeStateTasks(year: number, round: string, collegeId: string) {
  const { data, error } = await supabase
    .from(`${year}-round-${round}-pcm-mhtcet-state-cutoffs`)
    .select(`"Serial Number", "ID", "College", "Branch", "Branch_id", "Status", "Allocation", "Category", "Cutoff", "Percentile", "City"`)
    .eq('ID', collegeId);
  if (error) {
      console.error('Error fetching tasks:', error);
      return [];
  }
  return z.array(taskSchema).parse(data);
}

export async function generateStaticParams() {
  const { data } = await supabase.from('colleges_within_mhtcet_pcm').select('ID, College');
  return data?.map(({ ID, College }) => ({
    id: ID.toString(),
    name: formatInstituteName(College),
  })) || [];
}

export async function generateMetadata({ params }: { params: Params }) {
  const { data } = await supabase
    .from('colleges_within_mhtcet_pcm')
    .select('College')
    .eq('ID', params.id)
    .single();

  if (!data) {
    return { title: 'Institute Not Found' };
  }

  return { title: data.College };
}

const InstitutePage: React.FC<{ params: Params }> = async ({ params }) => {
  const { data: instituteData, error: instituteError } = await supabase
    .from('colleges_within_mhtcet_pcm')
    .select('*')
    .eq('ID', params.id)
    .single();

  if (instituteError || !instituteData) {
    notFound();
  }

  const typedInstituteData = instituteData as InstituteData;

  const expectedName = formatInstituteName(typedInstituteData['College']);
  if (params.name !== expectedName) {
    redirect(`/institute/${params.id}/${expectedName}`);
  }

  const fetchCutoffData = async (tableName: string) => {
    const { data, error } = await supabase
      .from(tableName)
      .select('"Institute Code", "Course Name", "Percentile"')
      .eq('Institute Code', params.id);

    if (error) {
      console.error(`Error fetching data from ${tableName}:`, error);
      return null;
    }
    return data;
  };

  const roundOneCutoffs = await fetchCutoffData('mhtcet-allindia-cutoffs-round-one-2023');
  const roundTwoCutoffs = await fetchCutoffData('mhtcet-allindia-cutoffs-round-two-2023');
  const roundThreeCutoffs = await fetchCutoffData('mhtcet-allindia-cutoffs-round-three-2023');

  const year = 2023;
  const rounds = ['one'];
  const stateData = await Promise.all(
    rounds.map(async (round) => ({
      round,
      data: await getCollegeStateTasks(year, round, params.id.toString())
    }))
  );

  return (
    <div className={lato.className}>
      <div className="p-8 pt-24 md:pt-48">
        <span className="whitespace-nowrap rounded-full bg-purple-100 px-2.5 py-0.5 text-sm sm:text-md text-purple-700">
          <a>Institute code : {instituteData.ID}</a>
        </span>
        <h1 className="text-4xl lg:text-7xl font-bold">{instituteData.College}</h1>
        
        
        {/* State Data Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold">State Cutoff Data</h2>
          {stateData.map(({ round, data }) => (
            <div key={round} className="mb-8">
              <h3 className="text-xl font-semibold mb-2">Round {round}</h3>
              <div className="flex items-center p-4 my-4 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
                <svg className="flex-shrink-0 inline w-6 h-6 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
                </svg>
                <span className="sr-only">Info</span>
                <div>
                  <span className="font-medium">Warning!</span> The Data faces higher than normal inaccuracy! Please verify with the official website. As we continue to improve the data, we will update the information.
                </div>
              </div>
              {data.length > 0 ? (
                <DataTable data={data} columns={columns} />
                ) : (
                <p>No state cutoff data available for this round.</p>
              )}
            </div>
          ))}
        </div>
        <hr className='mt-20 border-black'/>
        {/* All India Cutoffs Section */}
        <div className="mt-4">
          <h2 className="text-2xl font-bold mb-4">All India Cutoffs</h2> 
          <Accordion type="single" collapsible className="w-full space-y-2">
            {[
              { round: 'Round One', data: roundOneCutoffs },
              { round: 'Round Two', data: roundTwoCutoffs },
              { round: 'Round Three', data: roundThreeCutoffs },
            ].map(({ round, data }) => (
              <AccordionItem value={`cutoffs-${round}`} key={round}>
                <AccordionTrigger>{round} Cutoffs</AccordionTrigger>
                <AccordionContent>
                  {data && data.length > 0 ? (
                    <ul>
                      {data.map((item, index) => (
                        <li key={index}>
                          {item['Course Name']}: {item['Percentile']}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No cutoff data available for {round}.</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <section className="mx-auto max-w-xl mt-8">
          <picture>
            <img src="https://res.cloudinary.com/dfyrk32ua/image/upload/v1720795007/deetnuts/catworkinghard_wb8yo7.png" alt="cat-working-hard-meme" className="rounded-xl mx-auto" />
          </picture>
        </section>
      </div>
    </div>
  );
};

export default InstitutePage;