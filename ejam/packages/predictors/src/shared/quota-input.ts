/**
 * quota enum and UI→API mapping for JoSAA-style predictors
 * OS and HS require canonical home state before predict() runs
 */

import { z } from "zod4";

export const QuotaApi = z.enum(["OS", "HS", "AI"]);
export type QuotaApi = z.infer<typeof QuotaApi>;

export function uiQuotaToApi(quota: string): QuotaApi {
  const mapped: Record<string, QuotaApi> = {
    os: "OS",
    hs: "HS",
    ai: "AI",
  };
  return mapped[quota.toLowerCase()] ?? "OS";
}

export function quotaRequiresHomeState(quota: string): boolean {
  const apiQuota = uiQuotaToApi(quota);
  return apiQuota === "OS" || apiQuota === "HS";
}

export function examUsesQuotaHomeState(exam: string): boolean {
  return exam === "jee-main" || exam === "csab";
}

export function refineQuotaRequiresState(
  data: { quota: QuotaApi; state?: string },
  ctx: z.RefinementCtx,
): void {
  if ((data.quota === "OS" || data.quota === "HS") && !data.state?.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["state"],
      message: "state is required for OS and HS quota",
    });
  }
}
