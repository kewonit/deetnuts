export default function FitSection({ children }: { children: React.ReactNode }) {
  return (
    <section
      id="fit"
      className="mht-section mht-college-section"
      aria-labelledby="fit-title"
    >
      <div className="mht-page">
        <div className="mht-section-head">
          <h2 id="fit-title">Eligibility check</h2>
        </div>
        {children}
      </div>
    </section>
  );
}
