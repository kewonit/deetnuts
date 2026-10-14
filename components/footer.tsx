import Link from "next/link";
import { CookieSettingsButton } from "@/components/analytics/CookieConsent";
import { DEETNUTS_WORDMARK_PATH, DEETNUTS_WORDMARK_VIEWBOX } from "@/components/deetnuts-wordmark";

export default function Footer() {
  const legalLinks = [
    { name: "Terms & Conditions", href: "/compliance/terms-and-conditions" },
    { name: "Privacy Policy", href: "/compliance/privacy-policy" },
    { name: "Cookie Policy", href: "/compliance/cookie-policy" },
  ];

  const serviceLinks = [
    { name: "MHT-CET Cutoffs", href: "/mht-cet" },
  ];

  const Tools = [
    { name: "Home", href: "/" },
    { name: "MHT-CET Colleges", href: "/mht-cet/colleges" },
  ];

  const Contribute = [
    { name: "Data Sources", href: "/datasource" },
    { name: "Creators", href: "/creators" },
    { name: "GitHub", href: "https://github.com/kewonit/deetnuts" },
  ];

  return (
    <footer className="legacy-site-footer bg-gradient-to-b from-purple-300 to-yellow-100 border-t-2 border-t-black">
      <div className="font-sans">
        <div className="mx-auto max-w-screen-xl space-y-8 px-4 py-16 sm:px-6 lg:space-y-16 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-x-8">
            <div className="lg:col-span-6">
              <div className="text-black text-4xl font-heading">DeetNuts</div>

              <p
                className="mt-4 max-w-lg text-gray-500 leading-snug"
                data-nosnippet
              >
                DEETNUTS is an independent educational-data project and is not
                affiliated with or endorsed by any examination authority,
                counselling body, college, or listed institution. College and
                counselling data is compiled from published sources and may
                contain transcription or processing errors. Figures, listings,
                eligibility details, seat availability, and deadlines may
                change. Always verify admission decisions on the applicable
                official portal.
              </p>
              <a
                href="https://discord.gg/xbtqGcQ6SF"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-block text-sm font-bold text-gray-800 transition hover:underline"
              >
                Join our Discord for updates &amp; support
              </a>
            </div>

            <div className="lg:col-span-2">
              <p className="font-bold text-gray-900">Cutoffs</p>

              <ul className="mt-6 space-y-4 text-sm">
                {serviceLinks.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-gray-700 transition hover:opacity-75"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2">
              <p className="font-bold text-gray-900">Tools</p>

              <ul className="mt-6 space-y-4 text-sm">
                {Tools.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-gray-700 transition hover:opacity-75"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2">
              <p className="font-bold text-gray-900">Contribute</p>

              <ul className="mt-6 space-y-4 text-sm">
                {Contribute.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-gray-700 transition hover:opacity-75"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="border-y-[1px] border-y-black">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="text-center md:text-left">
                <p className="text-xs text-gray-500">
                  DeetNuts,{" "}
                  <a
                    className="hover:underline"
                    href="https://github.com/kewonit/deetnuts/blob/main/LICENSE"
                  >
                    MIT License {new Date().getFullYear()}
                  </a>
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Meow 👋! I&apos;m Kartik, the creator. You can follow me on{" "}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://x.com/kewonit"
                  >
                    Twitter
                  </a>
                  !
                </p>
              </div>
              <div className="mt-8 md:mt-0">
                <ul className="flex flex-wrap justify-center gap-4 md:justify-end">
                  {legalLinks.map((link, index) => (
                    <li key={index}>
                      <Link
                        href={link.href}
                        className="text-xs text-gray-500 transition hover:text-gray-700 hover:underline"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <CookieSettingsButton className="text-xs text-gray-500 transition hover:text-gray-700 hover:underline" />
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center pt-8 px-4 md:px-20" data-legacy-wordmark>
          <svg
            width="1200px"
            viewBox={DEETNUTS_WORDMARK_VIEWBOX}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d={DEETNUTS_WORDMARK_PATH}
              fill="url(#paint0_linear_58_2)"
            />
            <defs>
              <linearGradient
                id="paint0_linear_58_2"
                x1="537"
                y1="148"
                x2="537"
                y2="-5"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#FFF4E0" stopOpacity="0" />
                <stop offset="0.765" stopColor="#D1B0F9" stopOpacity="0.825" />
                <stop offset="1" stopColor="#C7A1FE" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </footer>
  );
}
