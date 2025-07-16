import Link from "next/link";
import { SubmitButton } from "./sumbit-button";
import { Input } from "@/components/ui/input";
import { login } from './actions'

export default async function Login({ searchParams }: any) {
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
          <h1 className="text-2xl font-bold">Sign In</h1>
          <p className="text-muted-foreground">Welcome back! Please sign in to your account.</p>
        </div>

        <input type="hidden" name="redirect" value={redirectTo} />

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
          formAction={login}
          className="bg-main border-2 border-black mt-4"
          pendingText="Sending Magic Link..."
        >
          Send OTP
        </SubmitButton>

        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href={redirectTo !== '/account' ? `/signup?redirect=${encodeURIComponent(redirectTo)}` : '/signup'}
              className="text-primary hover:underline font-medium"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
