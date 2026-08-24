import { clearAuthCookie } from "@/lib/pocketbase/auth";
import { getRequestOrigin } from "@/lib/site-url";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  await clearAuthCookie();

  revalidatePath("/", "layout");
  return NextResponse.redirect(new URL("/login", getRequestOrigin(req.url)), {
    status: 302,
  });
}
