// app/mht-cet/all-india-cutoffs/[year]/[round]/page.tsx
import { Metadata } from "next";
import { z } from "zod";
import { columns } from "../../components/columns";
import { DataTable } from "../../components/data-table";
import { taskSchema } from "../../data/schema";
import { Breadcrumbs } from "../../components/breadcrumb";
import { supabase } from "@/lib/supabaseClient";
import Selector from "../../components/selector"; // Import the merged Selector component

export const metadata: Metadata = {
  title: "MHTCET | State College Cutoffs",
  description: "MHTCET | State College Cutoffs",
};

async function getTasks(year: number, round: string) {
  
  const { data, error } = await supabase
    .from(`${year}-${round}-pcm-mhtcet-state-cutoffs`)
    .select(`"Serial Number", "ID", "College", "Branch", "Branch_id", "Status", "Allocation", "Category", "Cutoff", "Percentile", "City"`);
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
      <div className="h-full flex-1 flex-col space-y-8 mt-20 md:flex">
        <div className="p-8">
          <div className=" items-center justify-between space-y-2 block flex-1 sm:flex sm:flex-1 sm:pt-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                MHTCET State Cutoffs ({round}) {year}
              </h2>
              <Breadcrumbs />
            </div>
            <div className="flex items-center space-x-2">
              <Selector type="year" value={year} round={round} />
              <Selector type="round" value={round} year={year} />
            </div>
          </div>
          <div className="flex items-center p-4 my-8 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
            <svg className="flex-shrink-0 inline w-6 h-6 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
            </svg>
            <span className="sr-only">Info</span>
            <div>
              <span className="font-medium">Warning!</span> The Data faces higher than normal inaccuracy! Please verify with the official website. As we continue to improve the data, we will update the information.
            </div>
          </div>
          <DataTable data={tasks} columns={columns} />
        </div>
            <div>
              {/* 
              <section className="border-t-[6px] border-y-black bg-bg py-20 font-base lg:py-[100px]"> 
                <div className="flow-root rounded-lg border border-gray-100 py-3 shadow-sm mx-auto max-w-3xl">
                  <dl className="-my-3 divide-y divide-gray-100 text-sm">
                    <div className="grid grid-cols-1 gap-1 p-3 even:bg-gray-50 sm:grid-cols-3 sm:gap-4">
                      <dt className="font-medium text-gray-900">Title</dt>
                      <dd className="text-gray-700 sm:col-span-2">Mr</dd>
                    </div>

                    <div className="grid grid-cols-1 gap-1 p-3 even:bg-gray-50 sm:grid-cols-3 sm:gap-4">
                      <dt className="font-medium text-gray-900">Name</dt>
                      <dd className="text-gray-700 sm:col-span-2">John Frusciante</dd>
                    </div>

                    <div className="grid grid-cols-1 gap-1 p-3 even:bg-gray-50 sm:grid-cols-3 sm:gap-4">
                      <dt className="font-medium text-gray-900">Occupation</dt>
                      <dd className="text-gray-700 sm:col-span-2">Guitarist</dd>
                    </div>

                    <div className="grid grid-cols-1 gap-1 p-3 even:bg-gray-50 sm:grid-cols-3 sm:gap-4">
                      <dt className="font-medium text-gray-900">Salary</dt>
                      <dd className="text-gray-700 sm:col-span-2">$1,000,000+</dd>
                    </div>

                    <div className="grid grid-cols-1 gap-1 p-3 even:bg-gray-50 sm:grid-cols-3 sm:gap-4">
                      <dt className="font-medium text-gray-900">Bio</dt>
                      <dd className="text-gray-700 sm:col-span-2">
                        Lorem ipsum dolor, sit amet consectetur adipisicing elit. Et facilis debitis explicabo
                        doloremque impedit nesciunt dolorem facere, dolor quasi veritatis quia fugit aperiam
                        aspernatur neque molestiae labore aliquam soluta architecto?
                      </dd>
                    </div>
                  </dl>
                </div>
              </section>
               */}
            <div>
          </div>
        </div>
      </div>
  );
}
