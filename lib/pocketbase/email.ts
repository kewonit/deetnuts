import { createHash } from "node:crypto";

const LOCAL_PART_PATTERN = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
const DOMAIN_LABEL_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;

export function isPocketBaseCompatibleEmail(email: string): boolean {
  if (!email || email.length > 254 || /\s/.test(email)) return false;

  const parts = email.split("@");
  if (parts.length !== 2) return false;

  const [localPart, domain] = parts;
  if (
    !localPart ||
    localPart.length > 64 ||
    !LOCAL_PART_PATTERN.test(localPart) ||
    localPart.startsWith(".") ||
    localPart.endsWith(".") ||
    localPart.includes("..")
  ) {
    return false;
  }

  const labels = domain.split(".");
  const topLevelDomain = labels.at(-1) || "";
  return (
    domain.length <= 253 &&
    labels.length >= 2 &&
    /^[A-Za-z]{2,63}$/.test(topLevelDomain) &&
    labels.every((label) => DOMAIN_LABEL_PATTERN.test(label))
  );
}

export function toPocketBaseAuthEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (isPocketBaseCompatibleEmail(normalized)) return normalized;

  const digest = createHash("sha256").update(normalized).digest("hex").slice(0, 40);
  return `${digest}@legacy.invalid.deetnuts.com`;
}
