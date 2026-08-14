/**
 * predictor dispatch registry — maps exam_id to its predictor module
 * add an entry here when a new exam predictor is implemented
 * the API route uses this to dispatch without knowing exam internals
 */

import type { ExamPredictor } from "@ejam/data";

/** registry entry — predictor is lazy-loaded to keep API cold-start light */
type RegistryEntry = {
  load: () => Promise<ExamPredictor>;
};

/**
 * map of exam_id → async loader for its predictor
 * lazy import ensures bundle splitting — each predictor only loads on first request for that exam
 */
const REGISTRY: Record<string, RegistryEntry> = {
  "jee-main": {
    load: () => import("./jee-main/index").then((m) => m.predictor),
  },
  "jee-advanced": {
    load: () => import("./jee-advanced/index").then((m) => m.predictor),
  },
  csab: {
    load: () => import("./csab/index").then((m) => m.predictor),
  },
  "mht-cet": {
    load: () => import("./mht-cet/index").then((m) => m.predictor),
  },
};

/** returns the predictor for the given exam_id, or null if unregistered */
export async function getPredictor(
  examId: string,
): Promise<ExamPredictor | null> {
  const entry = REGISTRY[examId];
  if (!entry) return null;
  try {
    return await entry.load();
  } catch {
    // predictor module not yet implemented — treated as unregistered
    return null;
  }
}

/** list all exam IDs that have a registered predictor */
export function registeredExamIds(): string[] {
  return Object.keys(REGISTRY);
}
