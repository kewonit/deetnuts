"use client";

import {
  domAnimation,
  LazyMotion,
  m,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import "./gradient-text.css";

type GradientTextProps = {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  /** Enable motion. Mixed mode uses organic CSS drift; shift mode slides a linear gradient. */
  animate?: boolean;
  animationSpeed?: number;
  showBorder?: boolean;
  direction?: "horizontal" | "vertical" | "diagonal";
  pauseOnHover?: boolean;
  yoyo?: boolean;
  /** Organic radial blend — colors melt via layered blobs, not linear sweeps. */
  mixed?: boolean;
};

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    Number.parseInt(h.slice(0, 2), 16),
    Number.parseInt(h.slice(2, 4), 16),
    Number.parseInt(h.slice(4, 6), 16),
  ];
}

function blendHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);
  const channel = (from: number, to: number) =>
    Math.round(from + (to - from) * t);
  const r = channel(ar, br);
  const g = channel(ag, bg);
  const bl = channel(ab, bb);
  return `#${[r, g, bl].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** White only tints mid-blends — never a visible stop */
function blendWithWhiteHint(
  a: string,
  b: string,
  t: number,
  hint: number,
): string {
  const mixed = blendHex(a, b, t);
  return hint > 0 ? blendHex(mixed, "#FFFFFF", hint) : mixed;
}

function buildSoftStops(colors: string[]): string {
  if (colors.length === 0) return "";
  if (colors.length === 1) return colors[0];

  const stops: string[] = [];
  for (let i = 0; i < colors.length; i++) {
    const current = colors[i];
    const next = colors[(i + 1) % colors.length];
    stops.push(
      current,
      blendWithWhiteHint(current, next, 0.32, 0.05),
      blendWithWhiteHint(current, next, 0.68, 0.07),
    );
  }
  stops.push(colors[0]);
  return stops.join(", ");
}

function buildStaticTricolorStyle(colors: string[]): React.CSSProperties {
  const [primary, secondary, tertiary] = colors;
  if (!primary || !secondary || !tertiary) {
    return { color: primary ?? "inherit" };
  }

  return {
    backgroundImage: `linear-gradient(110deg, ${primary} 0%, ${primary} 22%, ${blendHex(primary, secondary, 0.5)} 38%, ${secondary} 52%, ${blendHex(secondary, tertiary, 0.5)} 68%, ${tertiary} 82%, ${tertiary} 100%)`,
    backgroundSize: "100% 100%",
    backgroundPosition: "center",
  };
}

function buildMixedGradientStyle(colors: string[]): React.CSSProperties {
  const [primary, secondary, tertiary] = colors;
  if (!primary || !secondary || !tertiary) {
    return { color: primary ?? "inherit" };
  }

  const linearStops = buildSoftStops([primary, secondary, tertiary, primary]);

  return {
    backgroundImage: [
      `radial-gradient(ellipse 85% 75% at 50% 50%, ${primary} 0%, transparent 58%)`,
      `radial-gradient(ellipse 80% 72% at 50% 50%, ${tertiary} 0%, transparent 55%)`,
      `radial-gradient(ellipse 78% 78% at 50% 50%, ${secondary} 0%, transparent 52%)`,
      `linear-gradient(112deg, ${linearStops})`,
    ].join(", "),
    backgroundSize: "240% 240%, 260% 260%, 220% 220%, 200% 100%",
    backgroundPosition: "6% 36%, 94% 32%, 50% 70%, 0% 50%",
    backgroundBlendMode: "soft-light, soft-light, soft-light, normal",
  };
}

function buildShiftGradientStyle(
  colors: string[],
  direction: GradientTextProps["direction"],
): React.CSSProperties {
  const gradientAngle =
    direction === "horizontal"
      ? "to right"
      : direction === "vertical"
        ? "to bottom"
        : "to bottom right";

  const stopList = buildSoftStops(colors);

  return {
    backgroundImage: `linear-gradient(${gradientAngle}, ${stopList})`,
    backgroundSize:
      direction === "horizontal"
        ? "300% 100%"
        : direction === "vertical"
          ? "100% 300%"
          : "300% 300%",
    backgroundRepeat: "repeat",
  };
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

function MixedGradientText({
  children,
  className,
  colors,
  animate,
  animationSpeed,
}: {
  children: React.ReactNode;
  className?: string;
  colors: string[];
  animate: boolean;
  animationSpeed: number;
}) {
  const gradientStyle = useMemo(
    () =>
      animate
        ? buildMixedGradientStyle(colors)
        : buildStaticTricolorStyle(colors),
    [colors, animate],
  );

  return (
    <span
      className={cn("gradient-text-mixed", animate && "is-drifting", className)}
      style={
        animate
          ? ({
              "--gradient-drift-duration": `${animationSpeed}s`,
            } as React.CSSProperties)
          : undefined
      }
    >
      {animate ? (
        <span aria-hidden className="gradient-text-glow" style={gradientStyle}>
          {children}
        </span>
      ) : null}
      <span className="gradient-text-fill" style={gradientStyle}>
        {children}
      </span>
    </span>
  );
}

function ShiftingGradientText({
  children,
  className,
  colors,
  animationSpeed,
  showBorder,
  direction,
  pauseOnHover,
  yoyo,
}: Required<
  Pick<
    GradientTextProps,
    | "children"
    | "className"
    | "colors"
    | "animationSpeed"
    | "showBorder"
    | "direction"
    | "pauseOnHover"
    | "yoyo"
  >
>) {
  const isPausedRef = useRef(false);
  const progress = useMotionValue(0);
  const elapsedRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const animationDuration = animationSpeed * 1000;

  useAnimationFrame((time) => {
    if (isPausedRef.current) {
      lastTimeRef.current = null;
      return;
    }

    if (lastTimeRef.current === null) {
      lastTimeRef.current = time;
      return;
    }

    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    elapsedRef.current += deltaTime;

    let linear = 0;

    if (yoyo) {
      const fullCycle = animationDuration * 2;
      const cycleTime = elapsedRef.current % fullCycle;

      if (cycleTime < animationDuration) {
        linear = cycleTime / animationDuration;
      } else {
        linear = 1 - (cycleTime - animationDuration) / animationDuration;
      }
    } else {
      linear = (elapsedRef.current / animationDuration) % 1;
    }

    progress.set(easeInOutSine(linear) * 100);
  });

  useEffect(() => {
    elapsedRef.current = 0;
    progress.set(0);
  }, [progress]);

  const backgroundPosition = useTransform(progress, (p) => {
    if (direction === "vertical") {
      return `50% ${p}%`;
    }
    return `${p}% 50%`;
  });

  const handleMouseEnter = useCallback(() => {
    if (pauseOnHover) isPausedRef.current = true;
  }, [pauseOnHover]);

  const handleMouseLeave = useCallback(() => {
    if (pauseOnHover) isPausedRef.current = false;
  }, [pauseOnHover]);

  const gradientStyle = useMemo(
    () => buildShiftGradientStyle(colors, direction),
    [colors, direction],
  );

  return (
    <LazyMotion features={domAnimation} strict>
      <m.span
        className={cn(
          "animated-gradient-text",
          showBorder && "with-border",
          className,
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {showBorder ? (
          <m.span
            className="gradient-overlay"
            style={{ ...gradientStyle, backgroundPosition }}
          />
        ) : null}
        <m.span
          className="text-content"
          style={{ ...gradientStyle, backgroundPosition }}
        >
          {children}
        </m.span>
      </m.span>
    </LazyMotion>
  );
}

export function GradientText({
  children,
  className = "",
  colors = ["#5227FF", "#FF9FFC", "#B497CF"],
  animate = false,
  animationSpeed = 12,
  showBorder = false,
  direction = "horizontal",
  pauseOnHover = false,
  yoyo = true,
  mixed = true,
}: GradientTextProps) {
  const shouldReduceMotion = useReducedMotion();

  if (mixed) {
    return (
      <MixedGradientText
        className={className}
        colors={colors}
        animate={animate && !shouldReduceMotion}
        animationSpeed={animationSpeed}
      >
        {children}
      </MixedGradientText>
    );
  }

  if (shouldReduceMotion) {
    return (
      <span className={cn(className)} style={{ color: colors[0] }}>
        {children}
      </span>
    );
  }

  return (
    <ShiftingGradientText
      className={className}
      colors={colors}
      animationSpeed={animationSpeed}
      showBorder={showBorder}
      direction={direction}
      pauseOnHover={pauseOnHover}
      yoyo={yoyo}
    >
      {children}
    </ShiftingGradientText>
  );
}
