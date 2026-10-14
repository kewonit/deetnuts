import Image from "next/image";
import type { RepoPullRequest } from "@/lib/github-repo-activity";

export type PullRequestRow = RepoPullRequest & { year: string; date: string };

const STATE_LABELS = { merged: "Merged", open: "Open", closed: "Closed" } as const;

export function PullRequestList({ pulls }: { pulls: PullRequestRow[] }) {
  const years = new Map<string, PullRequestRow[]>();
  for (const pull of pulls) {
    const rows = years.get(pull.year);
    if (rows) rows.push(pull);
    else years.set(pull.year, [pull]);
  }

  return (
    <section className="crt-prs" aria-labelledby="crt-prs-title">
      <h2 id="crt-prs-title">
        Pull requests <span className="crt-count">{pulls.length}</span>
      </h2>

      {[...years].map(([year, rows]) => (
        <div className="crt-year" key={year}>
          <h3>{year}</h3>
          <ol className="crt-list">
            {rows.map((pull) => {
              const state = pull.state === "open" && pull.draft ? "Draft" : STATE_LABELS[pull.state];
              return (
                <li key={pull.number}>
                  <a className="crt-pr" href={pull.url} target="_blank" rel="noopener noreferrer">
                    <span className="crt-pr-num">#{pull.number}</span>
                    <span className="crt-pr-title" title={pull.title}>
                      {pull.title}
                    </span>
                    <span className="crt-pr-meta">
                      <span className="crt-pr-author">
                        {pull.author ? (
                          <>
                            <Image src={pull.author.avatar} alt="" width={18} height={18} />
                            {pull.author.login}
                          </>
                        ) : (
                          "ghost"
                        )}
                      </span>
                      <span className="crt-pr-state" data-state={pull.state}>
                        {state}
                      </span>
                      <time dateTime={pull.createdAt}>{pull.date}</time>
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </section>
  );
}
