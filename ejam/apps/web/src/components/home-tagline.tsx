import { homeTaglineColumnClass } from "@/components/app-layout";
import { GradientText } from "@/components/gradient-text";
import { cn } from "@/lib/utils";

const indianGradientColors = ["#FF671F", "#4D80E6", "#53C266"] as const;

const taglineRevealStyle = (delayMs: number): React.CSSProperties =>
  ({ "--tagline-delay": `${delayMs}ms` }) as React.CSSProperties;

const WORD_STAGGER_MS = 55;
const TAGLINE_START_MS = 80;

function wordDelay(index: number): React.CSSProperties {
  return taglineRevealStyle(TAGLINE_START_MS + index * WORD_STAGGER_MS);
}

export function HomeTagline({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        homeTaglineColumnClass,
        "home-tagline font-instrument-sans text-balance text-[clamp(1.3125rem,3.8vw+0.65rem,1.875rem)] font-normal leading-[1.38] tracking-[-0.01em] text-[#FDFDFD] sm:leading-[1.35] md:leading-[1.32]",
        className,
      )}
    >
      <span
        className="home-tagline-part font-serif-display italic"
        style={wordDelay(0)}
      >
        Open-source
      </span>{" "}
      <span className="home-tagline-part" style={wordDelay(1)}>
        tools
      </span>{" "}
      <span className="home-tagline-part" style={wordDelay(2)}>
        for
      </span>{" "}
      <span className="home-tagline-part" style={wordDelay(3)}>
        students
      </span>{" "}
      <span className="home-tagline-part" style={wordDelay(4)}>
        around
      </span>{" "}
      <span className="home-tagline-part" style={wordDelay(5)}>
        <GradientText
          className="font-serif-display italic"
          colors={[...indianGradientColors]}
          animate={false}
        >
          Indian
        </GradientText>
      </span>{" "}
      <span className="home-tagline-part" style={wordDelay(6)}>
        exams
      </span>
    </p>
  );
}
