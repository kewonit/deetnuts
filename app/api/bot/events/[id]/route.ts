import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { hasValidBotToken } from "@/lib/bot/auth";
import {
  type BotProcessedEventStatus,
  updateBotEventStatus,
} from "@/lib/bot/events";

export const runtime = "nodejs";

const statusValues = ["replied", "skipped", "failed"] as const;

const updateSchema = z.object({
  status: z.enum(statusValues),
  metadata: z.record(z.unknown()).optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!hasValidBotToken(request.headers)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const { id } = await context.params;
    const body = updateSchema.parse(await request.json());
    const event = await updateBotEventStatus({
      id,
      status: body.status as BotProcessedEventStatus,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "INVALID_INPUT" },
        { status: 400 },
      );
    }

    console.error("Bot event update failed", error);
    return NextResponse.json(
      { success: false, error: "UPDATE_FAILED" },
      { status: 500 },
    );
  }
}
