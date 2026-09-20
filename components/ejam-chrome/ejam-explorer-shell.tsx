"use client";

import {
  appChromeStripClass,
  appShellContentClass,
  appShellLayoutClass,
} from "@ejam/ui/components/app-layout";
import {
  Sidebar,
  SidebarCloseTrigger,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@ejam/ui/components/ui/sidebar";
import { cn } from "@ejam/ui/lib/utils";

export function EjamExplorerShell({
  sidebar,
  children,
  title = "Filters",
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div data-ejam-explorer className="h-full min-h-0">
      <SidebarProvider>
        <Sidebar
          className="*:data-[slot=sidebar-inner]:bg-background"
          variant="sidebar"
        >
          <SidebarHeader
            className={cn(
              appChromeStripClass,
              "flex-row items-center justify-end gap-2 p-0 px-2 md:hidden",
            )}
          >
            <SidebarCloseTrigger className="sheet-close-hit shrink-0" />
          </SidebarHeader>
          <SidebarContent className="gap-0 p-0">{sidebar}</SidebarContent>
        </Sidebar>
        <SidebarInset className="flex min-h-svh flex-col">
          <div
            data-ejam-explorer-mobile-bar
            className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4 md:hidden"
          >
            <SidebarTrigger aria-label={`Open ${title}`} />
            <span className="text-sm font-medium">{title}</span>
          </div>
          <div className={cn(appShellLayoutClass(), "min-h-0 flex-1")}>
            <div className={appShellContentClass()}>{children}</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
