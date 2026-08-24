"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sanitizeRedirectPath } from "@/lib/auth-redirect";
import { toPocketBaseAuthEmail } from "@/lib/pocketbase/email";
import {
  clearAuthCookie,
  createUserPocketBase,
  getAuthCallbackUrl,
  getAuthenticatedPocketBase,
  sealOAuthState,
  setAuthCookie,
  setOAuthStateCookie,
} from "@/lib/pocketbase/auth";

function loginError(message: string, redirectTo: string): never {
  const params = new URLSearchParams({ message, redirect: redirectTo });
  redirect(`/login?${params.toString()}`);
}

export async function signInWithGoogle(formData: FormData) {
  const redirectTo = sanitizeRedirectPath(formData.get("redirect"));
  const pb = createUserPocketBase();
  let provider;
  try {
    const methods = await pb.collection("users").listAuthMethods();
    provider = methods.oauth2.providers.find((item) => item.name === "google");
  } catch {
    loginError(
      "Google sign-in could not be started. Please try again.",
      redirectTo,
    );
  }
  if (!provider) {
    loginError("Google sign-in is temporarily unavailable.", redirectTo);
  }

  const callbackUrl = getAuthCallbackUrl();
  const authUrl = new URL(`${provider.authURL}${encodeURIComponent(callbackUrl)}`);
  if (
    authUrl.protocol !== "https:" ||
    authUrl.hostname !== "accounts.google.com" ||
    authUrl.searchParams.get("state") !== provider.state
  ) {
    loginError("Google sign-in is temporarily unavailable.", redirectTo);
  }
  authUrl.searchParams.set("prompt", "select_account");
  await setOAuthStateCookie(
    sealOAuthState(provider.state, provider.codeVerifier, redirectTo),
  );

  redirect(authUrl.toString());
}

export async function signOut() {
  await clearAuthCookie();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signInWithPassword(formData: FormData) {
  const redirectTo = sanitizeRedirectPath(formData.get("redirect"));
  const emailInput = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!emailInput || !password) {
    loginError("Enter your email and password.", redirectTo);
  }
  const email = toPocketBaseAuthEmail(emailInput);

  try {
    const pb = createUserPocketBase();
    const auth = await pb.collection("users").authWithPassword(email, password);
    await setAuthCookie(auth.token);
  } catch {
    loginError("The email or password is incorrect.", redirectTo);
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function updateProfile(formData: FormData) {
  const name = formData.get("name") as string;

  if (!name || name.trim().length < 2) {
    redirect("/account?message=Name must be at least 2 characters long");
  }

  const auth = await getAuthenticatedPocketBase();
  if (!auth) {
    redirect("/login?redirect=/account");
  }

  try {
    await auth.pb.collection("users").update(auth.user.id, {
      full_name: name.trim(),
    });
    await setAuthCookie(auth.pb.authStore.token);
  } catch {
    redirect("/account?message=Failed to update profile. Please try again.");
  }

  revalidatePath("/account");
  redirect("/account?message=Profile updated successfully!");
}
