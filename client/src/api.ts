const BASE = "/api";

export interface Confidence {
  score: number;
  grade: string;
  components: ComponentScore[];
}

export interface ComponentScore {
  name: string;
  score: number;
  weight: number;
}

export interface Signal {
  pair: string;
  type: "BUY" | "SELL";
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  regime?: string;
  regimeStrength?: string;
  hurst: number;
  dfa: number | null;
  stopDistance: number;
  confidence: Confidence;
  timestamp: string;
}

export interface Regime {
  regime: "TRENDING" | "RANDOM" | "MEAN_REVERTING" | "UNKNOWN";
  hurst: number;
  dfa: number | null;
  confidence: number;
}

export interface TimeframeData {
  signal: Signal | null;
  regime: Regime;
  trend?: "BULLISH" | "BEARISH" | "NEUTRAL";
  lastPrice: number;
}

export interface Confluence {
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
}

export interface BtcFilter {
  btcTrend?: "BULLISH" | "BEARISH" | "NEUTRAL";
  score?: number;
}

export interface FractalData {
  pair: string;
  timeframes: Record<string, TimeframeData>;
  confluence: Confluence;
  btcFilter: BtcFilter;
  dataSource?: string;
  timestamp?: string;
}

export async function fetchPairs(): Promise<string[]> {
  const res = await fetch(`${BASE}/pairs`);
  if (!res.ok) throw new Error("Failed to fetch pairs");
  const data = await res.json();
  return data.pairs;
}

export async function fetchFractal(pair: string): Promise<FractalData> {
  const res = await fetch(`${BASE}/fractal/${encodeURIComponent(pair)}`);
  if (!res.ok) {
    if (res.status === 503) throw new Error("Market data unavailable");
    throw new Error("Please refresh the page");
  }
  return res.json();
}

export interface ChartIndicators {
  kama: (number | null)[];
  t3: (number | null)[];
  macd: (number | null)[];
  macdSignal: (number | null)[];
  atr: (number | null)[];
}

export interface ChartData {
  pair: string;
  timeframe: string;
  timestamps: number[];
  opens: number[];
  highs: number[];
  lows: number[];
  closes: number[];
  volumes: number[];
  indicators: ChartIndicators;
}

export async function fetchChart(pair: string, timeframe: string): Promise<ChartData> {
  const res = await fetch(`${BASE}/chart/${encodeURIComponent(pair)}/${timeframe}`);
  if (!res.ok) {
    if (res.status === 503) throw new Error("Market data unavailable");
    throw new Error("Failed to fetch chart data");
  }
  return res.json();
}
