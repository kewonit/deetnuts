import { notFound } from "next/navigation";

async function getCutoffs(year: string, round: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/mht-cet/state-cutoffs/${year}/${round}`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    if (res.status === 404) {
      notFound();
    }
    throw new Error(
      `Failed to fetch cutoff data for year: ${year}, round: ${round}`,
    );
  }
  return res.json();
}

export default async function CutoffPage(props: any) {
  const params = await props.params;
  const cutoffs = await getCutoffs(params.year, params.round);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        MHT-CET State Cutoffs - {params.year} - Round {params.round}
      </h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-2 px-4 border-b">College ID</th>
              <th className="py-2 px-4 border-b">College Name</th>
              <th className="py-2 px-4 border-b">Course Name</th>
              <th className="py-2 px-4 border-b">Seat Type</th>
              <th className="py-2 px-4 border-b">Gender</th>
              <th className="py-2 px-4 border-b">Home University</th>
              <th className="py-2 px-4 border-b">Exam</th>
              <th className="py-2 px-4 border-b">Score</th>
              <th className="py-2 px-4 border-b">Rank</th>
            </tr>
          </thead>
          <tbody>
            {cutoffs.map((cutoff: any) => (
              <tr key={cutoff.id} className="hover:bg-gray-100">
                <td className="py-2 px-4 border-b">{cutoff.college_id}</td>
                <td className="py-2 px-4 border-b">{cutoff.college_name}</td>
                <td className="py-2 px-4 border-b">{cutoff.course_name}</td>
                <td className="py-2 px-4 border-b">{cutoff.seat_type}</td>
                <td className="py-2 px-4 border-b">{cutoff.gender}</td>
                <td className="py-2 px-4 border-b">{cutoff.home_university}</td>
                <td className="py-2 px-4 border-b">{cutoff.exam}</td>
                <td className="py-2 px-4 border-b">{cutoff.score}</td>
                <td className="py-2 px-4 border-b">{cutoff.rank}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
