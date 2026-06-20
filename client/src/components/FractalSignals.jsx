import React from "react";
import TimeframeCard from "./TimeframeCard";

const TF_ORDER = ["15m", "1h", "4h", "1d"];

function getConfluenceLabel(bullish, bearish, neutral) {
  const total = bullish + bearish + neutral;
  if (total === 0) return { label: "No data", color: "#6b7280", pct: 0 };
  if (bullish > bearish && bullish > 0) {
    const pct = Math.round((bullish / (bullish + bearish + neutral)) * 100);
    if (pct >= 75) return { label: `STRONG BULLISH (${bullish}/${total})`, color: "#22c55e", pct };
    if (pct >= 50) return { label: `BULLISH (${bullish}/${total})`, color: "#16a34a", pct };
    return { label: `WEAK BULLISH (${bullish}/${total})`, color: "#eab308", pct };
  }
  if (bearish > bullish && bearish > 0) {
    const pct = Math.round((bearish / (bullish + bearish + neutral)) * 100);
    if (pct >= 75) return { label: `STRONG BEARISH (${bearish}/${total})`, color: "#ef4444", pct };
    if (pct >= 50) return { label: `BEARISH (${bearish}/${total})`, color: "#dc2626", pct };
    return { label: `WEAK BEARISH (${bearish}/${total})`, color: "#f97316", pct };
  }
  return { label: `NEUTRAL (0/${total})`, color: "#6b7280", pct: 0 };
}

export default function FractalSignals({ data, loading, error }) {
  if (loading) {
    return (
      <div style={{ textAlign: "center", color: "#9ca3af", padding: 40, background: "#111827", borderRadius: 12, border: "1px solid #1f2937" }}>
        Loading fractal signals...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", color: "#ef4444", padding: 40, background: "#111827", borderRadius: 12, border: "1px solid #1f2937" }}>
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: "center", color: "#6b7280", padding: 40, background: "#111827", borderRadius: 12, border: "1px solid #1f2937" }}>
        Select a pair to view fractal signals
      </div>
    );
  }

  const { timeframes, confluence, btcFilter, pair } = data;
  const { bullishCount, bearishCount, neutralCount } = confluence;
  const con = getConfluenceLabel(bullishCount, bearishCount, neutralCount);

  return (
    <div
      style={{
        background: "#111827",
        borderRadius: 12,
        border: "1px solid #1f2937",
        padding: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#f9fafb" }}>{pair}</span>
          {btcFilter && (
            <span
              style={{
                marginLeft: 10,
                fontSize: 11,
                color: btcFilter.btcTrend === "BULLISH" ? "#22c55e" : btcFilter.btcTrend === "BEARISH" ? "#ef4444" : "#6b7280",
                background: "#1f2937",
                padding: "2px 10px",
                borderRadius: 10,
              }}
            >
              BTC {btcFilter.btcTrend}
            </span>
          )}
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: con.color }}>
          {con.label}
        </span>
      </div>

      <div
        style={{
          width: "100%",
          height: 4,
          background: "#1f2937",
          borderRadius: 2,
          marginBottom: 20,
          overflow: "hidden",
        }}
      >
        {bullishCount > 0 && (
          <div
            style={{
              float: "left",
              width: `${(bullishCount / 4) * 100}%`,
              height: "100%",
              background: "#22c55e",
            }}
          />
        )}
        {bearishCount > 0 && (
          <div
            style={{
              float: "left",
              width: `${(bearishCount / 4) * 100}%`,
              height: "100%",
              background: "#ef4444",
            }}
          />
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        {TF_ORDER.map((tf) => (
          <TimeframeCard key={tf} tf={tf} data={timeframes?.[tf] || null} />
        ))}
      </div>

      <div
        style={{
          fontSize: 11,
          color: "#4b5563",
          textAlign: "center",
          marginTop: 16,
        }}
      >
        Auto-refreshes every 60s · Data: {data?.dataSource || "Binance"}
      </div>
    </div>
  );
}
