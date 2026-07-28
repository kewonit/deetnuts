import { type NextRequest, NextResponse } from "next/server";

import { sanitizeRedirectPath } from "@/lib/auth-redirect";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const next = sanitizeRedirectPath(searchParams.get("redirect"));
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "message",
    "Email code sign-in has been replaced by Google sign-in.",
  );
  loginUrl.searchParams.set("redirect", next);
  return NextResponse.redirect(loginUrl);
}
