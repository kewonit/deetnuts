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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowDownIcon, ArrowUpIcon, DollarSignIcon, EyeIcon, ShoppingCartIcon, UsersIcon } from 'lucide-react';
import CollegeStats from './components/gender-stats'

const lato = Montserrat({
  subsets: ["latin"],
  weight: ['400', '700', '900'],
})

const InstitutePage = async (props: any) => {
  const params = await props.params;
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
    redirect(`/nirf/institute/${params.id}/${expectedName}`);
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
      <span className="whitespace-nowrap rounded-full bg-purple-100 px-2.5 py-0.5 ">
        <a>{instituteData.institute_id}</a>
      </span>
      <h1 className="text-4xl lg:text-7xl font-black">{instituteData.institute_name}</h1>
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
                <CollegeStats 
                    boys={extraData["UG-Male-Students"]} 
                    girls={extraData["UG-Female-Students"]} 
                />
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
              <TableCell className='text-center'>{extraData['PG-full-tuition-fee-reimbursement-from-the-Private-Bodies']}</TableCell>
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
        <div className="mx-auto w-full p-8">
          <h1 className="text-6xl font-black mb-8 text-black">NEO BRUTALIST DASHBOARD</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-red-500">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <CardTitle className="text-4xl font-black mb-2">{extraData['UG-2021-22']}</CardTitle>
                  <p className="text-xl font-bold">Total Undergrads</p>
                </div>
                <UsersIcon size={48} className="text-black" />
              </CardContent>
            </Card>

            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-blue-500">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <CardTitle className="text-4xl font-black mb-2">$9,876,543</CardTitle>
                  <p className="text-xl font-bold">Revenue</p>
                </div>
                <DollarSignIcon size={48} className="text-black" />
              </CardContent>
            </Card>

            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-green-500">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <CardTitle className="text-4xl font-black mb-2">87,654</CardTitle>
                  <p className="text-xl font-bold">Orders</p>
                </div>
                <ShoppingCartIcon size={48} className="text-black" />
              </CardContent>
            </Card>

            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-purple-500">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <CardTitle className="text-4xl font-black mb-2">5,432,109</CardTitle>
                  <p className="text-xl font-bold">Page Views</p>
                </div>
                <EyeIcon size={48} className="text-black" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <CardHeader className="border-b-4 border-black bg-orange-500">
                <CardTitle className="text-2xl font-bold">Revenue Data</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <thead>
                    <tr className="bg-white border-b-4 border-black">
                      <th className="font-black p-4 text-left">Month</th>
                      <th className="font-black p-4 text-left">Revenue</th>
                      <th className="font-black p-4 text-left">Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b-2 border-black">
                      <td className="p-4">January</td>
                      <td className="p-4 font-bold">$1,234,567</td>
                      <td className="p-4 font-bold flex items-center">
                        <ArrowUpIcon className="text-green-700 mr-2" /> 5.2%
                      </td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-4">February</td>
                      <td className="p-4 font-bold">$2,345,678</td>
                      <td className="p-4 font-bold flex items-center">
                        <ArrowUpIcon className="text-green-700 mr-2" /> 7.8%
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4">March</td>
                      <td className="p-4 font-bold">$3,456,789</td>
                      <td className="p-4 font-bold flex items-center">
                        <ArrowDownIcon className="text-red-700 mr-2" /> 2.1%
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </CardContent>
            </Card>

            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <CardHeader className="border-b-4 border-black bg-pink-500">
                <CardTitle className="text-2xl font-bold">Product Performance</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <thead>
                    <tr className="bg-white border-b-4 border-black">
                      <th className="font-black p-4 text-left">Product</th>
                      <th className="font-black p-4 text-left">Sales</th>
                      <th className="font-black p-4 text-left">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b-2 border-black">
                      <td className="p-4">Widget A</td>
                      <td className="p-4 font-bold">5,432</td>
                      <td className="p-4 font-bold">4.8/5</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-4">Gadget B</td>
                      <td className="p-4 font-bold">4,321</td>
                      <td className="p-4 font-bold">4.6/5</td>
                    </tr>
                    <tr>
                      <td className="p-4">Doohickey C</td>
                      <td className="p-4 font-bold">3,210</td>
                      <td className="p-4 font-bold">4.9/5</td>
                    </tr>
                  </tbody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
  );
};

export default InstitutePage;