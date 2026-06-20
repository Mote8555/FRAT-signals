import React, { useState, useEffect, useCallback } from "react";
import PairSelector from "./components/PairSelector";
import FractalSignals from "./components/FractalSignals";
import { fetchPairs, fetchFractal } from "./api";

const MARKETS = [
  { key: "crypto", label: "Crypto" },
  { key: "forex", label: "Forex" },
];

export default function App() {
  const [market, setMarket] = useState("crypto");
  const [pairs, setPairs] = useState([]);
  const [selected, setSelected] = useState("BTC/USDT");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPairs(market)
      .then((list) => {
        setPairs(list);
        if (!list.includes(selected)) setSelected(list[0]);
      })
      .catch(() => {
        const fallback = market === "forex"
          ? ["EUR/USD", "GBP/USD", "USD/JPY"]
          : ["BTC/USDT", "ETH/USDT", "SOL/USDT"];
        setPairs(fallback);
        if (!fallback.includes(selected)) setSelected(fallback[0]);
      });
  }, [market]);

  const loadFractal = useCallback(async (pair) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFractal(pair);
      setData(result);
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFractal(selected);
    const interval = setInterval(() => loadFractal(selected), 60000);
    return () => clearInterval(interval);
  }, [selected, loadFractal]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#f9fafb",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          padding: "40px 20px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>
            FRAT Signals
          </h1>
          <div
            style={{
              fontSize: 13,
              color: "#6b7280",
              marginTop: 4,
            }}
          >
            Fractal Regime-Adaptive Trading
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 16,
            background: "#1f2937",
            borderRadius: 8,
            padding: 3,
          }}
        >
          {MARKETS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMarket(m.key)}
              style={{
                flex: 1,
                padding: "8px 0",
                border: "none",
                borderRadius: 6,
                background: market === m.key ? "#3b82f6" : "transparent",
                color: market === m.key ? "#fff" : "#9ca3af",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 20,
            alignItems: "center",
          }}
        >
          <PairSelector
            pairs={pairs}
            selected={selected}
            onSelect={setSelected}
          />
          <button
            onClick={() => loadFractal(selected)}
            disabled={loading}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: "#3b82f6",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "..." : "Refresh"}
          </button>
        </div>

        <FractalSignals data={data} loading={loading} error={error} />
      </div>
    </div>
  );
}
