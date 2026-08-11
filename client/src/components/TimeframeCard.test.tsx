import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TimeframeCard from "./TimeframeCard";
import { chartDataFixture, signalFixture, timeframeDataFixture } from "../test/fixtures";

const { fetchChartMock } = vi.hoisted(() => ({
  fetchChartMock: vi.fn(),
}));

vi.mock("./CandleChart", () => ({
  default: () => <div>VW-MACD</div>,
}));

vi.mock("../api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api")>();
  return {
    ...actual,
    fetchChart: fetchChartMock,
  };
});

describe("TimeframeCard", () => {
  beforeEach(() => {
    fetchChartMock.mockReset();
    fetchChartMock.mockResolvedValue(chartDataFixture);
  });

  it("renders timeframe name and no data state", () => {
    render(<TimeframeCard tf="15m" pair="BTC/USDT" data={null} />);
    expect(screen.getByText("15m")).toBeInTheDocument();
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("renders no signal state with regime", () => {
    render(<TimeframeCard tf="1h" pair="BTC/USDT" data={{ ...timeframeDataFixture, signal: null }} />);
    expect(screen.getByText("No signal")).toBeInTheDocument();
    expect(screen.getByText("TRENDING")).toBeInTheDocument();
    expect(screen.getByText(/H=0.95/)).toBeInTheDocument();
  });

  it("renders a buy signal with entry, SL, TP, and percentages", () => {
    render(<TimeframeCard tf="1h" pair="BTC/USDT" data={timeframeDataFixture} />);
    expect(screen.getByText("BUY")).toBeInTheDocument();
    expect(screen.getByText("$64027.70")).toBeInTheDocument();
    expect(screen.getByText("$63984")).toBeInTheDocument();
    expect(screen.getByText("$64248")).toBeInTheDocument();
    expect(screen.getByText("(-0.07%)")).toBeInTheDocument();
    expect(screen.getByText("(+0.34%)")).toBeInTheDocument();
    expect(screen.getByText("87")).toBeInTheDocument();
    expect(screen.getByText("Score Breakdown")).toBeInTheDocument();
  });

  it("renders a sell signal with red styling", () => {
    const sell = { ...signalFixture, type: "SELL" as const };
    render(<TimeframeCard tf="1h" pair="BTC/USDT" data={{ ...timeframeDataFixture, signal: sell }} />);
    expect(screen.getByText("SELL")).toBeInTheDocument();
  });

  it("toggles chart visibility and fetches chart data", async () => {
    render(<TimeframeCard tf="1h" pair="BTC/USDT" data={timeframeDataFixture} />);
    expect(fetchChartMock).not.toHaveBeenCalled();
    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "Show Chart" }));
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(fetchChartMock).toHaveBeenCalledWith("BTC/USDT", "1h");
    expect(screen.getByText("Hide Chart")).toBeInTheDocument();
    expect(screen.getByText("VW-MACD")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Hide Chart" }));
    expect(screen.queryByText("VW-MACD")).not.toBeInTheDocument();
  });

  it("shows chart error and retry button on failure", async () => {
    fetchChartMock.mockRejectedValueOnce(new Error("Market data unavailable"));
    render(<TimeframeCard tf="1h" pair="BTC/USDT" data={timeframeDataFixture} />);
    await userEvent.click(screen.getByRole("button", { name: "Show Chart" }));
    await waitFor(() => expect(screen.getByText("Market data unavailable")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
