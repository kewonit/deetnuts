import type { PredictorDisplayProgram } from "@/lib/predictor-adapters";

export function programKey(p: PredictorDisplayProgram): string {
  return p.key;
}
