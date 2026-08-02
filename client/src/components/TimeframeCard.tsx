import { lazy, Suspense, useEffect, useState } from "react";
import type { ChartData, TimeframeData } from "../api";
import { fetchChart } from "../api";
import ConfidenceMeter from "./ConfidenceMeter";
import ComponentBreakdown from "./ComponentBreakdown";
import useMediaQuery from "../useMediaQuery";

const CandleChart = lazy(() => import("./CandleChart"));

interface TimeframeCardProps {
  tf: string;
  pair: string;
  data: TimeframeData | null;
}

const regimeColorMap: Record<string, { text: string; bg: string }> = {
  TRENDING: { text: "text-green-500", bg: "bg-green-500/10" },
  RANDOM: { text: "text-yellow-500", bg: "bg-yellow-500/10" },
  MEAN_REVERTING: { text: "text-red-500", bg: "bg-red-500/10" },
  UNKNOWN: { text: "text-gray-500", bg: "bg-gray-500/10" },
};

export default function TimeframeCard({ tf, pair, data }: TimeframeCardProps) {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const noData = !data;
  const signal = data?.signal;
  const regime = data?.regime;

  const [showChart, setShowChart] = useState(false);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);

  useEffect(() => {
    if (!showChart || chartData || chartLoading) return;
    let cancelled = false;
    setChartLoading(true);
    setChartError(null);
    fetchChart(pair, tf)
      .then((result) => {
        if (!cancelled) setChartData(result);
      })
      .catch((err) => {
        if (!cancelled) setChartError(err instanceof Error ? err.message : "Failed to load chart");
      })
      .finally(() => {
        if (!cancelled) setChartLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showChart, chartData, chartLoading, pair, tf]);

  const regimeColors = regimeColorMap[regime?.regime ?? ""] || regimeColorMap.UNKNOWN;
  const hasSignal = !!signal;
  const isBuy = signal?.type === "BUY";
  const signalColor = isBuy ? "green" : "red";
  const signalBorder = isBuy ? "border-green-500/30" : "border-red-500/30";
  const signalBg = isBuy ? "bg-green-500/10" : "bg-red-500/10";
  const signalText = isBuy ? "text-green-500" : "text-red-500";

  const entryPx = signal?.entryPrice;
  const slPx = signal?.stopLoss;
  const tpPx = signal?.takeProfit;
  const slPct = entryPx && slPx ? (((slPx - entryPx) / entryPx) * 100).toFixed(2) : null;
  const tpPct = entryPx && tpPx ? (((tpPx - entryPx) / entryPx) * 100).toFixed(2) : null;

  return (
    <div
      className={`rounded-[10px] flex flex-col gap-2 ${isMobile ? "p-3" : "p-4"} ${
        hasSignal ? `border-[1.5px] ${signalBorder}` : "border border-slate-800/60"
      }`}
      style={{
        backgroundColor: "#0f1219",
        ...(hasSignal
          ? { boxShadow: `0 0 12px ${signalColor === "green" ? "#22c55e22" : "#ef444422"}` }
          : {
              backgroundImage: "url(/FRAT.webp)",
              backgroundSize: "50%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              opacity: 0.9,
            }),
      }}
    >
      <div className="flex justify-between items-center">
        <span className="font-bold text-sm text-gray-50">{tf}</span>
        {regime && (
          <span
            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${regimeColors.text} ${regimeColors.bg}`}
          >
            {regime.regime}
          </span>
        )}
      </div>

      <div className="flex items-center justify-center py-2">
        {noData ? (
          <span className="text-gray-500 text-[13px]">No data</span>
        ) : hasSignal ? (
          <div
            className={`px-7 py-1.5 rounded-md font-bold text-xl border ${signalBg} ${signalText} ${signalBorder}`}
          >
            {signal!.type}
          </div>
        ) : (
          <span className="text-gray-300 text-[13px] font-medium" style={{ textShadow: "0 0 8px #0f1219, 0 0 16px #0f1219" }}>No signal</span>
        )}
      </div>

      {hasSignal && (
        <>
          <div className="flex gap-2">
            {entryPx != null && (
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-gray-500 uppercase font-semibold mb-px">Entry</div>
                <div className="text-[13px] font-semibold text-gray-50">${entryPx.toFixed(2)}</div>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-gray-500 uppercase font-semibold mb-px">SL</div>
              <div className="text-[13px] font-semibold text-red-500">
                {slPx ? `$${slPx.toFixed(0)}` : "-"}
                {slPct && <span className="text-[10px] ml-0.5">({slPct}%)</span>}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-gray-500 uppercase font-semibold mb-px">TP</div>
              <div className="text-[13px] font-semibold text-green-500">
                {tpPx ? `$${tpPx.toFixed(0)}` : "-"}
                {tpPct && <span className="text-[10px] ml-0.5">(+{tpPct}%)</span>}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {data?.lastPrice != null && (
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-gray-500 uppercase font-semibold mb-px">Price</div>
                <div className="text-[13px] font-semibold text-gray-50">
                  ${data.lastPrice.toFixed(0)}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center my-1">
            <ConfidenceMeter confidence={signal!.confidence} size={isMobile ? 60 : 70} />
          </div>

          <ComponentBreakdown components={signal!.confidence.components} />
        </>
      )}

      {regime && (
        <div className="text-[11px] text-gray-600 text-center border-t border-slate-800/60 pt-2">
          H={regime.hurst} &middot; DFA={regime.dfa ?? "N/A"} &middot; conf={regime.confidence}%
        </div>
      )}

      <button
        onClick={() => setShowChart((prev) => !prev)}
        className="mt-1 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 text-gray-300 text-xs font-semibold cursor-pointer hover:bg-slate-800 hover:text-gray-100 active:bg-slate-700 transition-colors"
      >
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          {showChart ? (
            <polyline points="6 9 12 15 18 9" />
          ) : (
            <polyline points="6 15 12 9 18 15" />
          )}
        </svg>
        {showChart ? "Hide Chart" : "Show Chart"}
      </button>

      {showChart && (
        <div className="border-t border-slate-800/60 pt-2">
          {chartLoading && (
            <div className="h-[214px] animate-pulse rounded-lg bg-slate-800/40 flex items-center justify-center text-xs text-gray-500">
              Loading chart...
            </div>
          )}
          {chartError && !chartLoading && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-center">
              <div className="text-xs text-red-400 mb-2">{chartError}</div>
              <button
                onClick={() => {
                  setChartData(null);
                  setChartError(null);
                  setChartLoading(false);
                }}
                className="px-3 py-1.5 rounded-md bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/30 cursor-pointer hover:bg-red-500/30 transition-colors"
              >
                Retry
              </button>
            </div>
          )}
          {chartData && !chartLoading && (
            <Suspense
              fallback={
                <div className="h-[214px] animate-pulse rounded-lg bg-slate-800/40 flex items-center justify-center text-xs text-gray-500">
                  Loading chart...
                </div>
              }
            >
              <CandleChart data={chartData} height={isMobile ? 120 : 150} />
            </Suspense>
          )}
        </div>
      )}
    </div>
  );
}
