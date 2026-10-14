import type { Metadata } from "next";
import Image from "next/image";
import {
  PullRequestList,
  type PullRequestRow,
} from "@/components/creators/PullRequestList";
import {
  getRepoContributors,
  getRepoPullRequests,
} from "@/lib/github-repo-activity";
import { PRODUCTION_SITE_URL } from "@/lib/site-url";
import "@/components/creators/creators.css";

export const revalidate = 3600;

const REPO = "https://github.com/kewonit/deetnuts";
const description =
  "The people behind DEETNUTS and every pull request they opened.";

export const metadata: Metadata = {
  title: "Creators",
  description,
  openGraph: {
    title: "Creators | DEETNUTS",
    description,
    url: `${PRODUCTION_SITE_URL}/creators`,
    type: "website",
  },
  alternates: {
    canonical: `${PRODUCTION_SITE_URL}/creators`,
  },
};

const dayMonth = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Kolkata",
});
const yearOnly = new Intl.DateTimeFormat("en-IN", {
  year: "numeric",
  timeZone: "Asia/Kolkata",
});
const count = new Intl.NumberFormat("en-IN");

function plural(value: number, noun: string) {
  return `${count.format(value)} ${noun}${value === 1 ? "" : "s"}`;
}

export default async function CreatorsPage() {
  const [contributors, allPulls] = await Promise.all([
    getRepoContributors(),
    getRepoPullRequests(),
  ]);
  const pulls = allPulls?.filter((pull) => !pull.author?.bot) ?? null;

  const pullsByAuthor = new Map<string, number>();
  for (const pull of pulls ?? []) {
    if (pull.author)
      pullsByAuthor.set(
        pull.author.login,
        (pullsByAuthor.get(pull.author.login) ?? 0) + 1,
      );
  }

  const rows: PullRequestRow[] = (pulls ?? []).map((pull) => {
    const created = new Date(pull.createdAt);
    return {
      ...pull,
      year: yearOnly.format(created),
      date: dayMonth.format(created),
    };
  });

  return (
    <main className="mht-main">
      <div className="mht-page mht-page-wide crt-page">
        <header className="mht-head">
          <h1 className="mht-h1">Creators</h1>
        </header>

        {contributors && contributors.length > 0 ? (
          <ul className="crt-people">
            {contributors.map((person) => {
              const opened = pullsByAuthor.get(person.login) ?? 0;
              return (
                <li key={person.login}>
                  <a
                    className="crt-person"
                    href={person.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Image src={person.avatar} alt="" width={48} height={48} />
                    <span>
                      <strong>{person.login}</strong>
                      <small>
                        {plural(person.commits, "commit")}
                        {opened > 0
                          ? ` · ${plural(opened, "pull request")}`
                          : null}
                      </small>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        ) : null}

        {pulls ? (
          <PullRequestList pulls={rows} />
        ) : (
          <p className="crt-error">
            Couldn&apos;t reach GitHub.{" "}
            <a
              href={`${REPO}/pulls?q=is%3Apr`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open on GitHub
            </a>
          </p>
        )}
      </div>
    </main>
  );
}
