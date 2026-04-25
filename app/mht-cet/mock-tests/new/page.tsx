import { MockBuilder } from "@/components/mht-cet/mock-tests/MockBuilder";
import {
  EMPTY_MOCK_TEST_AVAILABILITY,
  loadMockTestAvailability,
} from "@/lib/mht-cet/mock-tests/supabase";

export default async function NewMhtCetMockPage() {
  const availability = await loadMockTestAvailability().catch(
    () => EMPTY_MOCK_TEST_AVAILABILITY,
  );

  return (
    <main className="mx-auto grid max-w-5xl gap-8 p-5 pt-24">
      <header className="grid gap-2">
        <h1 className="font-heading text-4xl">Create Mock</h1>
        <p className="font-base text-lg">
          Choose the exact mix for this attempt.
        </p>
      </header>
      <MockBuilder availability={availability} />
    </main>
  );
}
