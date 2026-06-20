import type { Metadata } from "next";
import { fetchBotStats } from "./lib/data";
import StatsDashboard from "./components/StatsDashboard";

export const metadata: Metadata = {
  title: "Stats",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const stats = await fetchBotStats();

  return (
    <main className="min-h-screen bg-[#E4DFF2]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <h1 className="mb-8 text-center text-3xl font-bold text-black sm:text-4xl md:text-5xl">
          Stats
        </h1>
        <StatsDashboard stats={stats} />
      </div>
    </main>
  );
}
