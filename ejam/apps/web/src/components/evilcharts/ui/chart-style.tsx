import type { ChartConfig } from "@/components/evilcharts/ui/chart-types";
import {
  CHART_THEMES,
  distributeColors,
  getColorsCount,
} from "@/components/evilcharts/ui/chart-utils";

export function ChartStyle({
  id,
  config,
}: {
  id: string;
  config: ChartConfig;
}) {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.colors,
  );

  if (!colorConfig.length) {
    return null;
  }

  const generateCssVars = (theme: keyof typeof CHART_THEMES) =>
    colorConfig
      .flatMap(([key, itemConfig]) => {
        const colorsArray = itemConfig.colors?.[theme];
        if (
          !colorsArray ||
          !Array.isArray(colorsArray) ||
          colorsArray.length === 0
        ) {
          return [];
        }

        const maxCount = getColorsCount(itemConfig);
        const distributedColors = distributeColors(colorsArray, maxCount);

        return distributedColors.map(
          (color, index) => `  --color-${key}-${index}: ${color};`,
        );
      })
      .join("\n");

  const css = Object.entries(CHART_THEMES)
    .map(
      ([theme, prefix]) =>
        `${prefix} [data-chart=${id}] {\n${generateCssVars(theme as keyof typeof CHART_THEMES)}\n}`,
    )
    .join("\n");

  return <style>{css}</style>;
}
