import type { Signal } from "../api";
import useMediaQuery from "../useMediaQuery";

interface TradeInsightCardProps {
  tf: string;
  pair: string;
  signal: Signal;
  showPair?: boolean;
}

export default function TradeInsightCard({ tf, pair, signal, showPair = false }: TradeInsightCardProps) {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isBuy = signal.type === "BUY";
  const signalColor = isBuy ? "green" : "red";
  const signalBorder = isBuy ? "border-green-500/30" : "border-red-500/30";
  const signalBg = isBuy ? "bg-green-500/10" : "bg-red-500/10";
  const signalText = isBuy ? "text-green-500" : "text-red-500";

  const entryPx = signal.entryPrice;
  const slPx = signal.stopLoss;
  const tpPx = signal.takeProfit;
  const slPct = entryPx && slPx ? (((slPx - entryPx) / entryPx) * 100).toFixed(2) : null;
  const tpPct = entryPx && tpPx ? (((tpPx - entryPx) / entryPx) * 100).toFixed(2) : null;

  return (
    <div
      className={`rounded-[10px] border-[1.5px] ${signalBorder} ${isMobile ? "p-3" : "p-4"}`}
      style={{
        backgroundColor: "#0f1219",
        boxShadow: `0 0 12px ${signalColor === "green" ? "#22c55e22" : "#ef444422"}`,
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          {showPair ? (
            <>
              <span className="font-bold text-sm text-gray-50">{pair}</span>
              <span className="text-[11px] text-gray-400 bg-slate-800 px-1.5 py-0.5 rounded">{tf}</span>
            </>
          ) : (
            <>
              <span className="font-bold text-sm text-gray-50">{tf}</span>
              <span className="text-[12px] text-gray-400">{pair}</span>
            </>
          )}
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-md font-bold text-sm border ${signalBg} ${signalText} ${signalBorder}`}
        >
          {signal.type}
        </span>
      </div>

      <div className="flex gap-2">
        {entryPx != null && (
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-gray-400 uppercase font-semibold mb-px">Entry</div>
            <div className="text-[13px] font-semibold text-gray-50">${entryPx.toFixed(2)}</div>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-gray-400 uppercase font-semibold mb-px">SL</div>
          <div className="text-[13px] font-semibold text-red-500">
            {slPx ? `$${slPx.toFixed(2)}` : "-"}
            {slPct && <span className="text-[10px] ml-0.5">({slPct}%)</span>}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-gray-400 uppercase font-semibold mb-px">TP</div>
          <div className="text-[13px] font-semibold text-green-500">
            {tpPx ? `$${tpPx.toFixed(2)}` : "-"}
            {tpPct && <span className="text-[10px] ml-0.5">(+{tpPct}%)</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
