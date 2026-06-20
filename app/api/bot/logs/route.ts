import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { hasValidBotToken } from "@/lib/bot/auth";
import {
  BOT_USAGE_EVENT_NAMES,
  BOT_USAGE_STATUSES,
  logBotUsageEvent,
} from "@/lib/bot/usage";

export const runtime = "nodejs";

const usageLogSchema = z.object({
  requestId: z.string().min(1),
  externalId: z.string().optional().nullable(),
  platform: z.enum(["discord", "reddit", "api", "worker"]),
  source: z.string().optional().nullable(),
  eventName: z.enum(BOT_USAGE_EVENT_NAMES),
  status: z.enum(BOT_USAGE_STATUSES),
  percentile: z.number().optional().nullable(),
  year: z.number().int().optional().nullable(),
  round: z.number().int().optional().nullable(),
  resultCount: z.number().int().optional().nullable(),
  durationMs: z.number().int().optional().nullable(),
  errorCode: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  if (!hasValidBotToken(request.headers)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const event = usageLogSchema.parse(await request.json());
    await logBotUsageEvent(event);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "INVALID_INPUT" },
        { status: 400 },
      );
    }

    console.error("Bot usage log route failed", error);
    return NextResponse.json(
      { success: false, error: "LOG_FAILED" },
      { status: 500 },
    );
  }
}
