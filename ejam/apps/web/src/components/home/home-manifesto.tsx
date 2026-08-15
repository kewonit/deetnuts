import { homeManifestoColumnClass } from "@/components/app-layout";
import { HomeManifestoScrollHint } from "@/components/home/home-manifesto-scroll-hint";
import { cn } from "@/lib/utils";

export function HomeManifesto() {
  return (
    <section
      id="home-manifesto"
      aria-labelledby="home-manifesto-heading"
      className="home-manifesto relative z-20 -mt-28 scroll-mt-[var(--home-header-offset)] sm:-mt-32 md:-mt-40"
    >
      <div className="sticky top-[var(--home-header-offset)] z-20">
        <div className="flex h-[var(--home-manifesto-arch-height)] w-full shrink-0 flex-col items-center justify-center rounded-t-full bg-[#0a0a0a] px-[var(--home-manifesto-arch-px)]">
          <div className="flex w-full max-w-2xl flex-col items-center gap-1.5 -translate-y-7 sm:gap-2 sm:-translate-y-9 md:-translate-y-11">
            <h2
              id="home-manifesto-heading"
              className="font-serif-display w-full text-balance text-center text-[clamp(1.875rem,5vw+1rem,3rem)] italic leading-[1.12] tracking-[0.02em] text-white [word-spacing:0.08em] sm:[word-spacing:0.14em]"
            >
              manifesto
            </h2>
            <HomeManifestoScrollHint />
          </div>
        </div>
        <div className="min-h-[calc(100svh-var(--home-header-offset)-var(--home-manifesto-arch-height))] bg-[#0a0a0a] px-4 pb-14 sm:px-5 sm:pb-16 md:px-10 md:pb-20">
          <div
            className={cn(
              homeManifestoColumnClass,
              "-mt-8 sm:-mt-10 md:-mt-12",
            )}
          >
            <p className="whitespace-pre-line text-pretty text-left font-instrument-sans text-[clamp(1rem,2.2vw+0.5rem,1.5rem)] leading-[1.72] tracking-[-0.015em] text-white md:leading-[1.68] lg:leading-[1.64]">
              {`ejam was never supposed to be a thing.
it came out of pure frustration.

there are so many student tools that should just exist, but instead they are paywalled or made annoying on purpose.

and then there is the privacy.... which makes it worse. why should we give up personal info for something so which doesn't require our infomation?

that part never sat right with me.

big coaching institutes definitely had the means to build something better.
they just did not.

most of it is closed source, ads everywhere, heavily data-collecting, and overcomplicated for no fucking reason.

this is just my small attempt at making something better,
just something useful that should have existed already.

it is just one tool for now.
if it gets a good traction and actually helps,
i would love to keep adding more.

TL;DR

open-souce
no bullsh*t
for students,
by students.`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
