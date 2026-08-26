import { Metadata } from "next";
import Features from "@/components/ui/faq";
import herogrid from "@/public/svg/herogrid.svg";
import Hero from "@/components/ui/hero";
import Marquee from "react-fast-marquee";
import SparklesText from "@/components/magicui/sparkles-text";
import CommunityPartners from "@/components/ui/community-partners";
import { PRODUCTION_SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "2026 MHT-CET Cutoffs & Admission Tools",
  description:
    "Plan 2026 Maharashtra engineering admissions with MHT-CET cutoffs, college data, seat matrices, and admission trends.",
  keywords: [
    "engineering admission 2026",
    "MHT-CET cutoffs",
    "Maharashtra engineering colleges",
    "college seat matrix",
    "admission trends",
  ],
  openGraph: {
    title: "2026 Engineering Admission Tools | DEETNUTS",
    description:
      "Plan 2026 Maharashtra engineering admissions with MHT-CET cutoffs, college data, seat matrices, and admission trends.",
    url: PRODUCTION_SITE_URL,
    type: "website",
  },
  alternates: {
    canonical: PRODUCTION_SITE_URL,
  },
};

export default function Home() {
  return (
    <main>
      <div className="w-full">
        <section
          className="flex flex-col items-center justify-center bg-main bg-cover bg-center bg-no-repeat px-5 pt-[100px] pb-[100px] m1000:py-[150px] m500:py-[120px]"
          style={{ backgroundImage: `url(${herogrid.src})` }}
        >
          <div className="pb-16">
            <div className="text-6xl tracking-tight text-center text-gray-900 sm:text-[96px]">
              <SparklesText text="DEETNUTS" />
            </div>
            <h2 className="text-center font-heading text-3xl m1000:text-2xl m500:text-xl m400:text-xl">
              clear college and admission data
            </h2>
          </div>
          <div className="relative w-full h-[50vh] flex justify-center items-center overflow-hidden">
            <picture className="w-full h-full">
              <source
                media="(min-width: 620px)"
                srcSet="https://res.cloudinary.com/dfyrk32ua/image/upload/v1722072593/deetnuts/2_m51gsx.png"
              />
              <img
                src="https://res.cloudinary.com/dfyrk32ua/image/upload/v1722072594/deetnuts/3_t0cm25.png"
                alt="DEETNUTS college and admission data for MHT-CET students"
                className="w-full h-full object-contain object-center"
              />
            </picture>
          </div>
        </section>
      </div>
      <Features />
      <CommunityPartners />
      <Marquee
        className="py-3 font-base sm:py-5 bg-gradient-to-r from-purple-300 to-yellow-100 border-b-[2px] border-b-black"
        direction="right"
      >
        {Array(10)
          .fill(null)
          .map((_, id) => (
            <div className="flex items-center" key={id}>
              <span className="mx-10 text-xl font-bold sm:text-2xl lg:text-4xl">
                clear college and admission data
              </span>
              <a className="text-2xl md:text-6xl" key={`emoji-${id}`}>
                {" "}
                🎀{" "}
              </a>
              <span className="mx-10 text-xl font-bold sm:text-2xl lg:text-4xl">
                source-backed MHT-CET data
              </span>
              <a className="text-2xl md:text-6xl" key={`emoji-${id}-2`}>
                {" "}
                🎀{" "}
              </a>
            </div>
          ))}
      </Marquee>
      <Hero />
    </main>
  );
}
