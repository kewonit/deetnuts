function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-base border-2 border-black bg-white/80 ${className}`}
    />
  );
}

export default function MhtCetAttemptLoading() {
  return (
    <main className="mx-auto grid max-w-7xl gap-5 p-5 pt-24">
      <div className="grid gap-4 rounded-base border-2 border-black bg-white p-4 shadow-base md:grid-cols-[1fr_auto]">
        <div className="grid gap-2">
          <SkeletonBlock className="h-8 max-w-72" />
          <SkeletonBlock className="h-5 max-w-xl" />
        </div>
        <SkeletonBlock className="h-11 w-40" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <aside className="grid gap-3 rounded-base border-2 border-black bg-white p-4 shadow-base">
          <SkeletonBlock className="h-8" />
          <div className="grid grid-cols-5 gap-2 lg:grid-cols-4">
            {Array.from({ length: 20 }).map((_, index) => (
              <SkeletonBlock className="aspect-square" key={index} />
            ))}
          </div>
        </aside>
        <section className="grid gap-5 rounded-base border-2 border-black bg-main p-5 shadow-base">
          <SkeletonBlock className="h-8 max-w-56" />
          <SkeletonBlock className="h-40" />
          <div className="grid gap-3">
            <SkeletonBlock className="h-14" />
            <SkeletonBlock className="h-14" />
            <SkeletonBlock className="h-14" />
            <SkeletonBlock className="h-14" />
          </div>
        </section>
      </div>
    </main>
  );
}
