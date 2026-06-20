import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { hasValidBotToken } from "@/lib/bot/auth";
import { claimBotEvent } from "@/lib/bot/events";

export const runtime = "nodejs";

const claimSchema = z.object({
  platform: z.string().min(1),
  externalId: z.string().min(1),
  action: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  if (!hasValidBotToken(request.headers)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = claimSchema.parse(await request.json());
    const result = await claimBotEvent(body);

    return NextResponse.json({
      success: true,
      claimed: result.claimed,
      event: result.claimed ? result.event : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "INVALID_INPUT" },
        { status: 400 },
      );
    }

    console.error("Bot event claim failed", error);
    return NextResponse.json(
      { success: false, error: "CLAIM_FAILED" },
      { status: 500 },
    );
  }
}
