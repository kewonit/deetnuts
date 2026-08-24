import { sanitizeRedirectPath } from "@/lib/auth-redirect";
import { GoogleAuthForm } from "./google-auth-form";

type AuthPageProps = {
  searchParams: Promise<{
    redirect?: string | string[];
    message?: string | string[];
  }>;
};

export default async function Login({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const redirectTo = sanitizeRedirectPath(params?.redirect);

  return (
    <GoogleAuthForm
      title="Sign in"
      description="Use Google or your existing email and password."
      redirectTo={redirectTo}
      message={typeof params?.message === "string" ? params.message : undefined}
    />
  );
}
