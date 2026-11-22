import { type User } from "@/lib/auth";
import { updateProfile } from "@/app/login/actions";
import { SubmitButton } from "@/app/login/submit-button";
import "@/app/login/auth.css";

export default function AccountForm({
  user,
  message,
}: {
  user: User;
  message?: string;
}) {
  return (
    <main className="mht-main">
      <div className="mht-page auth-page">
        <h1 className="mht-h1">Account</h1>
        {message ? (
          <p className="auth-message" role="status">
            {message}
          </p>
        ) : null}

        <form action={updateProfile} className="auth-form">
          <label className="mht-field">
            <span>Email</span>
            <input
              className="mht-input"
              type="email"
              value={user.email}
              disabled
            />
          </label>
          <label className="mht-field">
            <span>Name</span>
            <input
              className="mht-input"
              name="name"
              type="text"
              defaultValue={user.name}
              autoComplete="name"
              required
              minLength={2}
            />
          </label>
          <p className="auth-status">
            {user.verified ? "Verified" : "Unverified"}
          </p>
          <SubmitButton
            className="mht-btn mht-btn-primary"
            pendingText="Saving..."
          >
            Save
          </SubmitButton>
        </form>
      </div>
    </main>
  );
}
