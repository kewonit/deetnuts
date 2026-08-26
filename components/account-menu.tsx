"use client";

import Link from "next/link";
import { ChevronDown, LogOut, SunMoon, UserRound } from "lucide-react";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { signOut } from "@/app/login/actions";
import { openThemeSettings } from "@/components/theme/ThemeSettings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function getFirstName(displayName: string) {
  return displayName.trim().split(/\s+/)[0] || "Account";
}

interface AccountMenuTriggerProps extends ComponentPropsWithoutRef<"button"> {
  displayName: string;
  avatarUrl: string;
}

const AccountMenuTrigger = forwardRef<
  HTMLButtonElement,
  AccountMenuTriggerProps
>(function AccountMenuTrigger(
  { displayName, avatarUrl, className, ...props },
  ref,
) {
  const firstName = getFirstName(displayName);
  const initial = firstName.charAt(0).toUpperCase() || "A";

  return (
    <button
      ref={ref}
      type="button"
      aria-label="Open account menu"
      className={cn(
        "rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:inline-flex sm:h-10 sm:items-center sm:justify-center sm:rounded-base sm:border-2 sm:border-black sm:bg-main sm:px-4 sm:py-2 sm:text-sm sm:font-base sm:shadow-base sm:transition-all sm:hover:translate-x-boxShadowX sm:hover:translate-y-boxShadowY sm:hover:shadow-none",
        className,
      )}
      {...props}
    >
      <Avatar className="sm:hidden">
        <AvatarImage src={avatarUrl} alt="" />
        <AvatarFallback>{initial}</AvatarFallback>
      </Avatar>
      <span className="hidden max-w-[140px] truncate sm:inline">
        {firstName}
      </span>
      <ChevronDown className="hidden h-4 w-4 sm:inline" aria-hidden="true" />
    </button>
  );
});

export function AccountMenu({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string;
}) {
  const firstName = getFirstName(name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <AccountMenuTrigger displayName={name} avatarUrl={avatarUrl} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56">
        <DropdownMenuLabel className="px-2 py-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 outline-1">
              <AvatarImage src={avatarUrl} alt="" />
              <AvatarFallback>
                {firstName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-heading">{firstName}</p>
              <p className="text-xs font-base text-black/60">Account</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account" className="flex w-full items-center gap-2">
            <UserRound className="h-4 w-4" aria-hidden="true" />
            <span>View account</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={openThemeSettings}>
          <SunMoon className="mr-2 h-4 w-4" aria-hidden="true" />
          <span>Theme settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOut}>
          <DropdownMenuItem asChild>
            <button
              type="submit"
              className="flex w-full items-center gap-2 text-left"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>Log out</span>
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
