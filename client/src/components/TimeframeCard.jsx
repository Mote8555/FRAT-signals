import React from "react";
import ConfidenceMeter from "./ConfidenceMeter";
import ComponentBreakdown from "./ComponentBreakdown";

const regimeColors = {
  TRENDING: "#22c55e",
  RANDOM: "#eab308",
  MEAN_REVERTING: "#ef4444",
  UNKNOWN: "#6b7280",
};

export default function TimeframeCard({ tf, data }) {
  const noData = !data;
  const signal = data?.signal;
  const regime = data?.regime;

  const regimeColor = regimeColors[regime?.regime] || "#6b7280";
  const hasSignal = !!signal;
  const isBuy = signal?.type === "BUY";
  const signalColor = isBuy ? "#22c55e" : "#ef4444";

  const entryPx = signal?.entryPrice;
  const slPx = signal?.stopLoss;
  const tpPx = signal?.takeProfit;
  const slPct = entryPx && slPx ? ((slPx - entryPx) / entryPx * 100).toFixed(2) : null;
  const tpPct = entryPx && tpPx ? ((tpPx - entryPx) / entryPx * 100).toFixed(2) : null;
  const score = signal?.confidence?.score;
  const grade = signal?.confidence?.grade;

  return (
    <div
      style={{
        background: "#111827",
        borderRadius: 10,
        border: hasSignal
          ? `1.5px solid ${signalColor}44`
          : "1px solid #1f2937",
        boxShadow: hasSignal ? `0 0 12px ${signalColor}22` : "none",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: "#f9fafb" }}>
          {tf}
        </span>
        {regime && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: regimeColor,
              background: regimeColor + "18",
              padding: "2px 10px",
              borderRadius: 10,
            }}
          >
            {regime.regime}
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "8px 0",
        }}
      >
        {noData ? (
          <span style={{ color: "#6b7280", fontSize: 13 }}>No data</span>
        ) : hasSignal ? (
          <div
            style={{
              padding: "6px 28px",
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 20,
              background: signalColor + "20",
              color: signalColor,
              border: `1px solid ${signalColor}44`,
            }}
          >
            {signal.type}
          </div>
        ) : (
          <span style={{ color: "#4b5563", fontSize: 13 }}>No signal</span>
        )}
      </div>

      {hasSignal && (
        <>
          <div style={statRow}>
            {entryPx && (
              <div style={statCell}>
                <div style={statLabel}>Entry</div>
                <div style={statVal}>${entryPx.toFixed(2)}</div>
              </div>
            )}
            <div style={statCell}>
              <div style={statLabel}>SL</div>
              <div style={{ ...statVal, color: "#ef4444" }}>
                {slPx ? `$${slPx.toFixed(0)}` : "-"}
                {slPct && <span style={{ fontSize: 10, marginLeft: 3 }}>({slPct}%)</span>}
              </div>
            </div>
            <div style={statCell}>
              <div style={statLabel}>TP</div>
              <div style={{ ...statVal, color: "#22c55e" }}>
                {tpPx ? `$${tpPx.toFixed(0)}` : "-"}
                {tpPct && <span style={{ fontSize: 10, marginLeft: 3 }}>(+{tpPct}%)</span>}
              </div>
            </div>
          </div>

          <div style={statRow}>
            {data?.lastPrice && (
              <div style={statCell}>
                <div style={statLabel}>Price</div>
                <div style={statVal}>${data.lastPrice.toFixed(0)}</div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "center", margin: "4px 0" }}>
            <ConfidenceMeter confidence={signal.confidence} size={70} />
          </div>

          <ComponentBreakdown components={signal.confidence?.components} />
        </>
      )}

      {regime && (
        <div style={{ fontSize: 11, color: "#4b5563", textAlign: "center", borderTop: "1px solid #1f2937", paddingTop: 8 }}>
          H={regime.hurst} · DFA={regime.dfa} · conf={regime.confidence}%
        </div>
      )}
    </div>
  );
}

const statRow = { display: "flex", gap: 8 };
const statCell = { flex: 1, minWidth: 0 };
const statLabel = { fontSize: 10, color: "#6b7280", textTransform: "uppercase", fontWeight: 600, marginBottom: 1 };
const statVal = { fontSize: 13, fontWeight: 600, color: "#f9fafb" };
