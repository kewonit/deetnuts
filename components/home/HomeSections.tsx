import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ExternalLink, FileText, Search } from "lucide-react";
import { IntentPrefetchLink } from "@/components/admissions/IntentPrefetchLink";
import {
  DEETNUTS_WORDMARK_PATH,
  DEETNUTS_WORDMARK_VIEWBOX,
} from "@/components/deetnuts-wordmark";

export interface PreviewRow {
  path: string;
  name: string;
  program: string;
  value: string;
}

export interface FeaturedCollege {
  code: string;
  name: string;
  place: string;
  title: string;
  path: string;
  logo: { src: string; background?: string } | null;
  campus: { src: string; position: string } | null;
}

export interface ToolLink {
  href: string;
  title: string;
  fact: string;
}

export interface Stat {
  label: string;
  value: string;
}

/* ---------------------------------------------------------------- Hero */

export function HomeHero({
  rows,
  pool,
}: {
  rows: PreviewRow[];
  pool: string;
}) {
  return (
    <header className="home-hero">
      <svg
        className="home-mark"
        viewBox={DEETNUTS_WORDMARK_VIEWBOX}
        role="img"
        aria-label="DEETNUTS"
      >
        <path d={DEETNUTS_WORDMARK_PATH} />
      </svg>
      <h1 className="home-tagline">clear college and admission data</h1>
      <form
        action="/mht-cet/colleges"
        role="search"
        className="mht-search mht-search-lg home-search"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="7" cy="7" r="4.75" />
          <path d="m10.5 10.5 3 3" />
        </svg>
        <input
          type="search"
          name="q"
          placeholder="Find a college"
          aria-label="Find a college"
          autoComplete="off"
          enterKeyHint="search"
        />
      </form>

      <div className="home-flow">
        <figure className="home-flow-from">
          <Image
            src="/home/cap-pdfs.webp"
            alt="CAP allotment PDFs published by the State CET Cell"
            width={759}
            height={454}
            sizes="(min-width: 960px) 30rem, 92vw"
            fetchPriority="high"
          />
          <figcaption>
            <FileText aria-hidden="true" />
            Official CAP allotment PDFs
          </figcaption>
        </figure>

        <div className="home-flow-arrow" aria-hidden="true">
          <span className="home-flow-line" />
          <span className="home-flow-node">
            <svg viewBox={DEETNUTS_WORDMARK_VIEWBOX}>
              <path d={DEETNUTS_WORDMARK_PATH} />
            </svg>
          </span>
          <span className="home-flow-line home-flow-line-end" />
        </div>

        <figure className="home-flow-to">
          <div className="home-preview">
            <div className="home-preview-head">
              <Link className="home-preview-title" href="/mht-cet/state-cutoffs">
                State cutoffs
              </Link>
              <span className="mht-chip">{pool}</span>
            </div>
            <div className="home-preview-cols" aria-hidden="true">
              <span>College</span>
              <span>Open percentile</span>
            </div>
            <ol className="home-preview-rows">
              {rows.map((row, index) => (
                <li key={row.path}>
                  <IntentPrefetchLink href={row.path}>
                    <span className="home-preview-n">{index + 1}</span>
                    <span className="home-preview-name">
                      <strong>{row.name}</strong>
                      <small>{row.program}</small>
                    </span>
                    <span className="home-preview-v">{row.value}</span>
                  </IntentPrefetchLink>
                </li>
              ))}
            </ol>
          </div>
          <figcaption>
            <Search aria-hidden="true" />
            Searchable on DEETNUTS
          </figcaption>
        </figure>
      </div>
    </header>
  );
}

/* --------------------------------------------------------------- Tools */

function ToolHead({
  icon,
  title,
  text,
  action,
  href,
}: {
  icon: string;
  title: string;
  text: string;
  action: string;
  href: string;
}) {
  return (
    <>
      <div className="home-tool-head">
        <span className="home-tool-icon">
          <Image src={icon} alt="" width={40} height={40} />
        </span>
        <h3>{title}</h3>
        <Link className="mht-btn mht-btn-sm home-tool-cta" href={href}>
          {action}
        </Link>
      </div>
      <p className="home-tool-text">{text}</p>
    </>
  );
}

