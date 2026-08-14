import Link from "next/link";

import MobileDrawer from "@/components/MobileDrawer";
import NavDropdown from "@/components/NavDropdown";
import AuthButton from "./authbutton";
import { AiFillGithub } from "react-icons/ai";

const GITHUB_REPO_URL = "https://github.com/kewonit/deetnuts";
const GITHUB_REPO_API_URL = "https://api.github.com/repos/kewonit/deetnuts";

type GitHubRepoResponse = {
  stargazers_count?: number;
};

async function getGitHubStarCount(): Promise<number | null> {
  try {
    const response = await fetch(GITHUB_REPO_API_URL, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "deetnuts-navbar-star",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as GitHubRepoResponse;
    return typeof data.stargazers_count === "number"
      ? data.stargazers_count
      : null;
  } catch {
    return null;
  }
}

function formatStarCount(count: number | null): string | null {
  if (count === null) {
    return null;
  }

  return new Intl.NumberFormat("en", {
    notation: count >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(count);
}

const Navbar = async () => {
  const starCount = await getGitHubStarCount();
  const formattedStarCount = formatStarCount(starCount);

  return (
    <>
      <nav className="fixed sm:relative left-0 top-0 sm:top-auto z-20 mx-auto flex h-[88px] w-full items-center border-b-4 border-black bg-white px-5 m500:h-16 ">
        <div className="mx-auto flex w-[1300px] max-w-full items-center justify-between">
          <MobileDrawer githubStarCount={formattedStarCount} />

          <div className="flex items-center pl-5 m400:flex-1 m400:pl-5">
            <Link
              className="relative text-4xl font-heading m500:text-xl"
              href={"/"}
            >
              DEETNUTS
              <span className="absolute -top-3 -right-12 m500:-top-2 m500:-right-8 bg-purple-400 text-black text-xs font-bold px-2 py-0.5 rounded-full border-2 border-black rotate-12 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                BETA
              </span>
            </Link>
            <div className="site-desktop-nav-links ml-16 flex items-center m900:hidden">
              <NavDropdown />
            </div>
          </div>

          <div className="flex w-[320px] items-center justify-end gap-4 m900:w-[unset] m800:w-[unset] m400:gap-3">
            <a
              target="_blank"
              rel="noreferrer"
              href={GITHUB_REPO_URL}
              aria-label="Star DEETNUTS on GitHub"
              className="site-desktop-github flex items-center gap-2 rounded-base border-2 border-black bg-[#FFF4CC] px-3 py-2 font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none m900:hidden"
            >
              <AiFillGithub className="h-5 w-5" />
              <span className="text-sm leading-none">Star</span>
              {formattedStarCount ? (
                <span className="rounded-full border-2 border-black bg-white px-2 py-0.5 text-xs leading-none">
                  {formattedStarCount}
                </span>
              ) : (
                <span className="text-xs leading-none text-gray-700">
                  on GitHub
                </span>
              )}
            </a>
            <AuthButton />
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
