"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Menu } from "@base-ui/react/menu";
import { NavigationMenu } from "@base-ui/react/navigation-menu";
import { ChevronDown, LogOut, SunMoon, UserRound } from "lucide-react";
import { signOut } from "@/app/login/actions";
import { BrandIcon } from "@/components/brand-icons";
import { useGitHubStarLabel } from "@/components/GitHubStarCount";
import { LoginLink } from "@/components/login-link";
import { openThemeSettings } from "@/components/theme/ThemeSettings";
import { googleSans } from "@/components/admissions/mht-font";
import "./site-nav.css";

const REPO = "https://github.com/kewonit/deetnuts";
// Portaled popups sit outside the header, so they carry the tokens and font themselves.
const LAYER = `site-nav-layer ${googleSans.variable}`;

type NavLink = { href: string; label: string; exact?: boolean };
type NavGroup = { label: string; sections: string[]; links: NavLink[] };

const GROUPS: NavGroup[] = [
  {
    label: "MHT-CET",
    sections: ["/mht-cet"],
    links: [
      { href: "/mht-cet", label: "Overview", exact: true },
      { href: "/mht-cet/colleges", label: "Colleges" },
      { href: "/mht-cet/state-cutoffs", label: "State cutoffs" },
      { href: "/mht-cet/all-india-cutoffs", label: "All India cutoffs" },
    ],
  },
  {
    label: "JEE",
    sections: [
      "/jee-cutoffs",
      "/jee-main",
      "/jee-advanced",
      "/josaa",
      "/college-predictor",
    ],
    links: [
      { href: "/jee-cutoffs", label: "Overview", exact: true },
      { href: "/jee-main/colleges", label: "JEE Main colleges" },
      { href: "/jee-advanced/colleges", label: "JEE Advanced colleges" },
      { href: "/college-predictor", label: "College predictor" },
    ],
  },
];

const EXAM_COUNTDOWN: NavLink = {
  href: "/exam-countdown",
  label: "Exam countdown",
};

// Static JEE pages skip the session request so they stay cacheable.
const SESSIONLESS_PREFIXES = [
  "/jee-cutoffs",
  "/jee-main",
  "/jee-advanced",
  "/josaa",
];

interface SessionUser {
  name: string;
  avatarUrl: string | null;
}

function within(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isCurrent(pathname: string, link: NavLink) {
  return link.exact ? pathname === link.href : within(pathname, link.href);
}

function useSessionUser(pathname: string) {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    if (SESSIONLESS_PREFIXES.some((prefix) => within(pathname, prefix))) return;
    const controller = new AbortController();
    void fetch("/api/auth/session", {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : { user: null }))
      .then((data: { user?: SessionUser | null }) => setUser(data.user || null))
      .catch((error) => {
        if (error instanceof Error && error.name !== "AbortError")
          setUser(null);
      });
    return () => controller.abort();
  }, [pathname]);

  return user;
}

function DropdownLink({ link, pathname }: { link: NavLink; pathname: string }) {
  const current = isCurrent(pathname, link);
  return (
    <NavigationMenu.Link
      active={current}
      aria-current={current ? "page" : undefined}
      closeOnClick
      className="site-nav-item"
      render={<Link href={link.href} />}
    >
      {link.label}
    </NavigationMenu.Link>
  );
}

function AccountMenu({ user }: { user: SessionUser }) {
  const firstName = user.name.trim().split(/\s+/)[0] || "Account";
  const avatar = user.avatarUrl || "/avatar.webp";
  const signOutForm = useRef<HTMLFormElement>(null);

  return (
    <>
      <form ref={signOutForm} action={signOut} hidden />
      <Menu.Root modal={false}>
        <Menu.Trigger className="site-nav-account" aria-label="Account menu">
          {/* eslint-disable-next-line @next/next/no-img-element -- avatars come from any OAuth host. */}
          <img src={avatar} alt="" width={24} height={24} />
          <span>{firstName}</span>
          <ChevronDown aria-hidden="true" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={LAYER} sideOffset={8} align="end">
            <Menu.Popup className="site-nav-popup site-nav-menu">
              <div className="site-nav-menu-head">{user.name}</div>
              <Menu.Separator className="site-nav-sep" />
              <Menu.LinkItem
                className="site-nav-item"
                closeOnClick
                render={<Link href="/account" />}
              >
                <UserRound aria-hidden="true" />
                Account
              </Menu.LinkItem>
              <Menu.Item className="site-nav-item" onClick={openThemeSettings}>
                <SunMoon aria-hidden="true" />
                Theme
              </Menu.Item>
              <Menu.Separator className="site-nav-sep" />
              <Menu.Item
                className="site-nav-item"
                onClick={() => signOutForm.current?.requestSubmit()}
              >
                <LogOut aria-hidden="true" />
                Log out
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </>
  );
}

