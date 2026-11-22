import Link from "next/link";
import { SubmitButton } from "./submit-button";
import { signInWithGoogle, signInWithPassword } from "./actions";
import "./auth.css";

type GoogleAuthFormProps = {
  title: string;
  redirectTo: string;
  message?: string;
};

export function GoogleAuthForm({
  title,
  redirectTo,
  message,
}: GoogleAuthFormProps) {
  return (
    <main className="mht-main">
      <div className="mht-page auth-page">
        <h1 className="mht-h1">{title}</h1>
        {message ? (
          <p className="auth-message" role="status">
            {message}
          </p>
        ) : null}

        <form action={signInWithGoogle}>
          <input type="hidden" name="redirect" value={redirectTo} />
          <SubmitButton
            className="mht-btn mht-btn-primary"
            pendingText="Opening Google..."
          >
            <svg aria-hidden="true" viewBox="0 0 18 18">
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

        <p className="auth-or">or</p>

        <form action={signInWithPassword} className="auth-form">
          <input type="hidden" name="redirect" value={redirectTo} />
          <label className="mht-field">
            <span>Email</span>
            <input
              className="mht-input"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label className="mht-field">
            <span>Password</span>
            <input
              className="mht-input"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
            />
          </label>
          <SubmitButton className="mht-btn" pendingText="Signing in...">
            Sign in with password
          </SubmitButton>
        </form>

        <p className="mht-note">
          By continuing, you agree to our{" "}
          <Link href="/compliance/terms-and-conditions">Terms</Link> and
          acknowledge our{" "}
          <Link href="/compliance/privacy-policy">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}
