import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import {
  homeHeaderContainerClass,
  homePageContainerClass,
} from "@/components/app-layout";
import { HomeManifesto } from "@/components/home/home-manifesto";
import { HomeRequestTool } from "@/components/home/home-request-tool";
import { HomeSmoothScroll } from "@/components/home/home-smooth-scroll";
import { HomeToolsSection } from "@/components/home/home-tools-section";
import { HomeTagline } from "@/components/home-tagline";
import { pressableClass } from "@/lib/pressable";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "ejam",
  description: "Open-source tools for students around Indian exams",
};

export default function HomePage() {
  return (
    <HomeSmoothScroll>
      <div className="home-page bg-[#191919]">
        <div className="home-hero sticky top-0 z-10 flex h-svh flex-col bg-[#191919]">
          <header className="w-full shrink-0 pt-5 pb-2.5 sm:pt-6 sm:pb-3 md:pt-7 md:pb-4">
            <div className={homeHeaderContainerClass}>
              <Link
                href="/"
                aria-label="Ejam home"
                className={cn(
                  "home-enter-item relative flex min-h-10 min-w-10 shrink-0 items-center",
                  pressableClass,
                )}
              >
                <Image
                  src="/identity/logo.svg"
                  alt=""
                  width={116}
                  height={92}
                  priority
                  aria-hidden
                  className="h-5.5 outline outline-1 -outline-offset-1 outline-white/10 sm:h-6 md:h-7"
                  style={{ width: "auto" }}
                />
              </Link>
              <div
                className="home-enter-item shrink-0"
                style={{ "--home-enter-delay": "60ms" } as React.CSSProperties}
              >
                <AppHeader variant="home" />
              </div>
            </div>
          </header>
          <main
            className={cn(
              homePageContainerClass,
              "flex min-h-0 flex-1 flex-col",
            )}
          >
            <div className="flex w-full shrink-0 justify-center pt-9 sm:pt-12 md:pt-16">
              <HomeTagline />
            </div>
            <div className="mt-9 flex w-full justify-center sm:mt-12 md:mt-16">
              <HomeToolsSection />
            </div>
            <div className="mt-10 flex w-full justify-center pb-7 sm:mt-14 sm:pb-9 md:mt-[4.5rem] md:pb-11">
              <HomeRequestTool />
            </div>
          </main>
        </div>
        <HomeManifesto />
      </div>
    </HomeSmoothScroll>
  );
}
