import { NextResponse } from "next/server";
import { getAuthenticatedPocketBase } from "@/lib/pocketbase/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getAuthenticatedPocketBase();
  if (!auth) {
    return NextResponse.json(
      { user: null },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      user: {
        id: auth.user.id,
        email: auth.user.email,
        name: auth.user.full_name || auth.user.email.split("@")[0] || "Account",
        avatarUrl: auth.user.avatar_url ? "/api/account/avatar" : null,
      },
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
