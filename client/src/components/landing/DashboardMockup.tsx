import ConfidenceMeter from "../ConfidenceMeter";
import ComponentBreakdown from "../ComponentBreakdown";
import Sparkline from "../Sparkline";
import type { Confidence, ComponentScore } from "../../api";

interface MockCard {
  tf: string;
  signal: "BUY" | "SELL" | null;
  regime: string;
  entry?: number;
  sl?: number;
  tp?: number;
  price?: number;
  hurst?: number;
  dfa?: number;
  confidence?: number;
  confidenceScore?: Confidence;
  spark?: number[];
  colors?: { text: string; bg: string };
}

const sparkUp = [109200, 109300, 109250, 109500, 109480, 109620, 109600, 109750];
const sparkDown = [109900, 109800, 109950, 109600, 109450, 109500, 109300, 109200];

const regimeColors: Record<string, { text: string; bg: string }> = {
  TRENDING: { text: "text-green-500", bg: "bg-green-500/10" },
  RANDOM: { text: "text-yellow-500", bg: "bg-yellow-500/10" },
  MEAN_REVERTING: { text: "text-red-500", bg: "bg-red-500/10" },
  UNKNOWN: { text: "text-gray-400", bg: "bg-gray-500/10" },
};

const components = (regime: number, trend: number, momentum: number, btc: number): ComponentScore[] => [
  { name: "regime", score: regime, weight: 30 },
  { name: "trend", score: trend, weight: 25 },
  { name: "momentum", score: momentum, weight: 25 },
  { name: "btcFilter", score: btc, weight: 20 },
];

const CARDS: MockCard[] = [
  {
    tf: "15m",
    signal: "SELL",
    regime: "TRENDING",
    entry: 109412,
    sl: 109712,
    tp: 108612,
    price: 109412,
    hurst: 0.74,
    dfa: 1.28,
    confidence: 72,
    spark: sparkDown,
  },
  {
    tf: "1h",
    signal: "BUY",
    regime: "TRENDING",
    entry: 109500,
    sl: 108900,
    tp: 111700,
    price: 109500,
    hurst: 0.81,
    dfa: 1.45,
    confidence: 88,
    confidenceScore: { score: 94, grade: "A+", components: components(100, 92, 88, 95) },
    spark: sparkUp,
  },
  { tf: "4h", signal: null, regime: "RANDOM", hurst: 0.52, dfa: 0.98, confidence: 49 },
  { tf: "1d", signal: null, regime: "TRENDING", hurst: 0.69, dfa: 1.3, confidence: 83 },
];

function Card({ card, compact }: { card: MockCard; compact: boolean }) {
  const isBuy = card.signal === "BUY";
  const signalColor = isBuy ? "green" : "red";
  const signalText = isBuy ? "text-green-500" : "text-red-500";
  const signalBg = isBuy ? "bg-green-500/10" : "bg-red-500/10";
  const signalBorder = isBuy ? "border-green-500/30" : "border-red-500/30";
  const colors = regimeColors[card.regime] || regimeColors.UNKNOWN;
  const slPct = card.entry && card.sl ? (((card.sl - card.entry) / card.entry) * 100).toFixed(2) : null;
  const tpPct = card.entry && card.tp ? (((card.tp - card.entry) / card.entry) * 100).toFixed(2) : null;

  return (
    <div
      className={`flex flex-col gap-2 rounded-[10px] border bg-[#0f1219] ${
        card.signal ? `${signalBorder} border-[1.5px]` : "border-slate-800/60"
      }`}
      style={card.signal ? { boxShadow: `0 0 14px ${signalColor === "green" ? "#22c55e22" : "#ef444422"}` } : undefined}
    >
      <div className="flex items-center justify-between">
        <span className="font-bold text-sm text-gray-50">{card.tf}</span>
        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${colors.text} ${colors.bg}`}>
          {card.regime}
        </span>
      </div>

      <div className="flex items-center justify-center py-1">
        {card.signal ? (
          <div className={`px-6 py-1 rounded-md border font-bold text-lg ${signalBg} ${signalText} ${signalBorder}`}>
            {card.signal}
          </div>
        ) : (
          <span className="text-gray-300 text-[13px] font-medium">No signal</span>
        )}
      </div>

      {card.spark && <Sparkline data={card.spark} color={signalColor === "green" ? "#22c55e" : "#ef4444"} height={28} />}

      {card.signal && card.entry && (
        <>
          <div className="flex gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-gray-400 uppercase font-semibold mb-px">Entry</div>
              <div className="text-[13px] font-semibold text-gray-50">${card.entry.toLocaleString()}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-gray-400 uppercase font-semibold mb-px">SL</div>
              <div className="text-[13px] font-semibold text-red-500">
                ${card.sl?.toLocaleString()}
                {slPct && <span className="text-[10px] ml-0.5">({slPct}%)</span>}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-gray-400 uppercase font-semibold mb-px">TP</div>
              <div className="text-[13px] font-semibold text-green-500">
                ${card.tp?.toLocaleString()}
                {tpPct && <span className="text-[10px] ml-0.5">(+{tpPct}%)</span>}
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <ConfidenceMeter
              confidence={card.confidenceScore || { score: card.confidence || 70, grade: "B", components: [] }}
              size={compact ? 54 : 64}
            />
          </div>
          {card.confidenceScore && <ComponentBreakdown components={card.confidenceScore.components} />}
        </>
      )}

      <div className="text-[11px] text-gray-400 text-center border-t border-slate-800/60 pt-2">
        H={card.hurst} &middot; DFA={card.dfa} &middot; conf={card.confidence}%
      </div>
    </div>
  );
}

export default function DashboardMockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-800/60 bg-gray-900 shadow-2xl shadow-blue-500/5 overflow-hidden text-left">
      <div className="flex flex-col gap-2 border-b border-slate-800/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-gray-50">BTC/USDT</span>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-green-500">BTC BULLISH</span>
          <span className="text-[13px] font-semibold text-green-500">STRONG BULLISH (2/4)</span>
        </div>
        <span className="text-[11px] text-gray-400">Auto-refresh 180s</span>
      </div>

      <div className="flex h-1 overflow-hidden bg-slate-800">
        <div className="bg-green-500" style={{ width: "50%" }} />
        <div className="bg-red-500" style={{ width: "25%" }} />
      </div>

      <div className="grid grid-cols-1 gap-2.5 p-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <Card key={card.tf} card={card} compact={compact} />
        ))}
      </div>

      <div className="border-t border-slate-800/60 p-3 text-center text-[11px] text-gray-400">
        Auto-refreshes every 180s &middot; Data: Kraken
      </div>
    </div>
  );
}