export function SiteNavbar() {
  const pathname = usePathname();
  const stars = useGitHubStarLabel();
  const user = useSessionUser(pathname);
  const [sheetOpen, setSheetOpen] = useState(false);
  // The header persists across navigations, so a tapped link closes the phone menu itself.
  const closeSheet = () => setSheetOpen(false);

  const groupCurrent = (group: NavGroup) =>
    group.sections.some((section) => within(pathname, section));
  const countdownCurrent = within(pathname, EXAM_COUNTDOWN.href);

  return (
    <header className={`site-nav ${googleSans.variable}`}>
      <div className="site-nav-inner">
        <Link href="/" className="site-nav-mark">
          DEETNUTS
        </Link>

        <NavigationMenu.Root className="site-nav-root" aria-label="Main">
          <NavigationMenu.List className="site-nav-list">
            {GROUPS.map((group) => (
              <NavigationMenu.Item key={group.label} value={group.label}>
                <NavigationMenu.Trigger
                  className="site-nav-trigger"
                  data-current={groupCurrent(group) || undefined}
                >
                  {group.label}
                  <NavigationMenu.Icon className="site-nav-caret">
                    <ChevronDown aria-hidden="true" />
                  </NavigationMenu.Icon>
                </NavigationMenu.Trigger>
                {/* keepMounted keeps every section link in the server HTML for crawlers. */}
                <NavigationMenu.Content className="site-nav-content" keepMounted>
                  <ul>
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <DropdownLink link={link} pathname={pathname} />
                      </li>
                    ))}
                  </ul>
                </NavigationMenu.Content>
              </NavigationMenu.Item>
            ))}
            <NavigationMenu.Item>
              <NavigationMenu.Link
                active={countdownCurrent}
                aria-current={countdownCurrent ? "page" : undefined}
                className="site-nav-trigger"
                data-current={countdownCurrent || undefined}
                render={<Link href={EXAM_COUNTDOWN.href} />}
              >
                {EXAM_COUNTDOWN.label}
              </NavigationMenu.Link>
            </NavigationMenu.Item>
          </NavigationMenu.List>

          <NavigationMenu.Portal>
            <NavigationMenu.Positioner
              className={`${LAYER} site-nav-positioner`}
              sideOffset={8}
              align="start"
            >
              <NavigationMenu.Popup className="site-nav-popup site-nav-dropdown">
                <NavigationMenu.Viewport className="site-nav-viewport" />
              </NavigationMenu.Popup>
            </NavigationMenu.Positioner>
          </NavigationMenu.Portal>
        </NavigationMenu.Root>

        <div className="site-nav-end">
          <a
            className="site-nav-star"
            href={REPO}
            target="_blank"
            rel="noreferrer"
            aria-label="Star DEETNUTS on GitHub"
          >
            <BrandIcon name="github" />
            {stars ? <span>{stars}</span> : null}
          </a>
          {user ? (
            <AccountMenu user={user} />
          ) : (
            <LoginLink className="site-nav-login" />
          )}

          <Dialog.Root open={sheetOpen} onOpenChange={setSheetOpen}>
            <Dialog.Trigger className="site-nav-burger" aria-label="Menu">
              <svg
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path
                  d={
                    sheetOpen
                      ? "M4.5 4.5l9 9M13.5 4.5l-9 9"
                      : "M3 6.5h12M3 11.5h12"
                  }
                />
              </svg>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop className={`${LAYER} site-nav-backdrop`} />
              <Dialog.Popup className={`${LAYER} site-nav-sheet`}>
                <Dialog.Title className="site-nav-sr">Menu</Dialog.Title>
                <nav aria-label="Main">
                  {GROUPS.map((group) => (
                    <section key={group.label}>
                      <h2>{group.label}</h2>
                      {group.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          aria-current={
                            isCurrent(pathname, link) ? "page" : undefined
                          }
                          onClick={closeSheet}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </section>
                  ))}
                  <section>
                    <Link
                      href={EXAM_COUNTDOWN.href}
                      aria-current={countdownCurrent ? "page" : undefined}
                      onClick={closeSheet}
                    >
                      {EXAM_COUNTDOWN.label}
                    </Link>
                    <a
                      href={REPO}
                      target="_blank"
                      rel="noreferrer"
                      onClick={closeSheet}
                    >
                      GitHub{stars ? <span>{stars}</span> : null}
                    </a>
                  </section>
                </nav>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
