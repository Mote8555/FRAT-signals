import React from "react";

export default function PairSelector({ pairs, selected, onSelect }) {
  return (
    <select
      value={selected}
      onChange={(e) => onSelect(e.target.value)}
      style={{
        padding: "10px 16px",
        fontSize: "16px",
        borderRadius: "8px",
        border: "1px solid #374151",
        background: "#1f2937",
        color: "#f9fafb",
        cursor: "pointer",
        fontWeight: 600,
        minWidth: 180,
      }}
    >
      {pairs.map((pair) => (
        <option key={pair} value={pair}>
          {pair}
        </option>
      ))}
    </select>
  );
}
