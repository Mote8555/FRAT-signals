import React from "react";

const colors = {
  TRENDING: "#22c55e",
  RANDOM: "#eab308",
  MEAN_REVERTING: "#ef4444",
  UNKNOWN: "#6b7280",
};

export default function RegimeBadge({ regime }) {
  if (!regime) return null;
  const color = colors[regime.regime] || colors.UNKNOWN;

  return (
    <div style={{ textAlign: "center" }}>
      <span
        style={{
          display: "inline-block",
          padding: "6px 18px",
          borderRadius: "20px",
          background: color + "22",
          color,
          fontWeight: 700,
          fontSize: "14px",
          border: `1px solid ${color}44`,
        }}
      >
        {regime.regime}
      </span>
      <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: 4 }}>
        H={regime.hurst} · confidence={regime.confidence}%
      </div>
    </div>
  );
}
