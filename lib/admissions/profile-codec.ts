import {
  AdmissionsStoredProfileSchema,
  type AdmissionsStoredProfile,
} from "@/lib/admissions/profile";
import type { AdmissionsSystem } from "@/lib/admissions/types";

export const PROFILE_FRAGMENT_PREFIX = "profile=v1.";

export function getAdmissionsProfileStorageKey(system: AdmissionsSystem): string {
  return `deetnuts:admissions-profile:v1:${system}`;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    Math.ceil(value.length / 4) * 4,
    "=",
  );
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function encodeAdmissionsProfileFragment(
  value: AdmissionsStoredProfile,
): string {
  const parsed = AdmissionsStoredProfileSchema.parse(value);
  const bytes = new TextEncoder().encode(JSON.stringify(parsed));
  return `${PROFILE_FRAGMENT_PREFIX}${bytesToBase64Url(bytes)}`;
}

export function decodeAdmissionsProfileFragment(
  hash: string,
  expectedSystem?: AdmissionsSystem,
): AdmissionsStoredProfile | null {
  const normalized = hash.replace(/^#/, "");
  const part = normalized
    .split("&")
    .find((entry) => entry.startsWith(PROFILE_FRAGMENT_PREFIX));
  if (!part) return null;
  const encoded = part.slice(PROFILE_FRAGMENT_PREFIX.length);
  if (!encoded || encoded.length > 12_000) return null;

  try {
    const json = new TextDecoder().decode(base64UrlToBytes(encoded));
    const parsed = AdmissionsStoredProfileSchema.safeParse(JSON.parse(json));
    if (!parsed.success) return null;
    if (expectedSystem && parsed.data.system !== expectedSystem) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function decodeAdmissionsDeviceProfile(
  value: string | null,
  expectedSystem?: AdmissionsSystem,
): AdmissionsStoredProfile | null {
  if (!value || value.length > 12_000) return null;
  try {
    const parsed = AdmissionsStoredProfileSchema.safeParse(JSON.parse(value));
    if (!parsed.success) return null;
    if (expectedSystem && parsed.data.system !== expectedSystem) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function resolveAdmissionsProfileSources(
  hash: string,
  deviceValue: string | null,
  expectedSystem: AdmissionsSystem,
): { profile: AdmissionsStoredProfile; source: "link" | "device" } | null {
  const linked = decodeAdmissionsProfileFragment(hash, expectedSystem);
  if (linked) return { profile: linked, source: "link" };
  const stored = decodeAdmissionsDeviceProfile(deviceValue, expectedSystem);
  return stored ? { profile: stored, source: "device" } : null;
}

export function setProfileFragmentInUrl(
  currentUrl: URL,
  fragment: string | null,
): URL {
  const next = new URL(currentUrl.toString());
  const existing = next.hash
    .replace(/^#/, "")
    .split("&")
    .filter(Boolean)
    .filter((entry) => !entry.startsWith("profile="));
  if (fragment) existing.push(fragment.replace(/^#/, ""));
  next.hash = existing.length > 0 ? existing.join("&") : "";
  return next;
}
