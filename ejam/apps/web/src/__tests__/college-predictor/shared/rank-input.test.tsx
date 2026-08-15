// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RankInput } from "@/components/predictor/rank-input";

afterEach(() => cleanup());

describe("rank input accessibility", () => {
  it("updates its exam-specific accessible name", () => {
    const onValueChange = () => {};
    const { rerender } = render(
      <RankInput
        value=""
        onValueChange={onValueChange}
        aria-label="MHT-CET merit rank"
      />,
    );

    expect(
      screen.getByRole("textbox", { name: "MHT-CET merit rank" }),
    ).not.toBeNull();

    rerender(
      <RankInput value="" onValueChange={onValueChange} aria-label="Rank" />,
    );

    expect(screen.getByRole("textbox", { name: "Rank" })).not.toBeNull();
    expect(
      screen.queryByRole("textbox", { name: "MHT-CET merit rank" }),
    ).toBeNull();
  });
});
