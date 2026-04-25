type ImportBatch = {
  id: string;
  file_name: string;
  status: string;
  total_rows: number;
  accepted_rows: number;
  rejected_rows: number;
  created_at: string;
};

export function ImportBatchTable({ batches }: { batches: ImportBatch[] }) {
  return (
    <div className="overflow-x-auto rounded-base border-2 border-black bg-white shadow-base">
      <table className="w-full min-w-[760px] border-collapse text-left">
        <thead className="bg-main">
          <tr>
            <th className="border-b-2 border-black p-3">File</th>
            <th className="border-b-2 border-black p-3">Status</th>
            <th className="border-b-2 border-black p-3">Rows</th>
            <th className="border-b-2 border-black p-3">Accepted</th>
            <th className="border-b-2 border-black p-3">Rejected</th>
            <th className="border-b-2 border-black p-3">Created</th>
          </tr>
        </thead>
        <tbody>
          {batches.map((batch) => (
            <tr key={batch.id}>
              <td className="border-b-2 border-black p-3">{batch.file_name}</td>
              <td className="border-b-2 border-black p-3">{batch.status}</td>
              <td className="border-b-2 border-black p-3">
                {batch.total_rows}
              </td>
              <td className="border-b-2 border-black p-3">
                {batch.accepted_rows}
              </td>
              <td className="border-b-2 border-black p-3">
                {batch.rejected_rows}
              </td>
              <td className="border-b-2 border-black p-3">
                {new Date(batch.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
