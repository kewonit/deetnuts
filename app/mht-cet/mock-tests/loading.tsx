function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-base border-2 border-black bg-white/80 ${className}`}
    />
  );
}

export default function MhtCetMockTestsLoading() {
  return (
    <main className="mx-auto grid max-w-6xl gap-8 p-5 pt-24">
      <header className="grid gap-3">
        <SkeletonBlock className="h-12 max-w-xl" />
        <SkeletonBlock className="h-7 max-w-2xl" />
      </header>
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="grid gap-5 rounded-base border-2 border-black bg-main p-5 shadow-base">
          <SkeletonBlock className="h-10 max-w-xs" />
          <SkeletonBlock className="h-6 max-w-lg" />
          <div className="grid gap-3 sm:grid-cols-3">
            <SkeletonBlock className="h-24" />
            <SkeletonBlock className="h-24" />
            <SkeletonBlock className="h-24" />
          </div>
        </section>
        <section className="grid gap-4 rounded-base border-2 border-black bg-white p-5 shadow-base">
          <SkeletonBlock className="h-8 max-w-40" />
          <SkeletonBlock className="h-12" />
          <SkeletonBlock className="h-12" />
          <SkeletonBlock className="h-12" />
        </section>
      </div>
      <section className="grid gap-4">
        <SkeletonBlock className="h-9 max-w-64" />
        <div className="overflow-hidden rounded-base border-2 border-black bg-white shadow-base">
          <SkeletonBlock className="h-24 rounded-none border-0 border-b-2" />
          <SkeletonBlock className="h-24 rounded-none border-0 border-b-2" />
          <SkeletonBlock className="h-24 rounded-none border-0" />
        </div>
      </section>
    </main>
  );
}
