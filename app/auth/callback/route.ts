import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/app/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("redirect") ?? "/account";

  if (token_hash && type) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

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
  return NextResponse.redirect(errorUrl);
}