function StatRow({ stats }: { stats: Stat[] }) {
  return (
    <dl className="home-tool-stats">
      {stats.map((stat) => (
        <div key={stat.label}>
          <dt>{stat.label}</dt>
          <dd>{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function HomeTools({
  mhtLinks,
  logos,
  jeeMain,
  jeeAdvanced,
}: {
  mhtLinks: ToolLink[];
  logos: FeaturedCollege[];
  jeeMain: Stat[];
  jeeAdvanced: Stat[];
}) {
  return (
    <section className="home-section" aria-labelledby="home-tools-title">
      <h2 id="home-tools-title" className="home-h2">
        College Admission Tools
      </h2>
      <div className="home-bento">
        <article className="home-tool home-tool-mht">
          <ToolHead
            icon="/ejam/exams/mht_cet.webp"
            title="MHT-CET"
            text="Find cutoffs, placements, and reviews for MH Engineering Colleges."
            action="Explore"
            href="/mht-cet"
          />
          <ul className="home-tool-links">
            {mhtLinks.map((link, index) => (
              <li key={link.href}>
                <Link href={link.href}>
                  <span className="home-tool-link-title">{link.title}</span>
                  <span className="home-tool-link-fact">{link.fact}</span>
                  {index === mhtLinks.length - 1 && logos.length > 0 ? (
                    <span className="home-logo-stack" aria-hidden="true">
                      {logos.map((college) =>
                        college.logo ? (
                          <Image
                            key={college.code}
                            src={college.logo.src}
                            alt=""
                            width={32}
                            height={32}
                            style={
                              college.logo.background
                                ? { background: college.logo.background }
                                : undefined
                            }
                          />
                        ) : null,
                      )}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </article>

        <article className="home-tool">
          <ToolHead
            icon="/ejam/exams/jee_main.webp"
            title="JEE Main"
            text="Predict NIT, IIIT, and GFTI admission chances using JoSAA and CSAB data."
            action="Predict"
            href="/college-predictor?exam=jee-main"
          />
          {jeeMain.length > 0 ? <StatRow stats={jeeMain} /> : null}
        </article>

        <article className="home-tool">
          <ToolHead
            icon="/ejam/exams/jee_adv.webp"
            title="JEE Advanced"
            text="Predict IIT admission chances using historical JoSAA cutoffs."
            action="Predict"
            href="/college-predictor?exam=jee-advanced"
          />
          {jeeAdvanced.length > 0 ? <StatRow stats={jeeAdvanced} /> : null}
        </article>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- Community */

const PARTNERS = [
  {
    name: "r/mht_cet",
    description:
      "Community for MHT-CET aspirants to discuss exams, colleges, and admissions.",
    url: "https://www.reddit.com/r/mht_cet/",
    members: "32k+",
    logo: "https://res.cloudinary.com/dfyrk32ua/image/upload/v1743018533/deetnuts/communityIcon_a7um82b5fowa1_rifsjq.webp",
    banner:
      "https://res.cloudinary.com/dfyrk32ua/image/upload/v1743018683/deetnuts/bannerBackgroundImage_pgczyvumruxa1_ji8x8s.webp",
    highlights: ["Exam Prep", "College Reviews"],
  },
];

export function HomeCommunity() {
  return (
    <section
      className="home-section home-community"
      aria-labelledby="home-community-title"
    >
      <div className="home-community-copy">
        <h2 id="home-community-title" className="home-h2">
          Get Advice From Real Students
        </h2>
        <p className="home-lede">
          Join our official Reddit partners where students share experiences and
          advice
        </p>
      </div>

      {PARTNERS.map((partner) => (
        <article key={partner.url} className="home-partner">
          <div
            className="home-partner-banner"
            style={{ backgroundImage: `url(${partner.banner})` }}
          />
          <div className="home-partner-top">
            <span className="home-partner-logo">
              <Image src={partner.logo} alt="" width={88} height={88} />
            </span>
            <a
              className="mht-btn mht-btn-primary"
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Join
              <ExternalLink aria-hidden="true" />
            </a>
          </div>
          <div className="home-partner-body">
            <h3>
              {partner.name}
              <BadgeCheck aria-label="Verified" />
            </h3>
            <p className="home-partner-meta">
              Reddit community with{" "}
              <span className="mht-num">{partner.members}</span> members
            </p>
            <p className="home-partner-desc">{partner.description}</p>
            <ul className="home-partner-tags">
              {partner.highlights.map((highlight) => (
                <li key={highlight} className="mht-chip">
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        </article>
      ))}
    </section>
  );
}

/* --------------------------------------------------------------- Stats */

export function HomeStats({ stats }: { stats: Stat[] }) {
  return (
    <section className="home-stats" aria-labelledby="home-stats-title">
      <div className="home-stats-head">
        <h2 id="home-stats-title">Built on official records</h2>
        <Link className="mht-arrow-link" href="/datasource">
          Where our data comes from
        </Link>
      </div>
      <dl className="home-stats-grid">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ------------------------------------------------------------- Closing */

export function HomeClosing({ colleges }: { colleges: FeaturedCollege[] }) {
  return (
    <section className="home-closing" aria-labelledby="home-closing-title">
      <div className="home-closing-copy">
        <h2 id="home-closing-title">
          Easier than ever before.
          <br />
          Start using our app today.
        </h2>
        <p>
          All the data you need to make an informed decision about colleges in
          one place.
        </p>
        <div className="home-closing-cta">
          <Link className="mht-btn mht-btn-primary" href="/mht-cet">
            MHT-CET cutoffs
          </Link>
          <Link className="mht-btn mht-btn-ghost" href="/jee-cutoffs">
            JEE cutoffs
          </Link>
        </div>
      </div>

      {colleges.length > 0 ? (
        <ul className="home-campus">
          {colleges.map((college) => (
            <li key={college.code}>
              <IntentPrefetchLink
                className="home-campus-card"
                href={college.path}
                title={college.title}
              >
                <span className="home-campus-photo">
                  {college.campus ? (
                    <Image
                      src={college.campus.src}
                      alt=""
                      fill
                      sizes="(min-width: 960px) 16rem, 45vw"
                      style={{ objectPosition: college.campus.position }}
                    />
                  ) : null}
                </span>
                <span className="home-campus-logo">
                  {college.logo ? (
                    <Image
                      src={college.logo.src}
                      alt=""
                      width={44}
                      height={44}
                      style={
                        college.logo.background
                          ? { background: college.logo.background }
                          : undefined
                      }
                    />
                  ) : (
                    college.name.charAt(0)
                  )}
                </span>
                <span className="home-campus-name">
                  <strong>{college.name}</strong>
                  <small>{college.place}</small>
                </span>
              </IntentPrefetchLink>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
