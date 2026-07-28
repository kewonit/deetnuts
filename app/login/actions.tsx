"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import {
  buildAuthCallbackUrl,
  sanitizeRedirectPath,
} from "@/lib/auth-redirect";

export async function signInWithGoogle(formData: FormData) {
  const redirectTo = sanitizeRedirectPath(formData.get("redirect"));
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: buildAuthCallbackUrl(redirectTo),
      skipBrowserRedirect: true,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error || !data.url) {
    const params = new URLSearchParams({
      message: "Google sign-in could not be started. Please try again.",
      redirect: redirectTo,
    });
    return redirect(`/login?${params.toString()}`);
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function updateProfile(formData: FormData) {
  const name = formData.get("name") as string;

  if (!name || name.trim().length < 2) {
    redirect("/account?message=Name must be at least 2 characters long");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      full_name: name.trim(),
    },
  });

  if (error) {
    redirect("/account?message=Failed to update profile. Please try again.");
  }

  revalidatePath("/account");
  redirect("/account?message=Profile updated successfully!");
}
