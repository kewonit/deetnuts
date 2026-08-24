import { type NextRequest, NextResponse } from "next/server";
import { getRequestOrigin } from "@/lib/site-url";
import { cookies } from "next/headers";
import {
  clearOAuthStateCookie,
  createUserPocketBase,
  getAuthCallbackUrl,
  OAUTH_STATE_COOKIE_NAME,
  openOAuthState,
  setAuthCookie,
} from "@/lib/pocketbase/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectOrigin = getRequestOrigin(request.url);
  const cookieStore = await cookies();
  const oauthState = openOAuthState(
    cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value,
  );
  const returnedState = searchParams.get("state");
  const next = oauthState?.redirect || "/";

  if (code && oauthState && returnedState === oauthState.state) {
    try {
      const pb = createUserPocketBase();
      const auth = await pb.collection("users").authWithOAuth2Code(
        oauthState.provider,
        code,
        oauthState.codeVerifier,
        getAuthCallbackUrl(),
        { emailVisibility: false },
      );
      await setAuthCookie(auth.token);
      await clearOAuthStateCookie();
      return NextResponse.redirect(new URL(next, redirectOrigin));
    } catch {
      // Return the same generic error for provider, linking, and exchange errors.
    }
  }

  await clearOAuthStateCookie();

  const errorUrl = new URL("/login", redirectOrigin);
  errorUrl.searchParams.set(
    "message",
    searchParams.get("error") === "access_denied"
      ? "Google sign-in was cancelled."
      : "Google sign-in could not be completed. Please try again.",
  );
  errorUrl.searchParams.set("redirect", next);
  return NextResponse.redirect(errorUrl);
}
