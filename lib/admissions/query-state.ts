export function parseAdmissionsInteger(value?: string): number | undefined {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

export function withNeutralAdmissionsQuery(
  path: string,
  values: Record<string, string | number | undefined>,
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const serialized = query.toString();
  return serialized ? `${path}?${serialized}` : path;
}
