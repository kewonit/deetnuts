"use client";

import Image from "next/image";
import Link from "next/link";
import { appChromeStripClass } from "@/components/app-layout";
import { PredictorSidebarPanel } from "@/components/predictor/predictor-sidebar-panel";
import {
  Sidebar,
  SidebarCloseTrigger,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { type AppIdentity, ejamIdentity } from "@/lib/identity";
import { cn } from "@/lib/utils";

export function AppSidebar({
  identity = ejamIdentity,
}: {
  identity?: AppIdentity;
}) {
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
          "flex-row items-center gap-2 p-0 px-2",
        )}
      >
        <SidebarMenu className="w-auto min-w-0">
          <SidebarMenuItem>
            <SidebarMenuButton
              className="h-9 hover:bg-transparent active:bg-transparent data-active:bg-transparent"
              render={
                <Link
                  href={identity.homeHref}
                  aria-label={identity.homeAriaLabel}
                  className="flex max-w-full items-center"
                >
                  <Image
                    src={identity.logoSrc}
                    alt=""
                    width={identity.logoWidth}
                    height={identity.logoHeight}
                    priority
                    unoptimized
                    aria-hidden
                    className={cn(
                      "max-w-full shrink-0",
                      identity.logoDisplayClass ?? "h-6",
                    )}
                    style={{ width: "auto" }}
                  />
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarCloseTrigger className="sheet-close-hit ml-auto shrink-0" />
      </SidebarHeader>
      <SidebarContent className="gap-0 p-0">
        <PredictorSidebarPanel />
      </SidebarContent>
    </Sidebar>
  );
}
