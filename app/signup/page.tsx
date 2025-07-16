import Link from "next/link";
import { SubmitButton } from "./sumbit-button";
import { Input } from "@/components/ui/input";
import { signup } from '../login/actions'

export default async function Signup({ searchParams }: any) {
  const params = await searchParams
  const redirectTo = params?.redirect || '/account'

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto pt-28 min-h-screen">
      <Link
        href="/"
        className="absolute left-8 top-8 py-2 px-4 rounded-md no-underline text-foreground bg-btn-background hover:bg-btn-background-hover flex items-center group text-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>{" "}
        Back
      </Link>

      <form className="animate-in flex-1 flex flex-col w-full justify-center gap-4 text-foreground">
        {params?.message && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm text-center">{params.message}</p>
          </div>
        )}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-muted-foreground">Sign up to get started with your account.</p>
        </div>

        <input type="hidden" name="redirect" value={redirectTo} />

        <div>
          <label className="text-md font-medium" htmlFor="name">
            Full Name
          </label>
          <Input
            className="mt-1 px-4 py-2 bg-inherit border"
            name="name"
            type="text"
            placeholder="John Doe"
            required
            minLength={2}
          />
        </div>

        <div>
          <label className="text-md font-medium" htmlFor="email">
            Email
          </label>
          <Input
            className="mt-1 px-4 py-2 bg-inherit border"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
          />
        </div>

        <SubmitButton
          formAction={signup}
          className="bg-main border-2 border-black mt-4"
          pendingText="Creating Account..."
        >
          Create Account
        </SubmitButton>

        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={redirectTo !== '/account' ? `/login?redirect=${encodeURIComponent(redirectTo)}` : '/login'}
              className="text-primary hover:underline font-medium"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
