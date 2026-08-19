export default function AdmissionsLoading() {
  return (
    <main data-admissions-full-page="true" className="admissions-surface min-h-screen bg-[#f6f7fb]" aria-busy="true">
      <div className="h-16 border-b border-slate-200 bg-white" />
      <div className="mx-auto max-w-[1440px] animate-pulse space-y-6 px-4 py-8 sm:px-6">
        <div className="admissions-panel h-56" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="space-y-6">
            <div className="admissions-panel h-80" />
            <div className="admissions-panel h-96" />
          </div>
          <div className="admissions-panel hidden h-64 lg:block" />
        </div>
      </div>
      <span className="sr-only">Loading admission details</span>
    </main>
  );
}
