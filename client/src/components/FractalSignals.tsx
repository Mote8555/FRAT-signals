import type { FractalData } from "../api";
import TimeframeCard from "./TimeframeCard";
import Skeleton from "./Skeleton";
import useMediaQuery from "../useMediaQuery";

interface FractalSignalsProps {
  data: FractalData | null;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
}

const TF_ORDER = ["15m", "1h", "4h", "1d"];

export function getConfluenceLabel(bullish: number, bearish: number, neutral: number) {
  const total = bullish + bearish + neutral;
  if (total === 0) return { label: "No data", color: "text-gray-400", pct: 0 };
  if (bullish > bearish && bullish > 0) {
    const pct = Math.round((bullish / (bullish + bearish + neutral)) * 100);
    if (pct >= 75)
      return { label: `STRONG BULLISH (${bullish}/${total})`, color: "text-green-500", pct };
    if (pct >= 50) return { label: `BULLISH (${bullish}/${total})`, color: "text-green-500", pct };
    return { label: `WEAK BULLISH (${bullish}/${total})`, color: "text-yellow-500", pct };
  }
  if (bearish > bullish && bearish > 0) {
    const pct = Math.round((bearish / (bullish + bearish + neutral)) * 100);
    if (pct >= 75)
      return { label: `STRONG BEARISH (${bearish}/${total})`, color: "text-red-500", pct };
    if (pct >= 50) return { label: `BEARISH (${bearish}/${total})`, color: "text-red-400", pct };
    return { label: `WEAK BEARISH (${bearish}/${total})`, color: "text-orange-500", pct };
  }
  const tied = Math.max(bullish, bearish);
  return { label: `NEUTRAL (${tied}/${total})`, color: "text-gray-400", pct: 0 };
}

export default function FractalSignals({ data, loading, error, onRetry }: FractalSignalsProps) {
  const isMobile = useMediaQuery("(max-width: 640px)");

  if (loading) {
    return <Skeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 text-center text-red-500 p-10 bg-gray-900 rounded-xl border border-slate-800/60">
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{error}</span>
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 font-semibold text-sm border border-red-500/30 cursor-pointer hover:bg-red-500/30 active:bg-red-500/40 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-gray-400 p-10 bg-gray-900 rounded-xl border border-slate-800/60">
        Select a pair to view fractal signals
      </div>
    );
  }

  const { timeframes, confluence, btcFilter, pair, dataSource } = data;
  const { bullishCount, bearishCount, neutralCount } = confluence;
  const con = getConfluenceLabel(bullishCount, bearishCount, neutralCount);

  return (
    <div className={`bg-gray-900 rounded-xl border border-slate-800/60 ${isMobile ? "p-3.5" : "p-5"}`}>
      <div
        className={`flex ${isMobile ? "flex-col gap-2" : "flex-row justify-between items-center"} mb-4`}
      >
        <div>
          <span className={`${isMobile ? "text-base" : "text-lg"} font-bold text-gray-50`}>
            {pair}
          </span>
          {btcFilter && (
            <span
              className={`ml-2.5 text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 ${
                btcFilter.btcTrend === "BULLISH"
                  ? "text-green-500"
                  : btcFilter.btcTrend === "BEARISH"
                    ? "text-red-500"
                    : "text-gray-400"
              }`}
            >
              BTC {btcFilter.btcTrend}
            </span>
          )}
        </div>
        <span className={`${isMobile ? "text-xs" : "text-[13px]"} font-semibold ${con.color}`}>
          {con.label}
        </span>
      </div>

      <div className="w-full h-1 bg-slate-800 rounded-sm mb-5 overflow-hidden flex">
        {bullishCount > 0 && (
          <div className="bg-green-500" style={{ width: `${(bullishCount / 4) * 100}%` }} />
        )}
        {bearishCount > 0 && (
          <div className="bg-red-500" style={{ width: `${(bearishCount / 4) * 100}%` }} />
        )}
      </div>

      <div className={`grid ${isMobile ? "grid-cols-1 gap-2.5" : "grid-cols-2 gap-3"}`}>
        {TF_ORDER.map((tf) => (
          <TimeframeCard key={tf} tf={tf} pair={pair} data={timeframes?.[tf] || null} />
        ))}
      </div>

      <div className="text-[11px] text-gray-400 text-center mt-4">
        Auto-refreshes every 180s &middot; Data: {dataSource || "Kraken"}
      </div>
    </div>
  );
}
