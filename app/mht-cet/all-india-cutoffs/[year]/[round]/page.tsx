// app/mht-cet/all-india-cutoffs/[year]/[round]/page.tsx
import { Metadata } from "next";
import { z } from "zod";
import { columns } from "../../components/columns";
import { DataTable } from "../../components/data-table";
import { taskSchema } from "../../data/schema";
import { Breadcrumbs } from "../../components/breadcrumb";
import { supabase } from "@/lib/supabaseClient";
import Selector from "../../components/selector";


export const metadata: Metadata = {
  title: "MHTCET | All India College Cutoffs",
  description: "MHTCET | All India College Cutoffs",
};

async function getTasks(year: number, round: string) {
  
  const { data, error } = await supabase
    .from(`mhtcet-allindia-cutoffs-${round}-${year}`)
    .select(`"Serial Number", "All India Merit", "Percentile", "Choice Code", "Institute Code", "Institute Name", "Course Name", "Exam(JEE/MHT-CET)", "Type", "Seat Type"`);
  if (error) {
      console.error('Error fetching tasks:', error);
      return [];
  }
  return z.array(taskSchema).parse(data);
}

interface TaskPageProps {
  params: {
    year: string;
    round: string;
  };
}

export default async function TaskPage({ params }: TaskPageProps) {
  const year = parseInt(params.year) || 2023;
  const round = params.round;
  const tasks = await getTasks(year, round);


  return (
    <div className="h-full flex-1 flex-col space-y-8 mt-20 p-8 md:flex">
      <div className=" items-center justify-between space-y-2 block flex-1 sm:flex sm:flex-1 sm:pt-2">
        <div>
            <h2 className="text-2xl font-bold tracking-tight">
              MHTCET All India Cutoffs ({round}) {year}
            </h2>
            <Breadcrumbs />
          </div>
          <div className="flex items-center space-x-2">
            <Selector type="year" value={year} round={round} />
            <Selector type="round" value={round} year={year} />
          </div>
        </div>
      <DataTable data={tasks} columns={columns} />
    </div>
  );
}