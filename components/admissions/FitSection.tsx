export default function FitSection({ children }: { children: React.ReactNode }) {
  return (
    <section
      id="fit"
      className="mht-section mht-college-section"
      aria-labelledby="fit-title"
    >
      <div className="mht-page">
        <div className="mht-section-head">
          <div>
            <h2 id="fit-title">Exact eligibility check</h2>
            <p>
              The table above checks one seat. This applies your candidature type, category,
              minority status and certificates, and lists every seat pool you qualify for, with
              earlier years.
            </p>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}
