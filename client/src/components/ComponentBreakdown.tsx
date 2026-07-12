import type { ComponentScore } from "../api";

interface ComponentBreakdownProps {
  components?: ComponentScore[];
}

const componentColors: Record<string, string> = {
  regime: "#22c55e",
  trend: "#3b82f6",
  momentum: "#a855f7",
  btcFilter: "#f97316",
  openInterest: "#ec4899",
  funding: "#14b8a6",
};

export default function ComponentBreakdown({ components }: ComponentBreakdownProps) {
  if (!components || components.length === 0) return null;

  return (
    <div className="w-full">
      <div className="text-[13px] text-gray-400 mb-2">Score Breakdown</div>
      <div className="flex h-6 rounded-md overflow-hidden bg-gray-800">
        {components.map((c) => (
          <div
            key={c.name}
            className="flex items-center justify-center text-[10px] font-semibold text-white opacity-80 min-w-0"
            style={{ flex: c.weight, background: componentColors[c.name] || "#6b7280" }}
            title={`${c.name}: ${c.score} (weight ${c.weight})`}
          >
            {c.weight >= 15 ? c.name.slice(0, 3) : ""}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mt-2 text-[11px] text-gray-300">
        {components.map((c) => (
          <div key={c.name} className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ background: componentColors[c.name] }}
            />
            {c.name}: {c.score} (w:{c.weight})
          </div>
        ))}
      </div>
    </div>
  );
}
