import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { sanitizeRedirectPath } from "@/lib/auth-redirect";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeRedirectPath(searchParams.get("redirect"));

  if (code) {
    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  const errorUrl = new URL("/login", request.url);
  errorUrl.searchParams.set(
    "message",
    searchParams.get("error") === "access_denied"
      ? "Google sign-in was cancelled."
      : "Google sign-in could not be completed. Please try again.",
  );
  errorUrl.searchParams.set("redirect", next);
  return NextResponse.redirect(errorUrl);
}
