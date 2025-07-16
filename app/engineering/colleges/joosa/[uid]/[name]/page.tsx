import { notFound, redirect } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { formatInstituteName } from '@/lib/formatInstituteName';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Montserrat } from "next/font/google"

const lato = Montserrat({
  subsets: ["latin"],
  weight: ['400', '700', '900'],
})

type Params = {
  uid: string;
  name: string;
};

export async function generateStaticParams() {
  const { data } = await supabase.from('Real_JOOSA_College').select('UID, Name');
  return data?.map(({ UID, Name }) => ({
    uid: UID.toString(),
    name: formatInstituteName(Name),
  })) || [];
}

export async function generateMetadata({ params }: any) {
  const { data } = await supabase
    .from('Real_JOOSA_College')
    .select('"Name", "UID"')
    .eq('UID', params.uid)
    .single();

  if (!data) {
    return { title: 'Institute Not Found' };
  }

  return { title: `${data.Name} | ${data.UID}` };
}

const InstitutePage = async ({ params }: any) => {
  const { data: instituteData, error: instituteError } = await supabase
    .from('Real_JOOSA_College')
    .select('*')
    .eq('UID', params.uid)
    .single();

  if (!instituteData || instituteError) {
    notFound();
  }

  const expectedName = formatInstituteName(instituteData.Name);
  if (params.name !== expectedName) {
    redirect(`/engineering/colleges/joosa/${params.uid}/${expectedName}`);
  }

  return (
    <div className={lato.className}>
      <div className="p-8 pt-48">
        <span className="whitespace-nowrap rounded-full bg-purple-100 px-2.5 py-0.5 ">
          <a>{instituteData.UID}</a>
        </span>
        <h1 className="text-7xl font-black">{instituteData.Name}</h1>
        <section className='mt-20'>
          <Table>
            <TableCaption>A list of all the programs offered by the institute.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Program Code</TableHead>
                <TableHead>Program Name</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Degree</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instituteData.Programs.map((program: any) => (
                <TableRow key={program['Program Code']}>
                  <TableCell className="font-medium">{program['Program Code']}</TableCell>
                  <TableCell>{program['Program Name']}</TableCell>
                  <TableCell>{program['Duration']}</TableCell>
                  <TableCell className="text-right">{program['Degree']}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      </div>
    </div>
  );
};

export default InstitutePage;
