import { sanitizeRedirectPath } from "@/lib/auth-redirect";
import { GoogleAuthForm } from "@/app/login/google-auth-form";

type AuthPageProps = {
  searchParams: Promise<{
    redirect?: string | string[];
    message?: string | string[];
  }>;
};

export default async function Signup({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const redirectTo = sanitizeRedirectPath(params?.redirect);

  return (
    <GoogleAuthForm
      title="Create account"
      description="Use your Google account to get started."
      redirectTo={redirectTo}
      message={typeof params?.message === "string" ? params.message : undefined}
    />
  );
}
