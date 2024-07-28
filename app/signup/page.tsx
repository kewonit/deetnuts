import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SubmitButton } from "./sumbit-button";
import { Input } from "@/components/ui/input";

export default function Login({
  searchParams,
}: {
  searchParams: { message: string };
}) {

  const signUp = async (formData: FormData) => {
    "use server";

    const origin = headers().get("origin");
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (error) {
      return redirect("/signup?message=Could not authenticate user");
    }

    return redirect("/signup?message=Check email to continue sign in process");
  };

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto pt-28 min-h-screen">
      <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground">
      <Link
        href="/login"
        className="left-8 top-8 py-2 rounded-md underline underline-offset-4 text-foreground bg-btn-background hover:bg-btn-background-hover flex items-center group text-sm"
      >
        {'<--'} Back
      </Link>
      <div className="flex gap-2 mt-8">
          <div className="flex-1">
            <label className="text-md" htmlFor="firstName">
              First Name
            </label>
            <Input
              className="px-4 py-2 bg-inherit border w-full"
              name="firstName"
              placeholder="John"
              required
            />
          </div>
          <div className="flex-1">
            <label className="text-md" htmlFor="lastName">
              Last Name
            </label>
            <Input
              className="px-4 py-2 bg-inherit border w-full"
              name="lastName"
              placeholder="Doe"
              required
            />
          </div>
        </div>
        <div className="flex gap-2 mb-8">
          <div className="flex-1">
            <label className="text-md" htmlFor="email">
              Email
            </label>
            <Input
              className="px-4 py-2 bg-inherit border mb-2"
              name="email"
              placeholder="you@example.com"
              required
            />
            <label className="text-md" htmlFor="password">
              Password
            </label>
            <Input
              className="px-4 py-2 bg-inherit border mb-2"
              type="password"
              name="password"
              placeholder="••••••••"
              required
            />
          </div>
        </div>
        <SubmitButton
          formAction={signUp}
          className="bg-main border-2 border-black"
          pendingText="Signing Up..."
        >
          Sign Up
        </SubmitButton>
        {searchParams?.message && (
          <p className="mt-4 p-4 bg-foreground/10 text-foreground text-center">
            {searchParams.message}
          </p>
        )}
      </form>
    </div>
  );
}