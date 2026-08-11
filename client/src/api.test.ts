import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchChart, fetchFractal, fetchPairs } from "./api";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchPairs", () => {
  it("returns the list of pairs", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ pairs: ["BTC/USDT", "ETH/USDT"] })));
    await expect(fetchPairs()).resolves.toEqual(["BTC/USDT", "ETH/USDT"]);
  });

  it("throws on non-OK response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 500)));
    await expect(fetchPairs()).rejects.toThrow("Failed to fetch pairs");
  });
});

describe("fetchFractal", () => {
  it("returns parsed fractal data", async () => {
    const body = { pair: "BTC/USDT", confluence: { bullishCount: 1, bearishCount: 0, neutralCount: 3 } };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(body)));
    await expect(fetchFractal("BTC/USDT")).resolves.toMatchObject(body);
  });

  it("encodes the pair in the URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);
    await fetchFractal("BTC/USDT");
    expect(fetchMock).toHaveBeenCalledWith("/api/fractal/BTC%2FUSDT");
  });

  it("maps 503 to a market-unavailable error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 503)));
    await expect(fetchFractal("BTC/USDT")).rejects.toThrow("Market data unavailable");
  });

  it("throws a generic error for other failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 500)));
    await expect(fetchFractal("BTC/USDT")).rejects.toThrow("Failed to fetch fractal signals");
  });
});

describe("fetchChart", () => {
  it("returns parsed chart data", async () => {
    const body = { pair: "BTC/USDT", timeframe: "1h", timestamps: [], opens: [] };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(body)));
    await expect(fetchChart("BTC/USDT", "1h")).resolves.toMatchObject(body);
  });

  it("maps 503 to a market-unavailable error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 503)));
    await expect(fetchChart("BTC/USDT", "1h")).rejects.toThrow("Market data unavailable");
  });
});
