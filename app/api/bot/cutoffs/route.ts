import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { hasValidBotToken } from "@/lib/bot/auth";
import {
  isDiscordGuildAllowed,
  isRedditSubredditAllowed,
} from "@/lib/bot/allowlist";
import { BotCutoffError, queryBotStateCutoffs } from "@/lib/bot/cutoff-query";

export const runtime = "nodejs";

const requestSchema = z.object({
  percentile: z.number(),
  year: z.number().int().optional(),
  round: z.number().int().optional(),
  limit: z.number().int().optional(),
  category: z.string().optional(),
  branch: z.string().optional(),
  course: z.string().optional(),
  platform: z.enum(["reddit", "discord", "api"]).optional(),
  source: z.string().optional(),
});

function isAllowedRequestSource(platform?: string, source?: string) {
  if (platform === "reddit") {
    return isRedditSubredditAllowed(source);
  }

  if (platform === "discord") {
    return isDiscordGuildAllowed(source);
  }

  return true;
}

function statusForCutoffError(error: BotCutoffError) {
  if (
    error.code === "INVALID_INPUT" ||
    error.code === "UNSUPPORTED_YEAR" ||
    error.code === "UNSUPPORTED_ROUND"
  ) {
    return 400;
  }

  if (error.code === "DATA_UNAVAILABLE") {
    return 404;
  }

  return 500;
}

export async function POST(request: NextRequest) {
  if (!hasValidBotToken(request.headers)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = requestSchema.parse(await request.json());

    if (!isAllowedRequestSource(body.platform, body.source)) {
      return NextResponse.json(
        { success: false, error: "Source is not allowed" },
        { status: 403 },
      );
    }

    const result = await queryBotStateCutoffs({
      percentile: body.percentile,
      year: body.year,
      round: body.round,
      limit: body.limit,
      category: body.category,
      branch: body.branch,
      course: body.course,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof BotCutoffError) {
      return NextResponse.json(
        {
          success: false,
          error: error.code,
          message: error.message,
        },
        { status: statusForCutoffError(error) },
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_INPUT",
          message: "Invalid cutoff request body",
        },
        { status: 400 },
      );
    }

    console.error("Bot cutoff API failed", error);
    return NextResponse.json(
      { success: false, error: "QUERY_FAILED" },
      { status: 500 },
    );
  }
}
