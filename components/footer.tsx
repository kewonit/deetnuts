import Link from "next/link";
import { CookieSettingsButton } from "@/components/analytics/CookieConsent";

const links = [
  { name: "JEE cutoffs", href: "/jee-cutoffs" },
  { name: "MHT-CET", href: "/mht-cet" },
  { name: "Data & licensing", href: "/compliance/data-sources-and-licensing" },
  { name: "Automated access", href: "/compliance/automated-access" },
  { name: "Privacy", href: "/compliance/privacy-policy" },
  { name: "Terms", href: "/compliance/terms-and-conditions" },
  { name: "Open-source notices", href: "/compliance/open-source-notices" },
];

export default function Footer() {
  const sourceCommit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_SOURCE_COMMIT;
  return <footer className="border-t-2 border-black bg-[#f7f4ff] font-sans text-black" data-nosnippet><div className="mx-auto max-w-screen-xl px-5 py-8"><div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between"><div className="max-w-2xl"><Link href="/" className="text-xl font-bold">DEETNUTS</Link><p className="mt-3 text-xs leading-5 text-gray-700">DEETNUTS is an independent educational-data project and is not affiliated with or endorsed by counselling authorities or listed institutions. Data may contain processing errors; verify admission decisions on the applicable official portal.</p></div><nav aria-label="Footer" className="flex max-w-xl flex-wrap gap-x-5 gap-y-3">{links.map((link) => <Link className="text-xs underline-offset-4 hover:underline" href={link.href} key={link.href}>{link.name}</Link>)}<CookieSettingsButton className="text-xs underline-offset-4 hover:underline" /></nav></div><div className="mt-6 flex flex-col gap-2 border-t border-black/20 pt-4 text-[11px] text-gray-600 sm:flex-row sm:items-center sm:justify-between"><span>DEETNUTS code: MIT · vendored eJAM code: AGPL-3.0-or-later · source data retains its publishers’ terms.</span>{sourceCommit ? <a className="underline" href={`https://github.com/kewonit/deetnuts/tree/${sourceCommit}`}>Source for this version</a> : <Link className="underline" href="/compliance/open-source-notices">Source and licence details</Link>}</div></div></footer>;
}
