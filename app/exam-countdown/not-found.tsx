import Link from "next/link";
export default function NotFound() {
  return (
    <main className="max-w-xl mx-auto p-8">
      <h1 className="font-serif italic text-3xl mb-4">Countdown not found</h1>
      <p className="mb-6">
        This exam or category is not in TimeKeeper’s current directory.
      </p>
      <Link href="/exam-countdown" className="tk-button">
        Browse all exams
      </Link>
    </main>
  );
}
