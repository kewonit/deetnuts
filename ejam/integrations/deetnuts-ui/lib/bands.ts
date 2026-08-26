import type { ProbabilityBand } from "@ejam/data/college-predictor";

export const BAND_STYLES: Record<
  ProbabilityBand,
  { label: string; color: string }
> = {
  safe: { label: "Likely", color: "#00C951" },
  iffy: { label: "Possible", color: "#52A2FF" },
  delulu: { label: "Unlikely", color: "#FEB903" },
  "doesnt-matter": { label: "Very unlikely", color: "#FF6467" },
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
  label,
  color,
}));
