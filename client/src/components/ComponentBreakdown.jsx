import React from "react";

const componentColors = {
  regime: "#22c55e",
  trend: "#3b82f6",
  momentum: "#a855f7",
  btcFilter: "#f97316",
  openInterest: "#ec4899",
  funding: "#14b8a6",
};

export default function ComponentBreakdown({ components }) {
  if (!components || components.length === 0) return null;

  const totalWeight = components.reduce((s, c) => s + c.weight, 0);

  return (
    <div style={{ width: "100%" }}>
      <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: 8 }}>Score Breakdown</div>
      <div
        style={{
          display: "flex",
          height: "24px",
          borderRadius: "6px",
          overflow: "hidden",
          background: "#1f2937",
        }}
      >
        {components.map((c) => (
          <div
            key={c.name}
            style={{
              flex: c.weight,
              background: componentColors[c.name] || "#6b7280",
              opacity: 0.8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              fontWeight: 600,
              color: "#fff",
              minWidth: 0,
            }}
            title={`${c.name}: ${c.score} (weight ${c.weight})`}
          >
            {c.weight >= 15 ? c.name.slice(0, 3) : ""}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginTop: 8,
          fontSize: "11px",
          color: "#d1d5db",
        }}
      >
        {components.map((c) => (
          <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: componentColors[c.name],
                display: "inline-block",
              }}
            />
            {c.name}: {c.score} (w:{c.weight})
          </div>
        ))}
      </div>
    </div>
  );
}
