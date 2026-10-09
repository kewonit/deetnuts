import "server-only";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import {
  ClientResponseError,
  sendTimekeeperRequest,
} from "@/lib/pocketbaseClient";
import { transferSchema } from "./storage";

const oldOrigin = "https://timekeeper.edbn.me";
const newOrigin = "https://www.deetnuts.com";

export function migrationHeaders(
  request: Request,
  operation: "mint" | "redeem",
) {
  const origin = request.headers.get("origin");
  const permitted =
    operation === "mint"
      ? origin === oldOrigin
      : origin === newOrigin ||
        (process.env.NODE_ENV !== "production" &&
          origin === new URL(request.url).origin);
  if (!permitted) return null;
  return {
    "Access-Control-Allow-Origin": origin!,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    Vary: "Origin",
  };
}

async function boundedJson(request: Request, limit: number) {
  if (
    !/^application\/json(?:;|$)/i.test(
      request.headers.get("content-type") ?? "",
    )
  )
    throw new Error("invalid body");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("missing body");
  let length = 0;
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > limit) {
      await reader.cancel();
      throw new Error("body too large");
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function migrationOptions(
  request: Request,
  operation: "mint" | "redeem",
) {
  const headers = migrationHeaders(request, operation);
  return new NextResponse(null, {
    status: headers ? 204 : 403,
    headers: headers ?? { "Cache-Control": "no-store" },
  });
}

export async function migrationRequest(
  request: Request,
  operation: "mint" | "redeem",
) {
  const headers = migrationHeaders(request, operation);
  if (!headers)
    return NextResponse.json(
      { error: "Origin not permitted" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  let body;
  try {
    body = await boundedJson(request, operation === "mint" ? 65536 : 1024);
  } catch {
    return NextResponse.json(
      { error: "Invalid transfer request" },
      { status: 400, headers },
    );
  }
  try {
    if (operation === "mint") {
      const parsed = transferSchema.safeParse(body);
      if (!parsed.success)
        return NextResponse.json(
          { error: "Invalid countdown export" },
          { status: 400, headers },
        );
      const secret = process.env.AUTH_STATE_SECRET;
      if (!secret || secret.length < 32)
        throw new Error("Migration unavailable");
      const token = randomBytes(32).toString("base64url");
      // Nginx overwrites X-Real-IP; do not trust user-supplied forwarding chains.
      const clientHash = createHmac("sha256", secret)
        .update(request.headers.get("x-real-ip") ?? "unknown")
        .digest("hex");
      const minted = await sendTimekeeperRequest<{ expiresAt: string }>(
        "mint",
        {
          token_hash: createHash("sha256").update(token).digest("hex"),
          client_hash: clientHash,
          payload_json: JSON.stringify(parsed.data),
        },
      );
      return NextResponse.json(
        { token, expiresAt: minted.expiresAt },
        { status: 201, headers },
      );
    }
    if (
      !body ||
      typeof body.token !== "string" ||
      !/^[A-Za-z0-9_-]{43}$/.test(body.token)
    )
      return NextResponse.json(
        { error: "Invalid transfer ticket" },
        { status: 400, headers },
      );
    const result = await sendTimekeeperRequest<{ payload: unknown }>("redeem", {
      token_hash: createHash("sha256").update(body.token).digest("hex"),
    });
    return NextResponse.json(transferSchema.parse(result.payload), { headers });
  } catch (error) {
    const status =
      error instanceof ClientResponseError && [404, 429].includes(error.status)
        ? error.status
        : 503;
    return NextResponse.json(
      {
        error:
          status === 404
            ? "This transfer has expired or was already used. Export your data again from TimeKeeper."
            : status === 429
              ? "Please wait before creating another transfer."
              : "Transfer is temporarily unavailable. You can use JSON export/import instead.",
      },
      { status, headers },
    );
  }
}
