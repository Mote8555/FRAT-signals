import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FractalSignals, { getConfluenceLabel } from "./FractalSignals";
import { fractalDataFixture } from "../test/fixtures";

describe("getConfluenceLabel", () => {
  it("returns no data when nothing is counted", () => {
    expect(getConfluenceLabel(0, 0, 0)).toMatchObject({ label: "No data", color: "text-gray-400", pct: 0 });
  });

  it("classifies strong bullish at >= 75%", () => {
    expect(getConfluenceLabel(3, 1, 0)).toMatchObject({
      label: "STRONG BULLISH (3/4)",
      color: "text-green-500",
      pct: 75,
    });
  });

  it("classifies bullish at >= 50%", () => {
    expect(getConfluenceLabel(2, 1, 1)).toMatchObject({
      label: "BULLISH (2/4)",
      color: "text-green-500",
      pct: 50,
    });
  });

  it("classifies weak bullish below 50%", () => {
    expect(getConfluenceLabel(2, 1, 4)).toMatchObject({
      label: "WEAK BULLISH (2/7)",
      color: "text-yellow-500",
      pct: 29,
    });
  });

  it("classifies strong bearish at >= 75%", () => {
    expect(getConfluenceLabel(0, 3, 1)).toMatchObject({
      label: "STRONG BEARISH (3/4)",
      color: "text-red-500",
      pct: 75,
    });
  });

  it("classifies bearish at >= 50%", () => {
    expect(getConfluenceLabel(0, 2, 2)).toMatchObject({
      label: "BEARISH (2/4)",
      color: "text-red-400",
      pct: 50,
    });
  });

  it("classifies weak bearish below 50%", () => {
    expect(getConfluenceLabel(1, 2, 4)).toMatchObject({
      label: "WEAK BEARISH (2/7)",
      color: "text-orange-500",
      pct: 29,
    });
  });

  it("classifies ties as neutral", () => {
    expect(getConfluenceLabel(1, 1, 2)).toMatchObject({
      label: "NEUTRAL (1/4)",
      color: "text-gray-400",
      pct: 0,
    });
  });
});

describe("FractalSignals", () => {
  it("shows skeleton while loading", () => {
    render(<FractalSignals data={null} loading error={null} />);
    expect(document.querySelector(".animate-pulse")).not.toBeNull();
  });

  it("shows error message and triggers retry", async () => {
    const onRetry = vi.fn();
    render(<FractalSignals data={null} loading={false} error="Market data unavailable" onRetry={onRetry} />);
    expect(screen.getByText("Market data unavailable")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("prompts to select a pair when there is no data", () => {
    render(<FractalSignals data={null} loading={false} error={null} />);
    expect(screen.getByText("Select a pair to view fractal signals")).toBeInTheDocument();
  });

  it("renders pair, confluence label, and four timeframe cards", () => {
    render(<FractalSignals data={fractalDataFixture} loading={false} error={null} />);
    expect(screen.getByText("BTC/USDT")).toBeInTheDocument();
    expect(screen.getByText("WEAK BULLISH (1/4)")).toBeInTheDocument();
    expect(screen.getByText("BTC BULLISH")).toBeInTheDocument();
    for (const tf of ["15m", "1h", "4h", "1d"]) {
      expect(screen.getByText(tf)).toBeInTheDocument();
    }
    expect(screen.getByText(/Auto-refreshes every 180s/)).toBeInTheDocument();
  });

  it("renders buy signal badge for the timeframes that have one", () => {
    render(<FractalSignals data={fractalDataFixture} loading={false} error={null} />);
    expect(screen.getAllByText("BUY")).toHaveLength(1);
  });
});
