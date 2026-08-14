"use client";

import { Suspense } from "react";
import {
  appShellContentClass,
  appShellLayoutClass,
} from "@/ejam-ui/components/app-layout";
import { AppSidebar } from "@/ejam-ui/components/app-sidebar";
import { PredictorProvider } from "@/ejam-ui/components/predictor/predictor-context";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/ejam-ui/components/ui/sidebar";
import { cn } from "@/ejam-ui/lib/utils";

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
            <div className="flex h-12 shrink-0 items-center border-b border-border px-4 md:hidden">
              <SidebarTrigger />
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
