import Link from "next/link";
import { SubmitButton } from "./submit-button";
import { signInWithGoogle, signInWithPassword } from "./actions";

type GoogleAuthFormProps = {
  title: string;
  description: string;
  redirectTo: string;
  message?: string;
};

export function GoogleAuthForm({
  title,
  description,
  redirectTo,
  message,
}: GoogleAuthFormProps) {
  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto pt-28 min-h-screen">
      <Link
        href={redirectTo}
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

      <div className="animate-in flex-1 flex flex-col w-full justify-center gap-4 text-foreground">
        {message && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm text-center">{message}</p>
          </div>
        )}

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <form action={signInWithGoogle}>
          <input type="hidden" name="redirect" value={redirectTo} />
          <SubmitButton
            className="w-full bg-white border-2 border-black mt-4 gap-3"
            pendingText="Opening Google..."
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 18 18"
              className="h-5 w-5"
            >
              <path
                fill="#4285F4"
                d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.482h4.844a4.14 4.14 0 0 1-1.797 2.715v2.258h2.909c1.702-1.567 2.684-3.877 2.684-6.614Z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.468-.806 5.956-2.181l-2.91-2.258c-.805.54-1.835.859-3.046.859-2.344 0-4.328-1.585-5.037-3.714H.956v2.332A9 9 0 0 0 9 18Z"
              />
              <path
                fill="#FBBC05"
                d="M3.963 10.706A5.41 5.41 0 0 1 3.682 9c0-.592.102-1.168.281-1.706V4.962H.956A9 9 0 0 0 0 9c0 1.452.347 2.827.956 4.038l3.007-2.332Z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.322 0 2.507.454 3.441 1.346l2.581-2.581C13.464.892 11.426 0 9 0A9 9 0 0 0 .956 4.962l3.007 2.332C4.672 5.165 6.656 3.58 9 3.58Z"
              />
            </svg>
            Continue with Google
          </SubmitButton>
        </form>

        <div className="flex items-center gap-3 py-2" aria-hidden="true">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <form action={signInWithPassword} className="flex flex-col gap-3">
          <input type="hidden" name="redirect" value={redirectTo} />
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="h-11 rounded-md border-2 border-black bg-background px-3"
          />
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={6}
            className="h-11 rounded-md border-2 border-black bg-background px-3"
          />
          <SubmitButton className="w-full" pendingText="Signing in...">
            Sign in with password
          </SubmitButton>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link
            href="/compliance/terms-and-conditions"
            className="underline hover:text-foreground"
          >
            Terms
          </Link>{" "}
          and acknowledge our{" "}
          <Link
            href="/compliance/privacy-policy"
            className="underline hover:text-foreground"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
