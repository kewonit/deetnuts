import { NextResponse } from "next/server";
import { ClientResponseError, getPocketBase } from "@/lib/pocketbaseClient";
import { getAuthenticatedPocketBase } from "@/lib/pocketbase/auth";
import type { RecordModel } from "pocketbase";

interface StoredAvatarRecord extends RecordModel {
  object: string;
  source_metadata?: { mimetype?: unknown };
}

const RESPONSE_HEADERS = {
  "Cache-Control": "private, max-age=3600",
  "Content-Security-Policy": "default-src 'none'; sandbox",
  "X-Content-Type-Options": "nosniff",
};

export async function GET() {
  const auth = await getAuthenticatedPocketBase();
  if (!auth) {
    return NextResponse.redirect(
      new URL("/avatar.webp", "https://www.deetnuts.com"),
      { status: 307, headers: RESPONSE_HEADERS },
    );
  }

  if (auth.user.supabase_id) {
    const service = getPocketBase();
    try {
      const avatar = await service
        .collection("supabase_storage_objects")
        .getFirstListItem<StoredAvatarRecord>(
          serviceFilter("owner_id", auth.user.supabase_id),
          {
            fields: "id,collectionId,collectionName,object,source_metadata",
            sort: "-source_updated_at",
          },
        );
      const file = await service.downloadProtectedFile(avatar, avatar.object);
      const declaredType = avatar.source_metadata?.mimetype;
      return imageResponse(
        file.bytes,
        typeof declaredType === "string" ? declaredType : file.contentType,
      );
    } catch (error) {
      if (!(error instanceof ClientResponseError) || error.status !== 404) {
        throw error;
      }
    }
  }

  try {
    const upstream = new URL(auth.user.avatar_url || "");
    if (
      upstream.protocol === "https:" &&
      upstream.hostname === "lh3.googleusercontent.com" &&
      !upstream.username &&
      !upstream.password
    ) {
      const response = await fetch(upstream, {
        redirect: "error",
        signal: AbortSignal.timeout(10_000),
      });
      const length = Number(response.headers.get("content-length") || 0);
      if (response.ok && (!length || length <= 5 * 1024 * 1024)) {
        const bytes = await response.arrayBuffer();
        if (bytes.byteLength <= 5 * 1024 * 1024) {
          return imageResponse(
            bytes,
            response.headers.get("content-type") || "",
          );
        }
      }
    }
  } catch {
    // A missing or invalid provider avatar uses the local placeholder.
  }

  return NextResponse.redirect(
    new URL("/avatar.webp", "https://www.deetnuts.com"),
    { status: 307, headers: RESPONSE_HEADERS },
  );
}

function imageResponse(bytes: ArrayBuffer, proposedType: string): NextResponse {
  const contentType = /^image\/(?:avif|gif|jpeg|png|webp)(?:;|$)/.test(proposedType)
    ? proposedType.split(";", 1)[0]
    : "";
  if (!contentType) {
    return new NextResponse(null, { status: 415, headers: RESPONSE_HEADERS });
  }
  return new NextResponse(bytes, {
    status: 200,
    headers: { ...RESPONSE_HEADERS, "Content-Type": contentType },
  });
}

function serviceFilter(field: string, value: string): string {
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(field)) {
    throw new Error("Invalid PocketBase filter field");
  }
  return `${field} = "${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}
