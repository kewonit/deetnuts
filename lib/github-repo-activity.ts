import "server-only";

const REPO_API_URL = "https://api.github.com/repos/kewonit/deetnuts";
// GitHub allows 60 unauthenticated requests an hour; the page needs two per refresh.
const REVALIDATE_SECONDS = 3600;
const MAX_PAGES = 10;

type GitHubUser = {
  login: string;
  html_url: string;
  avatar_url: string;
  type: string;
};

interface GitHubPull {
  number: number;
  title: string;
  html_url: string;
  state: "open" | "closed";
  draft?: boolean;
  created_at: string;
  merged_at: string | null;
  user: GitHubUser | null;
}

interface GitHubContributor extends GitHubUser {
  contributions: number;
}

export type PullRequestState = "merged" | "open" | "closed";

export interface RepoPullRequest {
  number: number;
  title: string;
  url: string;
  state: PullRequestState;
  draft: boolean;
  createdAt: string;
  author: { login: string; url: string; avatar: string; bot: boolean } | null;
}

export interface RepoContributor {
  login: string;
  url: string;
  avatar: string;
  commits: number;
}

async function getGitHubPages<T>(path: string): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const separator = path.includes("?") ? "&" : "?";
    const response = await fetch(
      `${REPO_API_URL}${path}${separator}per_page=100&page=${page}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "deetnuts-creators",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        next: { revalidate: REVALIDATE_SECONDS },
      },
    );
    if (!response.ok)
      throw new Error(`GitHub ${path} returned ${response.status}`);
    const batch = (await response.json()) as T[];
    items.push(...batch);
    if (batch.length < 100) break;
  }
  return items;
}

// Every pull request to the repository, newest first. Null when GitHub is unavailable.
export async function getRepoPullRequests(): Promise<RepoPullRequest[] | null> {
  try {
    const pulls = await getGitHubPages<GitHubPull>("/pulls?state=all");
    return pulls.map((pull) => ({
      number: pull.number,
      title: pull.title.trim(),
      url: pull.html_url,
      state: pull.merged_at ? "merged" : pull.state,
      draft: Boolean(pull.draft),
      createdAt: pull.created_at,
      author: pull.user
        ? {
            login: pull.user.login.replace(/\[bot\]$/, ""),
            url: pull.user.html_url,
            avatar: pull.user.avatar_url,
            bot: pull.user.type === "Bot",
          }
        : null,
    }));
  } catch {
    return null;
  }
}

// People with commits on the default branch, most commits first. Bots are left out.
export async function getRepoContributors(): Promise<RepoContributor[] | null> {
  try {
    const contributors =
      await getGitHubPages<GitHubContributor>("/contributors");
    return contributors
      .filter((contributor) => contributor.type === "User")
      .map((contributor) => ({
        login: contributor.login,
        url: contributor.html_url,
        avatar: contributor.avatar_url,
        commits: contributor.contributions,
      }));
  } catch {
    return null;
  }
}
