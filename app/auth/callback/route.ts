import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { sanitizeRedirectPath } from "@/lib/auth-redirect";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = sanitizeRedirectPath(searchParams.get("redirect"));

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      // Redirect to the 'next' URL
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // return the user to an error page with some instructions
  const errorUrl = new URL("/login", request.url);
  errorUrl.searchParams.set(
    "message",
    "There was an error verifying your email. Please try again.",
  );
  errorUrl.searchParams.set("redirect", next);
  return NextResponse.redirect(errorUrl);
}
