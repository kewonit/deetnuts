import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/app/login/actions";
import Link from "next/link";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function AuthButton() {
  const user = await getCurrentUser();

  return user ? (
    <div className="items-center gap-4">
      <div className="flex sm:hidden">
        <Drawer>
          <DrawerTrigger asChild>
            <Avatar>
              <AvatarImage src="/avatar.webp" />
              <AvatarFallback>
                {(user.name || "").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </DrawerTrigger>
          <DrawerContent>
            <div className="mx-auto w-[300px]">
              <DrawerHeader>
                <DrawerTitle>Are you sure?</DrawerTitle>
                <DrawerDescription>
                  You can log back in at anytime!
                </DrawerDescription>
                <DrawerDescription>({user.name})</DrawerDescription>
              </DrawerHeader>
              <DrawerFooter className="grid grid-rows-2">
                <form action={signOut}>
                  <Button
                    variant="default"
                    className="py-2 px-[115px] rounded-md text-center allign-center"
                  >
                    Logout
                  </Button>
                </form>
                <DrawerClose asChild>
                  <Button variant="neutral">Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
      <div className="hidden sm:flex">
        <Drawer>
          <DrawerTrigger asChild>
            <Button>Hey, {user.name}!</Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="mx-auto w-[300px]">
              <DrawerHeader>
                <DrawerTitle>Are you sure?</DrawerTitle>
                <DrawerDescription>
                  You can log back in at anytime!
                </DrawerDescription>
              </DrawerHeader>
              <DrawerFooter className="grid grid-rows-2">
                <form action={signOut}>
                  <Button className="py-2 px-[115px] rounded-md text-center allign-center">
                    Logout
                  </Button>
                </form>
                <DrawerClose asChild>
                  <Button variant="neutral">Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  ) : (
    <Link
      href="/login"
      className="py-2 px-3 flex rounded-md no-underline bg-btn-background hover:bg-btn-background-hover"
    >
      Login
    </Link>
  );
}
