// app/mht-cet/all-india-cutoffs/[year]/[round]/page.tsx
import { Metadata } from "next";
import { z } from "zod";
import { columns } from "../../components/columns";
import { DataTable } from "../../components/data-table";
import { taskSchema } from "../../data/schema";
import { Breadcrumbs } from "../../components/breadcrumb";
import { supabase } from "@/lib/supabaseClient";
import Selector from "../../components/selector"; // Import the merged Selector component
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

  // Check authentication
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="h-full flex-1 flex-col space-y-8 mt-20 md:flex">
      <div className="p-8">
        <div className="items-center justify-between space-y-2 block flex-1 sm:flex sm:flex-1 sm:pt-2">
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
      {/*
      <div className="relative">
        <section className={`border-t-[2px] border-y-black bg-bg pb-20 font-base lg:pb-[70px] ${!user ? 'filter blur-sm' : ''}`}>
        <section className="w-full px-4 md:px-[3.5rem] py-16 flex flex-col items-center gap-10">
          <header className="flex flex-col gap-4 items-center max-w-[612px]">
            <h2 className="text-cream text-center text-balance text-4xl md:text-[3.5rem] leading-[.9285714286] font-medium tracking-[-.03em] m-0 [font-variation-settings:'opsz'_32]">
              Publish from anywhere with your frontmatter blog
            </h2>
            <p className="text-white text-center m-0 max-w-prose">
              Why should you be left out of a cross device writing experience because youre using a static site? Bureau takes away the pain of manually moving posts to your codebase and gives you the writing experience you need.
            </p>
          </header>
          <div className="w-full max-w-[1328px] grid grid-cols-12 grid-flow-dense xl:auto-rows-fr gap-4">
            <section className="@container/section flex flex-col col-span-full md:col-span-3 xl:row-span-4 gap-2 p-2 bg-gunmetal-850 ring-1 ring-gunmetal-750 rounded-2xl">
              <div className="p-6 flex flex-1 flex-col gap-4">
                <h3 className="text-cream font-semibold flex flex-col @[17.5rem]:flex-row @[17.5rem]:items-center gap-4 [font-variation-settings:'opsz'_32]">
                  <span className="bg-gunmetal-750 ring-1 ring-gunmetal-650 w-10 h-10 flex flex-[0_0_auto] items-center justify-center rounded-full" aria-hidden="true">
                    <svg className="fill-cream" width="24" height="24"><use href="#markdown" /></svg>
                  </span>
                  Markdown as standard
                </h3>
                <p className="text-white text-pretty max-w-prose">
                  Bureau provides a first-class markdown editing experience, by using the same library as you.
                </p>
              </div>
              <div className="flex justify-center items-end rounded-lg bg-gunmetal-800 ring-1 ring-gunmetal-750 overflow-hidden aspect-[232/342]">
                <img src="/images/markdown-menu.png" alt="Markdown menu" width={232} height={342} className="object-none object-[center_1rem] w-full h-full [mask-image:var(--image-mask-top)]" />
              </div>
            </section>

            <section className="@container/section flex flex-col col-span-full md:col-span-6 xl:row-span-4 gap-2 p-2 bg-gunmetal-850 ring-1 ring-gunmetal-750 rounded-2xl">
              <div className="p-6 flex flex-1 flex-col gap-4">
                <h3 className="text-cream font-semibold flex flex-col @[17.5rem]:flex-row @[17.5rem]:items-center gap-4 [font-variation-settings:'opsz'_32]">
                  <span className="bg-gunmetal-750 ring-1 ring-gunmetal-650 w-10 h-10 flex flex-[0_0_auto] items-center justify-center rounded-full" aria-hidden="true">
                    <svg className="fill-cream" width="24" height="24"><use href="#contextual_token" /></svg>
                  </span>
                  Frontmatter templates
                </h3>
                <p className="text-white text-pretty max-w-prose">
                  Its pretty tedious starting a new frontmatter post, isnt it? The editor works with your frontmatter and will generate timestamps, IDs and more. All with a simple setup—well find your config or generate one with Bureau.
                </p>
              </div>
              <div className="flex justify-center items-end rounded-lg bg-gunmetal-800 ring-1 ring-gunmetal-750 overflow-hidden aspect-[100/66] md:aspect-square xl:aspect-[640/376]">
                <img src="/images/frontmatter-templates.png" alt="Frontmatter templates" width={468} height={376} className="object-none object-[center_1rem] w-full h-full [mask-image:var(--image-mask-bottom)]" />
              </div>
            </section>

            <section className="@container/section flex flex-col col-span-full md:col-span-3 xl:row-span-2 gap-2 p-2 bg-gunmetal-850 ring-1 ring-gunmetal-750 rounded-2xl">
              <div className="p-6 flex flex-1 flex-col gap-4">
                <h3 className="text-cream font-semibold flex flex-col @[17.5rem]:flex-row @[17.5rem]:items-center gap-4 [font-variation-settings:'opsz'_32]">
                  <span className="bg-gunmetal-750 ring-1 ring-gunmetal-650 w-10 h-10 flex flex-[0_0_auto] items-center justify-center rounded-full" aria-hidden="true">
                    <svg className="fill-cream" width="24" height="24"><use href="#typed" /></svg>
                  </span>
                  Typed content
                </h3>
                <p className="text-white text-pretty max-w-prose">
                  Bureau will look to see if your frontmatter is typed and if not you can let Bureau know.
                </p>
              </div>
            </section>

            <section className="@container/section flex flex-col col-span-full md:col-span-3 xl:row-span-2 gap-2 p-2 bg-gunmetal-850 ring-1 ring-gunmetal-750 rounded-2xl">
              <div className="p-6 flex flex-1 flex-col gap-4">
                <h3 className="text-cream font-semibold flex flex-col @[17.5rem]:flex-row @[17.5rem]:items-center gap-4 [font-variation-settings:'opsz'_32]">
                  <span className="bg-gunmetal-750 ring-1 ring-gunmetal-650 w-10 h-10 flex flex-[0_0_auto] items-center justify-center rounded-full" aria-hidden="true">
                    <svg className="fill-cream" width="24" height="24"><use href="#automated" /></svg>
                  </span>
                  Works with your code
                </h3>
                <p className="text-white text-pretty max-w-prose">
                  G - General <br/> L - Ladies <br/> End Characte :  <br/> H - Home University <br/> O - Other than Home University <br/> S - State Level
                </p>
              </div>
            </section>
          </div>

        </section>
      </section>

        {!user && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 select-none">
            <div className="text-center p-6">
              <h1 className="text-3xl md:text-5xl font-bold mb-4">Please Login 👉👈</h1>
              <p className="text-xl md:text-2xl mb-8">To prevent bots from breaking the site, & to personalise your experience!  </p>
              <Button className="text-white font-bold py-2 px-4 rounded">
                <a href="login">Signup / Login</a>
              </Button>
            </div>
          </div>
        )}
      
      </div>
        */}
    </div>
  );
}
