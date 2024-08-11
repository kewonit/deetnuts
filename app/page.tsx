import Link from "next/link";
import Features from "@/components/ui/faq";
import arrow from '@/public/svg/arrow.svg'
import herogrid from '@/public/svg/herogrid.svg'
import Hero from "@/components/ui/hero";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import Marquee from "react-fast-marquee";

export default function Home() {
  return (
    <main>
      <div className="w-full pt-16 md:pt-[5.5rem]">
        <section className="flex flex-col items-center justify-center bg-main bg-cover bg-center bg-no-repeat px-5 pt-[100px] pb-[100px] m1000:py-[150px] m500:py-[120px]" style={{ backgroundImage: `url(${herogrid.src})` }}>
          <div className="pb-16">
            <h1 className="text-center font-heading text-7xl m1000:text-5xl">
              DEETNUTS
            </h1>
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
        </section>
      </div>
      <Features />
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
