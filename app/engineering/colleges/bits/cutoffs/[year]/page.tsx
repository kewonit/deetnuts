// app/mht-cet/all-india-cutoffs/[year]/page.tsx
import { Metadata } from "next";
import { z } from "zod";
import { columns } from "../components/columns";
import { DataTable } from "../components/data-table";
import { taskSchema } from "../data/schema";
import { Breadcrumbs } from "../components/breadcrumb";
import { supabase } from "@/lib/supabaseClient";
import Selector from "../components/selector";
import { BITSCutoffChart } from "../components/chart";

export const metadata: Metadata = {
  title: "BITS Cutoffs 2023 - Check All India Cutoffs for BITS Admission",
  description: "Get the detailed BITS Cutoffs 2023 for all India candidates. Check the minimum cutoff scores for BITS admission in various engineering branches.",
  keywords: "BITS Cutoffs 2023, BITS Admission Cutoffs, All India Cutoffs for BITS, BITS Cutoff Scores, Engineering Cutoffs",
};

async function getTasks(year: number) {
  const { data, error } = await supabase
    .from(`bits_cutoffs_${year}`)
    .select(`*`);
  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
  return z.array(taskSchema).parse(data);
}

interface TaskPageProps {
  params: {
    year: string;
  };
}

export default async function TaskPage({ params }: TaskPageProps) {
  const year = parseInt(params.year) || 2023;
  const tasks = await getTasks(year);

  return (
    <>
      <div className="h-full flex-1 flex-col space-y-8 mt-20 p-4 sm:p-8 md:flex max-w-5xl mx-auto">
        <div className="items-center justify-between space-y-2 block flex-1 sm:flex sm:flex-1 sm:pt-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              BITS Cutoffs {year}
            </h2>
            <Breadcrumbs />
          </div>
          <div className="flex items-center space-x-2">
            <Selector type="year" value={year} />
          </div>
        </div>
        <DataTable data={tasks} columns={columns} />
        {/*<BITSCutoffChart /> */}
      </div>
    </>
  );
}