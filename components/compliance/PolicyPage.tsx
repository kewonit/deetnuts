import { COMPLIANCE } from "@/lib/compliance";

export type PolicySection = { id: string; label: string };

/** A numbered policy section whose heading stays in step with the contents list. */
export function Clause({
  sections,
  id,
  children,
}: {
  sections: readonly PolicySection[];
  id: string;
  children: React.ReactNode;
}) {
  const index = sections.findIndex((section) => section.id === id);
  if (index === -1) throw new Error(`Unknown policy section: ${id}`);
  return (
    <section id={id}>
      <h2>{index + 1}. {sections[index].label}</h2>
      {children}
    </section>
  );
}

export function PolicyPage({
  title,
  contents,
  children,
}: {
  title: string;
  contents?: readonly PolicySection[];
  children: React.ReactNode;
}) {
  return (
    <main className="policy-page">
      <div className="policy-page-inner">
        <header className="policy-header">
          <h1>{title}</h1>
          <dl className="policy-meta">
            <div><dt>Effective date</dt><dd>{COMPLIANCE.effectiveDate}</dd></div>
            <div><dt>Version</dt><dd>{COMPLIANCE.policyVersion}</dd></div>
            <div><dt>Contact</dt><dd><a href={`mailto:${COMPLIANCE.privacyEmail}`}>{COMPLIANCE.privacyEmail}</a></dd></div>
          </dl>
        </header>
        {contents && contents.length > 0 ? (
          <nav className="policy-contents" aria-labelledby="policy-contents-heading">
            <h2 id="policy-contents-heading">Contents</h2>
            <ol>
              {contents.map((section) => <li key={section.id}><a href={`#${section.id}`}>{section.label}</a></li>)}
            </ol>
          </nav>
        ) : null}
        <article className="policy-content">{children}</article>
      </div>
    </main>
  );
}
