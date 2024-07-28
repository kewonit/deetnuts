import { notFound, redirect } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { formatInstituteName } from '@/lib/formatInstituteName';
import { Montserrat } from "next/font/google"
import ProgramList from './programlist';

const lato = Montserrat({
  subsets: ["latin"],
  weight: ['400', '700', '900'],
})

export const dynamicParams = true;

type Params = {
  uid: string;
  name: string;
};

type InstituteData = {
  'UID': string;
  'Name': string;
  'City': string;
  'State': string;
};

type RankData = {
  'Opening Rank': number;
  'Closing Rank': number;
  'Quota': string;
  'Seat Type': string;
  'Gender': string;
};

type YearRoundData = {
  [key: string]: RankData[];
};

type ProgramData = {
  'Program Name': string;
  'Seat Pool': string;
  'State/All India Seats': string;
  'Ranks': YearRoundData;
};

export async function generateStaticParams() {
  const { data } = await supabase.from('Real_JOOSA_College').select('UID, Name');
  return data?.map(({ UID, Name }) => ({
    uid: UID.toString(),
    name: formatInstituteName(Name),
  })) || [];
}

export async function generateMetadata({ params }: { params: Params }) {
  const { data } = await supabase
    .from('Real_JOOSA_College')
    .select('Name')
    .eq('UID', params.uid)
    .single();

  if (!data) {
    return { title: 'Institute Not Found' };
  }

  return { title: data.Name };
}

const InstitutePage: React.FC<{ params: Params }> = async ({ params }) => {
  const { data: instituteData, error: instituteError } = await supabase
    .from('Real_JOOSA_College')
    .select('*')
    .eq('UID', params.uid)
    .single();

  if (instituteError || !instituteData) {
    notFound();
  }

  const typedInstituteData = instituteData as InstituteData;

  const expectedName = formatInstituteName(typedInstituteData['Name']);
  if (params.name !== expectedName) {
    redirect(`/engineering/colleges/joosa/${params.uid}/${expectedName}`);
  }

  // Fetch program data
  const { data: programData, error: programError } = await supabase
    .from('JOOSA_College_Seat_Matrix_2023')
    .select('"Program Name", "Seat Pool", "State/All India Seats"')
    .eq('UID', typedInstituteData.UID);

  if (programError) {
    console.error('Error fetching program data:', programError);
  }

  const tables = [
    'joosa_2023_round_1', 'joosa_2023_round_2', 'joosa_2023_round_3',
    'joosa_2023_round_4', 'joosa_2023_round_5', 'joosa_2023_round_6',
    'joosa_2022_round_1', 'joosa_2022_round_2', 'joosa_2022_round_3',
    'joosa_2022_round_4', 'joosa_2022_round_5', 'joosa_2022_round_6'
  ];
  
  const rankData = await Promise.all(
    tables.map(async (tableName) => {
      const [_, year, __, roundStr] = tableName.split('_');
      const round = parseInt(roundStr);
  
      const { data, error } = await supabase
        .from(tableName)
        .select('"Academic Program Name", "Opening Rank", "Closing Rank", Quota, "Seat Type", Gender')
        .eq('UID', typedInstituteData.UID);
  
      if (error) {
        console.error(`Error fetching data from ${tableName}:`, error);
        return [];
      }
  
      // Add the year and round to each record
      return data.map(record => ({ ...record, Year: parseInt(year), Round: round }));
    })
  );
  
  // Combine program data with rank data
  const combinedProgramData = programData?.map(program => {
    const ranks: YearRoundData = {};
    rankData.flat().forEach(rank => {
      if (rank['Academic Program Name'] === program['Program Name']) {
        const key = `${rank.Year}_Round_${rank.Round}`;
        if (!ranks[key]) {
          ranks[key] = [];
        }
        ranks[key].push({
          'Opening Rank': rank['Opening Rank'],
          'Closing Rank': rank['Closing Rank'],
          'Quota': rank['Quota'],
          'Seat Type': rank['Seat Type'],
          'Gender': rank['Gender']
        });
      }
    });
  
    return {
      ...program,
      'Ranks': ranks
    };
  }) as ProgramData[];

  return (
    <div className={lato.className}>
      <div className="p-4 md:p-8 pt-24 md:pt-32">
        <section>
          <span className="whitespace-nowrap rounded-full bg-purple-100 px-2.5 py-0.5 text-sm sm:text-lg text-purple-700">
            <a>{typedInstituteData.City}, {typedInstituteData.State}</a>
          </span>
          <h1 className="text-4xl lg:text-7xl font-bold">{typedInstituteData.Name}</h1>
        </section>
        
        <section>
          <div className="flex items-center p-4 mt-6 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
            <svg className="flex-shrink-0 inline w-6 h-6 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
            </svg>
            <span className="sr-only">Info</span>
            <div>
              <span className="font-medium">Warning!</span> Please select &quot;Year and Round&quot; and &quot;Seat Pool&quot; to view the ranks.
            </div>
          </div>
        </section>

        <section className="mt-6 mb-4">
          <ProgramList programs={combinedProgramData} />
        </section>
      
        <section className="mx-auto max-w-xl">
          <picture>
            <img src="https://res.cloudinary.com/dfyrk32ua/image/upload/v1720795007/deetnuts/catworkinghard_wb8yo7.png" alt="cat-working-hard-meme" className="rounded-xl mx-auto" />
          </picture>
        </section>
      </div>
    </div>
  );
};

export default InstitutePage;