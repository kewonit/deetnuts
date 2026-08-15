import type { ProgramPrediction } from "@ejam/data/college-predictor";
import { BAND_STYLES } from "@/lib/bands";

export function BandBadge({ band }: { band: ProgramPrediction["band"] }) {
  const { label, color } = BAND_STYLES[band];
  return (
    <span
      className="inline-flex h-5 shrink-0 items-center justify-center rounded-none px-2 text-xs font-medium whitespace-nowrap"
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)`,
      }}
    >
      {label}
    </span>
  );
}
