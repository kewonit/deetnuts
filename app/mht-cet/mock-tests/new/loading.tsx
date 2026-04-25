function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-base border-2 border-black bg-white/80 ${className}`}
    />
  );
}

export default function NewMhtCetMockLoading() {
  return (
    <main className="mx-auto grid max-w-5xl gap-8 p-5 pt-24">
      <header className="grid gap-2">
        <SkeletonBlock className="h-10 max-w-64" />
        <SkeletonBlock className="h-7 max-w-xl" />
      </header>
      <section className="grid gap-6 rounded-base border-2 border-black bg-white p-5 shadow-base">
        <div className="grid gap-3 sm:grid-cols-4">
          <SkeletonBlock className="h-20" />
          <SkeletonBlock className="h-20" />
          <SkeletonBlock className="h-20" />
          <SkeletonBlock className="h-20" />
        </div>
        <SkeletonBlock className="h-12" />
        <div className="grid gap-3 sm:grid-cols-3">
          <SkeletonBlock className="h-24" />
          <SkeletonBlock className="h-24" />
          <SkeletonBlock className="h-24" />
        </div>
        <SkeletonBlock className="h-12 max-w-40" />
      </section>
    </main>
  );
}
