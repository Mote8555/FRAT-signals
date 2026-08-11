import type { ChartData, FractalData, Regime, Signal, TimeframeData } from "../api";

export const regimeFixture: Regime = {
  regime: "TRENDING",
  hurst: 0.95,
  dfa: 1.7,
  confidence: 87,
};

export const signalFixture: Signal = {
  pair: "BTC/USDT",
  type: "BUY",
  entryPrice: 64027.7,
  stopLoss: 63983.7,
  takeProfit: 64247.7,
  regime: "TRENDING",
  regimeStrength: "STRONG_TRENDING",
  hurst: 0.95,
  dfa: 1.7,
  stopDistance: 44,
  confidence: {
    score: 87,
    grade: "A",
    components: [
      { name: "regime", score: 90, weight: 0.4 },
      { name: "trend", score: 80, weight: 0.3 },
      { name: "momentum", score: 85, weight: 0.2 },
      { name: "btcFilter", score: 92, weight: 0.1 },
    ],
  },
  timestamp: "2026-06-18T11:20:24.792Z",
};

export const timeframeDataFixture: TimeframeData = {
  signal: signalFixture,
  regime: regimeFixture,
  trend: "BULLISH",
  lastPrice: 64027.7,
};

export const fractalDataFixture: FractalData = {
  pair: "BTC/USDT",
  timeframes: {
    "15m": { ...timeframeDataFixture, signal: null },
    "1h": timeframeDataFixture,
    "4h": { ...timeframeDataFixture, signal: null },
    "1d": { ...timeframeDataFixture, signal: null },
  },
  confluence: { bullishCount: 1, bearishCount: 0, neutralCount: 3 },
  btcFilter: { btcTrend: "BULLISH", score: 82 },
  dataSource: "Kraken",
  timestamp: "2026-06-18T11:30:43.217Z",
};

export const chartDataFixture: ChartData = {
  pair: "BTC/USDT",
  timeframe: "1h",
  timestamps: [1700000000000, 1700003600000],
  opens: [100, 101],
  highs: [102, 103],
  lows: [99, 100],
  closes: [101, 102],
  volumes: [10, 11],
  indicators: {
    kama: [100, 101],
    t3: [100, 101],
    macd: [0.5, 0.6],
    macdSignal: [0.4, 0.45],
    atr: [1, 1.1],
  },
};
