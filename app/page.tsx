import Link from "next/link";
import Features from "@/components/ui/faq";
import arrow from '@/public/svg/arrow.svg'
import herogrid from '@/public/svg/herogrid.svg'
import Hero from "@/components/ui/hero";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import Marquee from "react-fast-marquee";
import SparklesText from "@/components/magicui/sparkles-text";
import CommunityPartners from "@/components/ui/community-partners";

export default function Home() {
  return (
    <main>
      <div className="w-full">
        <section className="flex flex-col items-center justify-center bg-main bg-cover bg-center bg-no-repeat px-5 pt-[100px] pb-[100px] m1000:py-[150px] m500:py-[120px]" style={{ backgroundImage: `url(${herogrid.src})` }}>
          <div className="pb-16">
            <div className="text-6xl tracking-tight text-center text-gray-900 sm:text-[96px]">
              <SparklesText text="DEETNUTS" />
            </div>
            <h2 className="text-center font-heading text-3xl m1000:text-2xl m500:text-xl m400:text-xl">
              mildly important college data simplified
            </h2>
          </div>
          <div className="relative w-full h-[50vh] flex justify-center items-center overflow-hidden">
            <picture className="w-full h-full">
              <source media="(min-width: 620px)" srcSet="https://res.cloudinary.com/dfyrk32ua/image/upload/v1722072593/deetnuts/2_m51gsx.png" />
              <img
                src="https://res.cloudinary.com/dfyrk32ua/image/upload/v1722072594/deetnuts/3_t0cm25.png"
                alt="Responsive Image"
                className="w-full h-full object-contain object-center"
              />
            </picture>
          </div>
          
          {/* NEW: Predictions CTA */}
          <div className="mt-12 w-full max-w-4xl">
            <Link href="/predictions">
              <div className="bg-gradient-to-r from-purple-300 to-yellow-100 border-4 border-black rounded-base shadow-base p-8 hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl">🔮</span>
                      <h3 className="font-heading text-2xl md:text-3xl">
                        JEE Main 2026 Predictions
                      </h3>
                    </div>
                    <p className="font-inter text-base md:text-lg text-gray-800">
                      AI-powered cutoff predictions for IITs, NITs, IIITs & GFTIs. 
                      Compare with 2025 data and find your ideal college!
                    </p>
                  </div>
                  <Button className="bg-black text-white border-2 border-black font-heading text-lg px-6 py-6 hover:bg-gray-800 whitespace-nowrap">
                    View Predictions →
                  </Button>
                </div>
              </div>
            </Link>
          </div>
        </section>
      </div>
      <Features />
      <CommunityPartners />
      <Marquee
        className="py-3 font-base sm:py-5 bg-gradient-to-r from-purple-300 to-yellow-100 border-b-[2px] border-b-black"
        direction="right"
      >
        {Array(10).fill(null).map((_, id) => (
          <div className="flex items-center" key={id}>
            <span className="mx-10 text-xl font-bold sm:text-2xl lg:text-4xl">
              mildly important college data simplified
            </span>
            <a className='text-2xl md:text-6xl' key={`emoji-${id}`}> 🎀 </a>
            <span className="mx-10 text-xl font-bold sm:text-2xl lg:text-4xl">
              self scrapped da data
            </span>
            <a className='text-2xl md:text-6xl' key={`emoji-${id}-2`}> 🎀 </a>
          </div>
        ))}
      </Marquee>
      <Hero />
    </main>
  );
}
