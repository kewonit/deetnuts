import { cn } from "@/lib/utils";

/** one horizontal gutter for main content */
const appContentGutterClass = "px-4 md:px-6";

/** home page content column — navbar and body share one width */
export const homePageContainerClass = "mx-auto w-full max-w-3xl px-4 md:px-6";

/** home header bar — logo and actions share the content column width */
export const homeHeaderContainerClass =
  "mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 md:px-6";

export const homeCardsRowClass =
  "mx-auto w-full max-w-[30rem] sm:max-w-[32rem]";

/** home hero text — centered readable measure, aligned to content column */
export const homeTaglineColumnClass =
  "mx-auto w-full max-w-[19.5rem] text-center sm:max-w-[22rem] md:max-w-[26rem]";

/** home manifesto body — readable measure on narrow viewports */
export const homeManifestoColumnClass =
  "mx-auto w-full max-w-[34rem] sm:max-w-[36rem] md:max-w-[38rem]";

/** home tools column — same readable width as HomeTagline */
export const homeHeroColumnClass =
  "mx-auto w-full max-w-[20rem] md:max-w-[24rem]";

/** frosted sticky chrome — navbar, table headers, etc. */
export const stickyGlassChromeClass =
  "bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50";

/** sticky table thead — blur on thead, tint on cells so rows scroll beneath */
export const stickyGlassTableHeaderClass =
  "sticky top-0 z-10 backdrop-blur-sm [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-background/95 supports-backdrop-filter:[&_th]:bg-background/50";

/** results table scroll — mobile cards scroll in content; desktop table wrapper owns sticky scroll */
export const resultsTableScrollClass =
  "theme-scrollbar min-h-0 flex-1 overflow-y-auto lg:overflow-hidden lg:[&_[data-slot=table-container]]:min-h-0 lg:[&_[data-slot=table-container]]:flex-1 lg:[&_[data-slot=table-container]]:overflow-auto lg:[&_[data-slot=table-container]]:theme-scrollbar";

/** h-14 top chrome — sidebar logo row and main header actions share one strip height */
export const appChromeStripClass =
  "flex h-14 shrink-0 items-center border-b border-border";

/** Sidebar logo row — same on desktop rail and mobile drawer (logo flush at px-2) */
export const appSidebarHeaderClass = cn(
  appChromeStripClass,
  "flex flex-row items-center gap-0 p-0 px-2",
);

/** header right gutter includes the dashboard 1px frame so actions sit on the card edge */
export const appHeaderGutterClass =
  "pl-4 pr-[calc(1rem+1px)] md:pl-6 md:pr-[calc(1.5rem+1px)]";

/** top inset below h-14 chrome — pairs sidebar exam grid with main card header */
export const sidebarPanelTopInsetClass = "pt-[26px]";

/**
 * bottom inset so sidebar footer chrome lines up with the results card bottom.
 * mirrors Dashboard `h-[calc(100dvh-7rem)]` + appShellContent `py-4 md:py-6`.
 */
export const sidebarCardBottomAlignClass = "mb-10 md:mb-8";

/** title strip height — exam picker row and results card header (pt-4 + title + pb-4) */
export const predictorHeaderStripClass = "min-h-[55px]";

export function appShellLayoutClass(className?: string) {
  return cn("flex min-h-0 w-full min-w-0 flex-1 flex-col", className);
}

export function appShellContentClass(className?: string) {
  return cn(
    appContentGutterClass,
    "flex min-h-0 w-full min-w-0 flex-1 flex-col py-4 md:py-6",
    className,
  );
}
