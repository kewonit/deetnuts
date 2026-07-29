import type { BotUsageEvent, BotUsageStatus } from "@/lib/bot/usage";

export interface StateCutoffSearchUsageInput {
  requestId: string;
  status: Extract<BotUsageStatus, "served" | "rejected" | "failed">;
  durationMs: number;
}

type AfterScheduler = (callback: () => void | Promise<void>) => void;
type UsageWriter = (event: BotUsageEvent) => Promise<void>;

export function buildStateCutoffSearchUsageEvent(
  input: StateCutoffSearchUsageInput,
): BotUsageEvent {
  return {
    requestId: input.requestId,
    platform: "web",
    source: "mht-cet-state-cutoffs",
    eventName: "state_cutoff_search",
    status: input.status,
    durationMs: Math.max(0, Math.round(input.durationMs)),
  };
}

export function scheduleStateCutoffSearchUsage(
  event: BotUsageEvent,
  scheduleAfter: AfterScheduler,
  writeUsage: UsageWriter,
): void {
  try {
    scheduleAfter(async () => {
      try {
        await writeUsage(event);
      } catch (error) {
        console.warn("State cutoff search logging failed", {
          requestId: event.requestId,
          error,
        });
      }
    });
  } catch (error) {
    console.warn("State cutoff search logging could not be scheduled", {
      requestId: event.requestId,
      error,
    });
  }
}
