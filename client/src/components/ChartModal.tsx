import { lazy, Suspense, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import type { ChartData } from "../api";

const CandleChart = lazy(() => import("./CandleChart"));

interface ChartModalProps {
  pair: string;
  tf: string;
  chartData: ChartData;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onClose: () => void;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
}

export default function ChartModal({
  pair,
  tf,
  chartData,
  loading,
  error,
  onRetry,
  onClose,
  entryPrice,
  stopLoss,
  takeProfit,
}: ChartModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prev;
    };
  }, [handleKeyDown]);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-5xl max-h-[90vh] rounded-xl border border-slate-800 overflow-hidden"
        style={{ backgroundColor: "#0f1219" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/60">
          <span className="text-sm font-bold text-gray-100">
            {pair} <span className="text-gray-400 font-normal">&middot;</span>{" "}
            <span className="text-gray-400">{tf}</span>
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-4">
          {loading && (
            <div className="h-[500px] animate-pulse rounded-lg bg-slate-800/40 flex items-center justify-center text-sm text-gray-400">
              Loading chart...
            </div>
          )}
          {error && !loading && (
            <div className="h-[500px] rounded-lg bg-red-500/10 border border-red-500/30 flex flex-col items-center justify-center gap-3">
              <div className="text-sm text-red-400">{error}</div>
              <button
                onClick={onRetry}
                className="px-4 py-2 rounded-md bg-red-500/20 text-red-400 text-sm font-semibold border border-red-500/30 cursor-pointer hover:bg-red-500/30 transition-colors"
              >
                Retry
              </button>
            </div>
          )}
          {chartData && !loading && (
            <Suspense
              fallback={
                <div className="h-[500px] animate-pulse rounded-lg bg-slate-800/40 flex items-center justify-center text-sm text-gray-400">
                  Loading chart...
                </div>
              }
            >
              <CandleChart
                data={chartData}
                height={450}
                entryPrice={entryPrice}
                stopLoss={stopLoss}
                takeProfit={takeProfit}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
