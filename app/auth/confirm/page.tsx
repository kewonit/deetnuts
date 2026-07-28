import { redirect } from "next/navigation";
import { sanitizeRedirectPath } from "@/lib/auth-redirect";

type EmailAuthRetiredProps = {
  searchParams: Promise<{
    redirect?: string | string[];
  }>;
};

export default async function EmailAuthRetired({
  searchParams,
}: EmailAuthRetiredProps) {
  const params = await searchParams;
  const redirectTo = sanitizeRedirectPath(params?.redirect);
  const paramsOut = new URLSearchParams({
    message: "Email code sign-in has been replaced by Google sign-in.",
    redirect: redirectTo,
  });

  redirect(`/login?${paramsOut.toString()}`);
}
