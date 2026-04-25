import { createAdminClient } from "@/app/lib/supabase/admin";
import { AdminAccessDenied } from "@/components/mht-cet/admin/AdminAccessDenied";
import { ImportBatchTable } from "@/components/mht-cet/admin/ImportBatchTable";
import { MhtCetAdminError, requireMhtCetAdmin } from "@/lib/mht-cet/admin/auth";

export default async function MhtCetAdminImportsPage() {
  try {
    await requireMhtCetAdmin();
  } catch (error) {
    if (error instanceof MhtCetAdminError) {
      return <AdminAccessDenied error={error} />;
    }

    throw error;
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("mht_cet_question_import_batches")
    .select(
      "id, file_name, status, total_rows, accepted_rows, rejected_rows, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-5 pt-24">
      <h1 className="font-heading text-4xl">MHT-CET Imports</h1>
      <ImportBatchTable
        batches={
          (data ?? []) as Parameters<typeof ImportBatchTable>[0]["batches"]
        }
      />
    </main>
  );
}
