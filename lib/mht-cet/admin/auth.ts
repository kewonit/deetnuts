import { createClient } from "@/app/lib/supabase/server";
import { cookies } from "next/headers";

export class MhtCetAdminError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function getAdminEmails() {
  return new Set(
    (process.env.MHT_CET_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function requireMhtCetAdmin() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    throw new MhtCetAdminError(401, "unauthorized", "Sign in as an admin.");
  }

  const adminEmails = getAdminEmails();
  if (!adminEmails.has(user.email.toLowerCase())) {
    throw new MhtCetAdminError(
      403,
      "forbidden",
      "This account is not an MHT-CET admin.",
    );
  }

  return user;
}
