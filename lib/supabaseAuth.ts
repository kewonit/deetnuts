import { createClient } from "@/app/lib/supabase/server";
import { cookies } from "next/headers";

export async function ensureUserAuthenticated() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Authentication error:", error);
      throw new Error("Authentication failed");
    }

    if (!user) {
      throw new Error("User authentication required");
    }

    return user;
  } catch (error) {
    console.error("Authentication check failed:", error);
    throw new Error("Authentication failed");
  }
}

export async function getAuthenticatedSupabaseClient() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Authentication error:", error);
      throw new Error("Authentication failed");
    }

    if (!user) {
      throw new Error("User authentication required");
    }

    return supabase;
  } catch (error) {
    console.error("Authentication check failed:", error);
    throw new Error("Authentication failed");
  }
}
