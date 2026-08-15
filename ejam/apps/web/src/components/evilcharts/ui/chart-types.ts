import type * as React from "react";

const THEMES = { light: "", dark: ".dark" } as const;

type ThemeKey = keyof typeof THEMES;

type ThemeColorsBase = {
  [K in ThemeKey]?: string[];
};

type AtLeastOneThemeColor = {
  [K in ThemeKey]: Required<Pick<ThemeColorsBase, K>> &
    Partial<Omit<ThemeColorsBase, K>>;
}[ThemeKey];

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    colors?: AtLeastOneThemeColor;
  }
>;
