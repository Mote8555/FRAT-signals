interface RegimeBadgeProps {
  regime: {
    regime: string;
    hurst: number;
    confidence: number;
  };
}

const colorMap: Record<string, { text: string; bg: string; border: string }> = {
  TRENDING: { text: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/30" },
  RANDOM: { text: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  MEAN_REVERTING: { text: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30" },
  UNKNOWN: { text: "text-gray-500", bg: "bg-gray-500/10", border: "border-gray-500/30" },
};

export default function RegimeBadge({ regime }: RegimeBadgeProps) {
  if (!regime) return null;
  const colors = colorMap[regime.regime] || colorMap.UNKNOWN;

  return (
    <div className="text-center">
      <span
        className={`inline-block px-4 py-1.5 rounded-full font-bold text-sm border ${colors.text} ${colors.bg} ${colors.border}`}
      >
        {regime.regime}
      </span>
      <div className="text-xs text-gray-400 mt-1">
        H={regime.hurst} &middot; confidence={regime.confidence}%
      </div>
    </div>
  );
}
