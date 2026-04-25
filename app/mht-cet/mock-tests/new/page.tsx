import { MockBuilder } from "@/components/mht-cet/mock-tests/MockBuilder";

export default function NewMhtCetMockPage() {
  return (
    <main className="mx-auto grid max-w-5xl gap-8 p-5 pt-24">
      <header className="grid gap-2">
        <h1 className="font-heading text-4xl">Create Mock</h1>
        <p className="font-base text-lg">
          Choose the exact mix for this attempt.
        </p>
      </header>
      <MockBuilder />
    </main>
  );
}
