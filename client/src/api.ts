const BASE = "/api";

export interface Confidence {
  score: number;
  grade: string;
  components?: ComponentScore[];
}

export interface ComponentScore {
  name: string;
  score: number;
  weight: number;
}

export interface Signal {
  type: "BUY" | "SELL";
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  regimeStrength?: string;
  hurst: number;
  dfa: number;
  confidence: Confidence;
}

export interface Regime {
  regime: "TRENDING" | "RANDOM" | "MEAN_REVERTING" | "UNKNOWN";
  hurst: number;
  dfa: number;
  confidence: number;
}

export interface TimeframeData {
  signal: Signal | null;
  regime: Regime;
  lastPrice: number;
  sparkline?: number[];
}

export interface Confluence {
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
}

export interface BtcFilter {
  btcTrend?: "BULLISH" | "BEARISH" | "NEUTRAL";
}

export interface FractalData {
  pair: string;
  timeframes: Record<string, TimeframeData>;
  confluence: Confluence;
  btcFilter: BtcFilter;
}

export async function fetchPairs(): Promise<string[]> {
  const res = await fetch(`${BASE}/pairs`);
  if (!res.ok) throw new Error("Failed to fetch pairs");
  const data = await res.json();
  return data.pairs;
}

export async function fetchSignal(pair: string): Promise<unknown> {
  const res = await fetch(`${BASE}/signal/${encodeURIComponent(pair)}`);
  if (!res.ok) {
    if (res.status === 503) throw new Error("Market data unavailable");
    throw new Error("Failed to fetch signal");
  }
  return res.json();
}

export async function fetchRegime(pair: string): Promise<unknown> {
  const res = await fetch(`${BASE}/regime/${encodeURIComponent(pair)}`);
  if (!res.ok) throw new Error("Failed to fetch regime");
  return res.json();
}

export async function fetchFractal(pair: string): Promise<FractalData> {
  const res = await fetch(`${BASE}/fractal/${encodeURIComponent(pair)}`);
  if (!res.ok) {
    if (res.status === 503) throw new Error("Market data unavailable");
    throw new Error("Failed to fetch fractal signals");
  }
  return res.json();
}
