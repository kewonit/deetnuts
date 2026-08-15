"use client";

import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import {
  appChromeStripClass,
  appHeaderGutterClass,
  appShellContentClass,
  appShellLayoutClass,
  stickyGlassChromeClass,
} from "@/components/app-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { PredictorProvider } from "@/components/predictor/predictor-context";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { type AppIdentity, ejamIdentity } from "@/lib/identity";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  identity = ejamIdentity,
  mhtCetEnabled = false,
}: {
  children: React.ReactNode;
  identity?: AppIdentity;
  mhtCetEnabled?: boolean;
}) {
  return (
    <Suspense fallback={null}>
      <PredictorProvider mhtCetEnabled={mhtCetEnabled}>
        <SidebarProvider>
          <AppSidebar identity={identity} />
          <SidebarInset className="flex min-h-svh flex-col">
            <div
              className={cn(
                appChromeStripClass,
                appHeaderGutterClass,
                "sticky top-0 z-50 flex w-full items-center gap-2",
                stickyGlassChromeClass,
              )}
            >
              <SidebarTrigger />
              <AppHeader
                className="min-w-0 flex-1"
                showToolsLink
                docsHref={identity.docsHref}
              />
            </div>
            <div className={cn(appShellLayoutClass(), "min-h-0 flex-1")}>
              <div className={appShellContentClass()}>{children}</div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </PredictorProvider>
    </Suspense>
  );
}
