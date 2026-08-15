import type { ProbabilityBand } from "@ejam/data/college-predictor";

export const BAND_STYLES: Record<
  ProbabilityBand,
  { label: string; color: string }
> = {
  safe: { label: "Safe", color: "#00C951" },
  iffy: { label: "Iffy", color: "#52A2FF" },
  delulu: { label: "Delulu", color: "#FEB903" },
  "doesnt-matter": { label: "Doesn't matter yaar", color: "#FF6467" },
};

export const BAND_FILTER_OPTIONS: Array<{
  id: ProbabilityBand;
  label: string;
  color: string;
}> = (
  Object.entries(BAND_STYLES) as Array<
    [ProbabilityBand, (typeof BAND_STYLES)[ProbabilityBand]]
  >
).map(([id, { label, color }]) => ({
  id,
  // short label for the chance filter chip only
  label: id === "doesnt-matter" ? "DNMY" : label,
  color,
}));
