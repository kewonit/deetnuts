"use client";

import { Suspense } from "react";
import {
  appShellContentClass,
  appShellLayoutClass,
} from "@ejam/ui/components/app-layout";
import { AppSidebar } from "@ejam/ui/components/app-sidebar";
import { PredictorProvider } from "@ejam/ui/components/predictor/predictor-context";
import { SidebarToggleIcon } from "@ejam/ui/components/sidebar-toggle-icon";
import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from "@ejam/ui/components/ui/sidebar";
import { cn } from "@ejam/ui/lib/utils";

function MobileSetupBar() {
  const { isMobile, openMobile, setOpenMobile } = useSidebar();
  if (!isMobile) return null;
  return (
    <button
      type="button"
      className="flex h-12 w-full shrink-0 items-center gap-2 border-b border-border px-4 text-left md:hidden"
      aria-expanded={openMobile}
      aria-label={openMobile ? "Close prediction setup" : "Open prediction setup"}
      onClick={() => setOpenMobile(!openMobile)}
    >
      <SidebarToggleIcon isOpen={openMobile} className="size-5 shrink-0" />
      <span className="text-sm font-medium">Prediction setup</span>
    </button>
  );
}

export function AppShell({
  children,
  mhtCetEnabled = false,
}: {
  children: React.ReactNode;
  mhtCetEnabled?: boolean;
}) {
  return (
    <Suspense fallback={null}>
      <PredictorProvider mhtCetEnabled={mhtCetEnabled}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex min-h-svh flex-col">
            <MobileSetupBar />
            <div className={cn(appShellLayoutClass(), "min-h-0 flex-1")}>
              <div className={appShellContentClass()}>{children}</div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </PredictorProvider>
    </Suspense>
  );
}
