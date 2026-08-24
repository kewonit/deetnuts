import type { Metadata } from "next";
import { PolicyPage } from "@/components/compliance/PolicyPage";

export const metadata: Metadata = {
  title: "Open-source Notices",
  description: "Software licence and attribution notices for DEETNUTS and incorporated eJAM components.",
  alternates: { canonical: "/compliance/open-source-notices" },
};

export default function OpenSourceNotices() {
  const sourceCommit = process.env.NEXT_PUBLIC_SOURCE_COMMIT;
  return (
    <PolicyPage title="Open-source notices" summary="Software credits and notices are kept concise, traceable and separate from the public admissions-data methodology.">
      <section><h2>DEETNUTS software</h2><p>Original DEETNUTS software covered by the repository root licence is available under the MIT License, copyright 2024 Kewonit. The repository licence contains the operative permission and disclaimer text.</p></section>
      <section><h2>eJAM</h2><p>The JEE interface and supporting data tooling include work adapted from <a href="https://github.com/su6u/ejam">eJAM by su6u</a>, licensed AGPL-3.0-or-later. Its bundled <code>LICENSE</code> and <code>NOTICE</code> remain in the <code>ejam</code> directory.</p></section>
      <section><h2>Source for this version</h2>{sourceCommit ? <p>The deployed source corresponds to <a href={`https://github.com/kewonit/deetnuts/tree/${sourceCommit}`}>commit {sourceCommit}</a>.</p> : <p>This build was produced from a local worktree without publishing a Git commit link.</p>}</section>
      <section><h2>Other packages and assets</h2><p>Dependency notices and licence texts supplied with installed packages remain applicable to those packages. Third-party product names and logos are used only where needed to identify a service or source. JEE pages use local system font stacks and do not make a remote font request.</p></section>
      <section><h2>Admissions information</h2><p>Public cutoff pages are open to everyone. Their source lineage, exact fields, validation rules and correction process are documented on the <a href="/compliance/data-sources-and-licensing">data sources and methodology</a> page.</p></section>
    </PolicyPage>
  );
}
