// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { MhtCetVirtualResults } from "@/components/predictor/mht-cet/virtual-results";
import type { PredictorDisplayProgram } from "@/lib/predictor-adapters";

vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: ({
    count,
    getItemKey,
  }: {
    count: number;
    getItemKey: (index: number) => string;
  }) => ({
    getTotalSize: () => count * 48,
    getVirtualItems: () =>
      Array.from({ length: Math.min(count, 12) }, (_, index) => ({
        index,
        key: getItemKey(index),
        size: 48,
        start: index * 48,
      })),
    measure: () => {},
    measureElement: () => {},
  }),
}));

class TestResizeObserver {
  readonly callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    this.callback(
      [
        {
          target,
          contentRect: target.getBoundingClientRect(),
        } as ResizeObserverEntry,
      ],
      this as unknown as ResizeObserver,
    );
  }

  disconnect() {}
  unobserve() {}
}

function displayProgram(index: number): PredictorDisplayProgram {
  const code = String(index + 1).padStart(5, "0");
  return {
    key: `${code}::${String(index + 1).padStart(10, "0")}`,
    exam: "mht-cet",
    instituteId: `mht-institute-${code}`,
    instituteCode: code,
    instituteName: `Institute ${index + 1}`,
    instituteType: index % 2 ? "Government" : "Private",
    programId: "computer-engineering",
    programName: "Computer Engineering",
    choiceCode: String(index + 1).padStart(10, "0"),
    band: "safe",
    overallProbability: 0.9,
    predictedClosingRank: 2_000 + index,
    roundProbabilities: [0.9, 0.8, 0.85, null],
    roundCount: 4,
    seatPoolLabel: "GOPENH",
    dataQuality: "inferred",
    yearsOfData: 2,
    latestYear: 2025,
  };
}

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", TestResizeObserver);
  HTMLElement.prototype.scrollTo = vi.fn();
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get: () => 640,
  });
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get: () => 1_280,
  });
  HTMLElement.prototype.getBoundingClientRect = () =>
    ({
      width: 1_280,
      height: 640,
      top: 0,
      left: 0,
      right: 1_280,
      bottom: 640,
      x: 0,
      y: 0,
      toJSON: () => {},
    }) as DOMRect;
});

afterEach(() => cleanup());

describe("MHT-CET virtual results", () => {
  it("bounds mounted programs and loads only after an explicit press", async () => {
    const user = userEvent.setup();
    const loadMore = vi.fn();
    const rows = Array.from({ length: 100 }, (_, index) =>
      displayProgram(index),
    );
    const { container, rerender } = render(
      <MhtCetVirtualResults
        rows={rows}
        total={2_072}
        selectedId={null}
        resultKey="first"
        hasMore
        loadingMore={false}
        pageError={null}
        onSelect={() => {}}
        onLoadMore={loadMore}
      />,
    );

    const mountedPrograms = container.querySelectorAll(
      "[aria-rowindex], [aria-posinset]",
    );
    expect(mountedPrograms.length).toBeGreaterThan(0);
    expect(mountedPrograms.length).toBeLessThanOrEqual(40);
    expect(loadMore).not.toHaveBeenCalled();

    const buttons = screen.getAllByRole("button", { name: "Load 100 more" });
    await user.click(buttons[0]);
    expect(loadMore).toHaveBeenCalledTimes(1);

    rerender(
      <MhtCetVirtualResults
        rows={Array.from({ length: 200 }, (_, index) => displayProgram(index))}
        total={2_072}
        selectedId={null}
        resultKey="first"
        hasMore
        loadingMore={false}
        pageError={null}
        onSelect={() => {}}
        onLoadMore={loadMore}
      />,
    );
    expect(document.activeElement).toBe(buttons[0]);
  });

  it("exposes total-position metadata without serious axe violations", async () => {
    const rows = Array.from({ length: 100 }, (_, index) =>
      displayProgram(index),
    );
    const { container } = render(
      <MhtCetVirtualResults
        rows={rows}
        total={2_072}
        selectedId={null}
        resultKey="first"
        hasMore
        loadingMore={false}
        pageError={null}
        onSelect={() => {}}
        onLoadMore={() => {}}
      />,
    );

    expect(
      container.querySelector("table")?.getAttribute("aria-rowcount"),
    ).toBe("2072");
    expect(
      container.querySelector("[aria-posinset]")?.getAttribute("aria-setsize"),
    ).toBe("2072");
    const report = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(
      report.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? ""),
      ),
    ).toEqual([]);
  });
});
