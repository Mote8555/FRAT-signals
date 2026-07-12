import type { Confidence } from "../api";

interface ConfidenceMeterProps {
  confidence: Confidence;
  size?: number;
}

const gradeColors: Record<string, string> = {
  "A+": "#22c55e",
  A: "#16a34a",
  B: "#eab308",
  C: "#f97316",
  IGNORE: "#ef4444",
};

export default function ConfidenceMeter({ confidence, size = 100 }: ConfidenceMeterProps) {
  if (!confidence) return null;
  const { score, grade } = confidence;
  const color = gradeColors[grade] || "#6b7280";

  const r = size * 0.4;
  const strokeW = size * 0.08;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const scoreFont = size * 0.22;
  const gradeFont = size * 0.14;
  const labelFont = size * 0.12;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#334155"
          strokeWidth={strokeW}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeW}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
        <text
          x={size / 2}
          y={size * 0.48}
          textAnchor="middle"
          fill="#f9fafb"
          fontSize={scoreFont}
          fontWeight="bold"
        >
          {score}
        </text>
        <text
          x={size / 2}
          y={size * 0.64}
          textAnchor="middle"
          fill={color}
          fontSize={gradeFont}
          fontWeight="bold"
        >
          {grade}
        </text>
      </svg>
      <div className="text-gray-400 mt-1" style={{ fontSize: labelFont }}>
        Confidence
      </div>
    </div>
  );
}
