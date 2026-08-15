"use client";

import { appChromeStripClass } from "@ejam/ui/components/app-layout";
import { PredictorSidebarPanel } from "@ejam/ui/components/predictor/predictor-sidebar-panel";
import {
  Sidebar,
  SidebarCloseTrigger,
  SidebarContent,
  SidebarHeader,
} from "@ejam/ui/components/ui/sidebar";
import { cn } from "@ejam/ui/lib/utils";

export function AppSidebar() {
  return (
    <Sidebar
      className={cn(
        "*:data-[slot=sidebar-inner]:bg-background",
        "**:data-[slot=sidebar-menu-button]:[&>span]:text-foreground/75",
      )}
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
      <SidebarContent className="gap-0 p-0">
        <PredictorSidebarPanel />
      </SidebarContent>
    </Sidebar>
  );
}
