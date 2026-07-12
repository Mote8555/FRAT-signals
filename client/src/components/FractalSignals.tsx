import type { FractalData } from "../api";
import TimeframeCard from "./TimeframeCard";
import Skeleton from "./Skeleton";
import useMediaQuery from "../useMediaQuery";

interface FractalSignalsProps {
  data: FractalData | null;
  loading: boolean;
  error: string | null;
}

const TF_ORDER = ["15m", "1h", "4h", "1d"];

function getConfluenceLabel(bullish: number, bearish: number, neutral: number) {
  const total = bullish + bearish + neutral;
  if (total === 0) return { label: "No data", color: "text-gray-500", pct: 0 };
  if (bullish > bearish && bullish > 0) {
    const pct = Math.round((bullish / (bullish + bearish + neutral)) * 100);
    if (pct >= 75)
      return { label: `STRONG BULLISH (${bullish}/${total})`, color: "text-green-500", pct };
    if (pct >= 50) return { label: `BULLISH (${bullish}/${total})`, color: "text-green-600", pct };
    return { label: `WEAK BULLISH (${bullish}/${total})`, color: "text-yellow-500", pct };
  }
  if (bearish > bullish && bearish > 0) {
    const pct = Math.round((bearish / (bullish + bearish + neutral)) * 100);
    if (pct >= 75)
      return { label: `STRONG BEARISH (${bearish}/${total})`, color: "text-red-500", pct };
    if (pct >= 50) return { label: `BEARISH (${bearish}/${total})`, color: "text-red-600", pct };
    return { label: `WEAK BEARISH (${bearish}/${total})`, color: "text-orange-500", pct };
  }
  return { label: `NEUTRAL (0/${total})`, color: "text-gray-500", pct: 0 };
}

export default function FractalSignals({ data, loading, error }: FractalSignalsProps) {
  const isMobile = useMediaQuery("(max-width: 640px)");

  if (loading) {
    return <Skeleton />;
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-10 bg-gray-900 rounded-xl border border-gray-800">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-gray-500 p-10 bg-gray-900 rounded-xl border border-gray-800">
        Select a pair to view fractal signals
      </div>
    );
  }

  const { timeframes, confluence, btcFilter, pair } = data;
  const { bullishCount, bearishCount, neutralCount } = confluence;
  const con = getConfluenceLabel(bullishCount, bearishCount, neutralCount);

  return (
    <div className={`bg-gray-900 rounded-xl border border-gray-800 ${isMobile ? "p-3.5" : "p-5"}`}>
      <div
        className={`flex ${isMobile ? "flex-col gap-2" : "flex-row justify-between items-center"} mb-4`}
      >
        <div>
          <span className={`${isMobile ? "text-base" : "text-lg"} font-bold text-gray-50`}>
            {pair}
          </span>
          {btcFilter && (
            <span
              className={`ml-2.5 text-[11px] px-2.5 py-0.5 rounded-full bg-gray-800 ${
                btcFilter.btcTrend === "BULLISH"
                  ? "text-green-500"
                  : btcFilter.btcTrend === "BEARISH"
                    ? "text-red-500"
                    : "text-gray-500"
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

      <div className="w-full h-1 bg-gray-800 rounded-sm mb-5 overflow-hidden flex">
        {bullishCount > 0 && (
          <div className="bg-green-500" style={{ width: `${(bullishCount / 4) * 100}%` }} />
        )}
        {bearishCount > 0 && (
          <div className="bg-red-500" style={{ width: `${(bearishCount / 4) * 100}%` }} />
        )}
      </div>

      <div className={`grid ${isMobile ? "grid-cols-1 gap-2.5" : "grid-cols-2 gap-3"}`}>
        {TF_ORDER.map((tf) => (
          <TimeframeCard key={tf} tf={tf} data={timeframes?.[tf] || null} />
        ))}
      </div>

      <div className="text-[11px] text-gray-600 text-center mt-4">
        Auto-refreshes every 60s &middot; Data: Kraken
      </div>
    </div>
  );
}
