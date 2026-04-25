function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-base border-2 border-black bg-white/80 ${className}`}
    />
  );
}

export default function MhtCetResultsLoading() {
  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-5 pt-24">
      <header className="grid gap-3">
        <SkeletonBlock className="h-11 max-w-72" />
        <SkeletonBlock className="h-6 max-w-xl" />
      </header>
      <section className="grid gap-4 rounded-base border-2 border-black bg-main p-5 shadow-base sm:grid-cols-4">
        <SkeletonBlock className="h-24" />
        <SkeletonBlock className="h-24" />
        <SkeletonBlock className="h-24" />
        <SkeletonBlock className="h-24" />
      </section>
      <section className="grid gap-4 rounded-base border-2 border-black bg-white p-5 shadow-base">
        <SkeletonBlock className="h-8 max-w-56" />
        <SkeletonBlock className="h-44" />
        <SkeletonBlock className="h-44" />
      </section>
    </main>
  );
}
