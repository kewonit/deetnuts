import { redirect } from "next/navigation";
import { getAuthenticatedPocketBase } from "@/lib/pocketbase/auth";
import { BsArrowReturnLeft } from "react-icons/bs";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function PrivatePage() {
  const auth = await getAuthenticatedPocketBase();
  if (!auth) {
    redirect("/login?redirect=/profile");
  }
  const username = auth.user.username || auth.user.full_name || "Kitty!";

  return (
    <section className="inset-0 mt-20 flex w-full flex-col items-center justify-center border-b-2 border-b-black bg-white bg-[linear-gradient(to_right,#80808033_1px,transparent_1px),linear-gradient(to_bottom,#80808033_1px,transparent_1px)] bg-[size:70px_70px] font-base">
      <div className="mx-auto text-center w-container max-w-full px-5 py-20 lg:py-[100px]">
        <h2 className="mb-14 text-2xl font-heading md:text-3xl lg:mb-20 lg:text-4xl">
          Hello, {username}!
        </h2>
        <p className="pb-2">You have successfully logged in</p>
        <Link href="/">
          <Button>
            return back to home page{" "}
            <BsArrowReturnLeft className="ml-2 mt-1" />{" "}
          </Button>
        </Link>
      </div>
    </section>
  );
}
