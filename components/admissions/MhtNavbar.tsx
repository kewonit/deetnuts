"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { AiFillGithub } from "react-icons/ai";
import AuthButton from "@/components/authbutton";
import { useGitHubStarLabel } from "@/components/GitHubStarCount";
import { MHT_LAYER } from "@/components/admissions/mht-font";

const GITHUB_REPO_URL = "https://github.com/kewonit/deetnuts";

const LINKS = [
  { href: "/mht-cet/colleges", label: "Colleges" },
  { href: "/mht-cet/state-cutoffs", label: "State cutoffs" },
  { href: "/mht-cet/all-india-cutoffs", label: "All India" },
];

function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MhtNavbar() {
  const pathname = usePathname();
  const stars = useGitHubStarLabel();
  const menu = useRef<HTMLDetailsElement>(null);

  // The navbar lives in the section layout, so it survives navigation; close the menu on arrival.
  useEffect(() => {
    if (menu.current) menu.current.open = false;
  }, [pathname]);

  const links = LINKS.map((link) => (
    <Link
      key={link.href}
      href={link.href}
      aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
    >
      {link.label}
    </Link>
  ));

  return (
    <header className="mht-nav">
      <div className="mht-nav-inner">
        <Link href="/" className="mht-nav-mark">
          DEETNUTS
        </Link>
        <nav className="mht-nav-links" aria-label="MHT-CET">
          {links}
        </nav>
        <div className="mht-nav-end">
          <a
            className="mht-nav-star"
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Star DEETNUTS on GitHub"
          >
            <AiFillGithub aria-hidden="true" />
            {stars ? <span>{stars}</span> : null}
          </a>
          <AuthButton quiet className="mht-nav-login" menuClassName={`${MHT_LAYER} mht-menu`} />
          <details ref={menu} className="mht-nav-menu">
            <summary aria-label="Menu">
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                <path d="M3 6.5h12M3 11.5h12" />
              </svg>
            </summary>
            <nav className="mht-nav-sheet" aria-label="MHT-CET">
              <Link href="/mht-cet" aria-current={pathname === "/mht-cet" ? "page" : undefined}>
                MHT-CET
              </Link>
              {links}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
