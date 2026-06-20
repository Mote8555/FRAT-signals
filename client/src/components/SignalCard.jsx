import React from "react";
import RegimeBadge from "./RegimeBadge";
import ConfidenceMeter from "./ConfidenceMeter";
import ComponentBreakdown from "./ComponentBreakdown";

export default function SignalCard({ data, loading, error }) {
  if (loading) {
    return (
      <div style={cardStyle}>
        <div style={{ textAlign: "center", color: "#9ca3af", padding: 40 }}>
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={cardStyle}>
        <div style={{ textAlign: "center", color: "#ef4444", padding: 40 }}>
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={cardStyle}>
        <div style={{ textAlign: "center", color: "#6b7280", padding: 40 }}>
          Select a pair to view signal
        </div>
      </div>
    );
  }

  const { signal, regime, lastPrice, pair, timeframe } = data;

  return (
    <div style={cardStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#f9fafb" }}>{pair}</div>
          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 2 }}>
            {timeframe} · Last: ${lastPrice?.toFixed(2)}
          </div>
        </div>
        <RegimeBadge regime={regime} />
      </div>

      {signal ? (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                padding: "8px 24px",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 18,
                background:
                  signal.type === "BUY" ? "#22c55e22" : "#ef444422",
                color: signal.type === "BUY" ? "#22c55e" : "#ef4444",
                border: `1px solid ${
                  signal.type === "BUY" ? "#22c55e44" : "#ef444444"
                }`,
              }}
            >
              {signal.type}
            </div>
            <div style={{ color: "#d1d5db", fontSize: 14 }}>
              Entry: <strong>${signal.entryPrice?.toFixed(2)}</strong>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div style={statBox}>
              <div style={statLabel}>Stop Loss</div>
              <div style={statValue}>
                ${signal.stopLoss?.toFixed(2)}
                <span style={{ color: "#ef4444", marginLeft: 6, fontSize: 12 }}>
                  {((signal.stopLoss - signal.entryPrice) / signal.entryPrice * 100).toFixed(2)}%
                </span>
              </div>
            </div>
            <div style={statBox}>
              <div style={statLabel}>Take Profit</div>
              <div style={statValue}>
                ${signal.takeProfit?.toFixed(2)}
                <span style={{ color: "#22c55e", marginLeft: 6, fontSize: 12 }}>
                  +{((signal.takeProfit - signal.entryPrice) / signal.entryPrice * 100).toFixed(2)}%
                </span>
              </div>
            </div>
            <div style={statBox}>
              <div style={statLabel}>Regime Strength</div>
              <div style={statValue}>{signal.regimeStrength || "N/A"}</div>
            </div>
            <div style={statBox}>
              <div style={statLabel}>Hurst / DFA</div>
              <div style={{ ...statValue, fontSize: 14 }}>
                {signal.hurst} / {signal.dfa}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <ConfidenceMeter confidence={signal.confidence} />
          </div>

          <ComponentBreakdown components={signal.confidence?.components} />
        </>
      ) : (
        <div
          style={{
            textAlign: "center",
            color: "#eab308",
            padding: "20px 0",
            fontSize: 15,
          }}
        >
          No signal — conditions not met for this pair
        </div>
      )}
    </div>
  );
}

const cardStyle = {
  background: "#111827",
  borderRadius: 12,
  padding: 24,
  border: "1px solid #1f2937",
};

const statBox = {
  background: "#1f2937",
  borderRadius: 8,
  padding: "10px 14px",
};

const statLabel = {
  fontSize: 11,
  color: "#6b7280",
  textTransform: "uppercase",
  fontWeight: 600,
  marginBottom: 4,
};

const statValue = {
  fontSize: 15,
  fontWeight: 600,
  color: "#f9fafb",
};
