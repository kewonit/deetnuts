import { readFile } from "node:fs/promises";
import {
  MhtCetInstituteReference,
  mhtCetHomeUniversityForDistrict2026,
} from "@ejam/data/mht-cet";
import type { z } from "zod";
import { text } from "./normalize-support.js";

export async function readInstituteReferences(
  path: string,
): Promise<Array<z.infer<typeof MhtCetInstituteReference>>> {
  const raw: unknown = JSON.parse(await readFile(path, "utf-8"));
  if (!Array.isArray(raw)) {
    throw new Error(`${path}: institute reference must be a JSON array`);
  }
  return raw.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error(`${path}: institute reference ${index} is not an object`);
    }
    const record = entry as Record<string, unknown>;
    const district = text(record.district);
    const affiliatingUniversityId = text(
      record.affiliating_university_id ?? record.home_university_id,
    );
    const parsed = MhtCetInstituteReference.safeParse({
      ...record,
      home_university_id: mhtCetHomeUniversityForDistrict2026(district),
      affiliating_university_id: affiliatingUniversityId,
    });
    if (!parsed.success) {
      throw new Error(
        `${path}: institute reference ${index} failed validation: ${parsed.error.message}`,
      );
    }
    return parsed.data;
  });
}
