import { notFound, redirect } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { formatInstituteName } from '@/lib/formatInstituteName';
export const dynamicParams = true;
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
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
  id: string;
  name: string;
};

export async function generateStaticParams() {
  const { data } = await supabase.from('nirf').select('institute_id, institute_name');
  return data?.map(({ institute_id, institute_name }) => ({
    id: institute_id.toString(),
    name: formatInstituteName(institute_name),
  })) || [];
}

export async function generateMetadata({ params }: { params: Params }) {
  const { data } = await supabase
    .from('nirf')
    .select('"institute_name", "institute_id"')
    .eq('institute_id', params.id)
    .single();

  if (!data) {
    return { title: 'Institute Not Found' };
  }

  return { title: `${data.institute_name} | ${data.institute_id}` };
}

const InstitutePage = async ({ params }: { params: Params }) => {
  const { data: instituteData, error: instituteError } = await supabase
    .from('nirf')
    .select('*')
    .eq('institute_id', params.id)
    .single();

  if (!instituteData || instituteError) {
    notFound();
  }

  const expectedName = formatInstituteName(instituteData.institute_name);
  if (params.name !== expectedName) {
    redirect(`/institute/${params.id}/${expectedName}`);
  }

  const { data: extraData, error: extraError } = await supabase
    .from('nirf_extradeet')
    .select('*')
    .eq('institute_id', params.id)
    .single();

  if (extraError) {
    console.error(extraError);
  }

  let ugMaleStudents = extraData ? extraData['UG-Male-Students'] : 0;
  let ugFemaleStudents = extraData ? extraData['UG-Female-Students'] : 0;
  const totalStudents = ugMaleStudents + ugFemaleStudents;

  const MAX_SEATS_PER_ROW = 150; 
  
  const generateRows = () => {
    const rows = [];
    const numRows = Math.ceil(totalStudents / MAX_SEATS_PER_ROW);
  
    for (let i = 0; i < numRows; i++) {
      const seatsInRow = i === numRows - 1 ? totalStudents % MAX_SEATS_PER_ROW : MAX_SEATS_PER_ROW;
      const seats = [];
  
      for (let j = 0; j < seatsInRow; j++) {
        const isMaleSeat = ugMaleStudents > 0;
        const seatColor = isMaleSeat ? 'bg-blue-500' : 'bg-pink-500';
        seats.push(
          <div
            key={`seat-${i}-${j}`}
            className={`seat cursor-crosshair border border-gray-600 w-2 h-2 rounded-md p-0.25 ${seatColor}`}
          ></div>
        );
        if (isMaleSeat) {
          ugMaleStudents--;
        } else {
          ugFemaleStudents--;
        }
      }
  
      rows.push(
        <div key={`row-${i}`} className="row flex justify-center mb-2">
          {seats}
        </div>
      );
    }
  
    return rows;
  };

  return (
    <div className={lato.className}>
    <div className="p-8 pt-24 md:pt-48">
      <span className="whitespace-nowrap rounded-full bg-purple-100 px-2.5 py-0.5 text-sm sm:text-md text-purple-700">
        <a>{instituteData.institute_id}</a>
      </span>
      <h1 className="text-4xl lg:text-7xl font-bold">{instituteData.institute_name}</h1>
      <div>
        <div className="mt-4">
          <div className='mt-4'>
            <h2 className='text-2xl font-semibold'>Undergraduate Details </h2>
            {extraData ? (
              <ul>
                <li>
                  <strong>UG Type:</strong> {extraData.UG_Type}
                </li>
                {/* Render other extra details */}
              </ul>
            ) : (
              <p>No extra details available.</p>
            )}
          </div>
          <div className='mt-8 p-2 rounded-base bg-white border-2 border-black'>
            <h1 className='text-2xl font-semibold'>Students Deets</h1>
            {extraData ? (
            <Accordion className="w-full space-y-2 mt-2" type="single" collapsible>
              <AccordionItem className="max-w-full" value="item-1">
                <AccordionTrigger>Total Students</AccordionTrigger>
                <AccordionContent>
                  <div className="mt-2">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-blue-500 mr-2"></div>
                      <span><strong>Male Students : </strong>{extraData["UG-Male-Students"]}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-pink-500 mr-2"></div>
                      <span><strong>Female Students : </strong>{extraData["UG-Female-Students"]}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-purple-500 mr-2"></div>
                      <span><strong>Total Students : </strong>{extraData["UG-Total-Students"]}</span>
                    </div>
                  </div>
                  <div className="mx-auto bg-gray-200 w-2/3 h-4 mt-4 mb-6"></div>
                  {generateRows()}
                </AccordionContent>
              </AccordionItem>
            </Accordion> 
            ) : (
              <p>No extra details available.</p>
            )}
          </div>
        </div>
      </div>  
      </div>
      <hr className='mt-24 border-black'/>
      <h1 className='mx-auto text-4xl font-bold w-full px-8 pt-4 py-4'>UG (undergraduate) Deets</h1>
      <section className='mx-auto max-w-xl mt-6 p-4'>
        <Table>
          <TableCaption>Number of UG (undergraduatee) students within the Institute</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">2021-22</TableHead>
              <TableHead className='text-center'>2020-21</TableHead>
              <TableHead className='text-center'>2019-20</TableHead>
              <TableHead className="text-right">2018-19</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="text-left">{extraData['UG-2021-22']}</TableCell>
              <TableCell className='text-center'>{extraData['UG-2020-21']}</TableCell>
              <TableCell className='text-center'>{extraData['UG-2019-20']}</TableCell>
              <TableCell className="text-right">{extraData['UG-2018-19']}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
      <section className='mx-auto max-w-3xl sm:mt-6 p-4'>
        <Table className='mt-8'>
          <TableCaption>Status of UG (undergraduatee) students within the Institute</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Within State</TableHead>
              <TableHead className='text-center'>Outside State</TableHead>
              <TableHead className='text-center'>Outside Country</TableHead>
              <TableHead className="text-center">Economically Backward</TableHead>
              <TableHead className="text-right">Socially Challenged</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="text-left">{extraData['UG-Within-State']}</TableCell>
              <TableCell className='text-center'>{extraData['UG-Outside-State']}</TableCell>
              <TableCell className='text-center'>{extraData['UG-Outside-Country']}</TableCell>
              <TableCell className="text-center">{extraData['UG-Economically-Backward']}</TableCell>
              <TableCell className="text-right">{extraData['UG-Socially-Challenged']}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
      <section className='mx-auto max-w-3xl sm:mt-6 p-4'>
        <Table className='mt-8'>
          <TableCaption>Tution Fee Status (Full Tuition Fee Reimursement)</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">From Government</TableHead>
              <TableHead className='text-center'>From Institution Funds</TableHead>
              <TableHead className='text-center'>From Private Bodies</TableHead>
              <TableHead className="text-right">No Receiving</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="text-left">{extraData['UG-full-tuition-fee-reimbursement-from-Government']}</TableCell>
              <TableCell className='text-center'>{extraData['UG-full-tuition-fee-reimbursement-from-Institution-Funds']}</TableCell>
              <TableCell className='text-center'>{extraData['UG-full-tuition-fee-reimbursement-from-the-Private-Bodies']}</TableCell>
              <TableCell className="text-right">{extraData['UG-not-receiving-full-tuition-fee-reimbursement']}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
      <hr className='mt-24 border-black'/>
      <h1 className='mx-auto text-4xl font-bold w-full px-8 pt-4 py-4'>PG (undergraduate) Deets</h1>
      <section className='mx-auto max-w-xl p-4'>
        <Table>
          <TableCaption>Number of PG (postgraduatee) students within the Institute</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">2021-22</TableHead>
              <TableHead className='text-center'>2020-21</TableHead>
              <TableHead className='text-center'>2019-20</TableHead>
              <TableHead className="text-right">2018-19</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="text-left">{extraData['PG-2021-22']}</TableCell>
              <TableCell className='text-center'>{extraData['PG-2020-21']}</TableCell>
              <TableCell className='text-center'>{extraData['PG-2019-20']}</TableCell>
              <TableCell className="text-right">{extraData['PG-2018-19']}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
      <section className='mx-auto max-w-3xl sm:mt-6 p-4'>
        <Table className='mt-8'>
          <TableCaption>Status of PG (postgraduatee) students within the Institute</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Within State</TableHead>
              <TableHead className='text-center'>Outside State</TableHead>
              <TableHead className='text-center'>Outside Country</TableHead>
              <TableHead className="text-right">Economically Backward</TableHead>
              <TableHead className="text-right">Socially Challenged</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="text-left">{extraData['PG-Within-State']}</TableCell>
              <TableCell className='text-center'>{extraData['PG-Outside-State']}</TableCell>
              <TableCell className='text-center'>{extraData['PG-Outside-Country']}</TableCell>
              <TableCell className="text-center">{extraData['PG-Economically-Backward']}</TableCell>
              <TableCell className="text-right">{extraData['PG-Socially-Challenged']}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
      <section className='mx-auto max-w-3xl sm:mt-6 p-4'>
        <Table className='mt-8'>
          <TableCaption>Tution Fee Status (Full Tuition Fee Reimursement)</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">From Government</TableHead>
              <TableHead className='text-center'>From Institution Funds</TableHead>
              <TableHead className='text-center'>From Private Bodies</TableHead>
              <TableHead className="text-right">No Receiving</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="text-left">{extraData['PG-full-tuition-fee-reimbursement-from-Government']}</TableCell>
              <TableCell className='text-center'>{extraData['PG-full-tuition-fee-reimbursement-from-Institution-Funds']}</TableCell>
              <TableCell className='text-center'>{extraData['PG-full-tuition-fee-reimbursement-from-the-Private-Bodies']}</TableCell>
              <TableCell className="text-right">{extraData['PG-not-receiving-full-tuition-fee-reimbursement']}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
        <section className="mx-auto max-w-xl">
          <picture>
            <img src="https://res.cloudinary.com/dfyrk32ua/image/upload/v1720795007/deetnuts/catworkinghard_wb8yo7.png" alt="cat-working-hard-meme" className="rounded-xl mx-auto" />
          </picture>
        </section>
    </div>

  );
};

export default InstitutePage;
