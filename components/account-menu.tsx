"use client";

import Link from "next/link";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  useSyncExternalStore,
} from "react";
import { signOut } from "@/app/login/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer-2";
import { cn } from "@/lib/utils";

const subscribeToHydration = () => () => {};

interface AccountMenuTriggerProps
  extends ComponentPropsWithoutRef<"button"> {
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
  const initial = displayName.trim().charAt(0).toUpperCase() || "A";

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
      <span className="hidden sm:inline">Hey, {displayName}!</span>
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
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );

  if (!hydrated) {
    return <AccountMenuTrigger displayName={name} avatarUrl={avatarUrl} />;
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <AccountMenuTrigger displayName={name} avatarUrl={avatarUrl} />
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-[320px]">
          <DrawerHeader>
            <DrawerTitle>Account</DrawerTitle>
            <DrawerDescription>Signed in as {name}</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button asChild>
                <Link href="/account">View account</Link>
              </Button>
            </DrawerClose>
            <form action={signOut}>
              <Button
                type="submit"
                variant="noShadow"
                className="w-full rounded-md"
              >
                Log out
              </Button>
            </form>
            <DrawerClose asChild>
              <Button type="button" variant="neutral">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
