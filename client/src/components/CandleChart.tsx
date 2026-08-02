import { useMemo } from "react";
import {
  Bar,
  type BarShapeProps,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartData } from "../api";

interface CandlePoint {
  idx: number;
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  macd: number | null;
  macdSignal: number | null;
}

interface CandleChartProps {
  data: ChartData;
  height?: number;
}

const UP_COLOR = "#22c55e";
const DOWN_COLOR = "#ef4444";
const MACD_COLOR = "#a855f7";
const SIGNAL_COLOR = "#f97316";
const TICK_STYLE = { fill: "#64748b", fontSize: 10 };
const CHART_MARGIN = { top: 4, right: 4, left: 0, bottom: 0 };

function formatPrice(value: number): string {
  if (value >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatTs(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCompact(value: number): string {
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}k`;
  return value.toFixed(0);
}

function ChartTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload as CandlePoint | undefined;
  if (!point) return null;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-[11px] font-mono text-gray-200 shadow-lg">
      <div className="text-gray-400 mb-1">{formatTs(point.ts)}</div>
      <div className="text-gray-400">
        O <span className="text-gray-100">{formatPrice(point.open)}</span>
      </div>
      <div className="text-gray-400">
        H <span className="text-gray-100">{formatPrice(point.high)}</span>
      </div>
      <div className="text-gray-400">
        L <span className="text-gray-100">{formatPrice(point.low)}</span>
      </div>
      <div className="text-gray-400">
        C{" "}
        <span className={point.close >= point.open ? "text-green-500" : "text-red-500"}>
          {formatPrice(point.close)}
        </span>
      </div>
      <div className="text-gray-400">
        Vol <span className="text-gray-100">{formatCompact(point.volume)}</span>
      </div>
      {point.macd != null && (
        <div className="border-t border-slate-700 mt-1 pt-1 text-gray-400">
          MACD <span style={{ color: MACD_COLOR }}>{point.macd.toFixed(2)}</span>
          {" / "}
          <span style={{ color: SIGNAL_COLOR }}>{point.macdSignal?.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}

export default function CandleChart({ data, height = 150 }: CandleChartProps) {
  const points = useMemo<CandlePoint[]>(
    () =>
      data.timestamps.map((ts, idx) => ({
        idx,
        ts,
        open: data.opens[idx],
        high: data.highs[idx],
        low: data.lows[idx],
        close: data.closes[idx],
        volume: data.volumes[idx],
        macd: data.indicators.macd[idx],
        macdSignal: data.indicators.macdSignal[idx],
      })),
    [data],
  );

  const domain = useMemo<[number, number]>(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const p of points) {
      if (p.low < lo) lo = p.low;
      if (p.high > hi) hi = p.high;
    }
    const pad = (hi - lo) * 0.03 || hi * 0.01 || 1;
    return [lo - pad, hi + pad];
  }, [points]);

  const maxVolume = useMemo(() => {
    let max = 0;
    for (const p of points) if (p.volume > max) max = p.volume;
    return max || 1;
  }, [points]);

  const tsByIdx = useMemo(() => new Map(points.map((p) => [p.idx, p.ts])), [points]);
  const formatTick = (idx: number) => formatTs(tsByIdx.get(Number(idx)) ?? 0);

  const candleShape = (props: BarShapeProps) => {
    const { x, y, width, height, payload } = props;
    const p = payload as CandlePoint | undefined;
    if (!p || x == null || y == null || width == null || height == null) return null;

    const [min, max] = domain;
    const ratio = (close: number) => {
      const r = (close - min) / (max - min);
      return Math.abs(r) < 1e-12 ? 1e-12 : r;
    };
    const plotBottom = y + height;
    const plotH = height / ratio(p.close);
    const toY = (v: number) => plotBottom - ((v - min) / (max - min)) * plotH;

    const up = p.close >= p.open;
    const color = up ? UP_COLOR : DOWN_COLOR;
    const center = x + width / 2;
    const candleWidth = Math.max(1, Math.min(width * 0.65, 10));

    const yHigh = toY(p.high);
    const yLow = toY(p.low);
    const yOpen = toY(p.open);
    const yClose = toY(p.close);
    const bodyTop = Math.min(yOpen, yClose);
    const bodyHeight = Math.max(1, Math.abs(yClose - yOpen));

    return (
      <g>
        <line x1={center} y1={yHigh} x2={center} y2={yLow} stroke={color} strokeWidth={1} />
        <rect
          x={center - candleWidth / 2}
          y={bodyTop}
          width={candleWidth}
          height={bodyHeight}
          fill={color}
        />
      </g>
    );
  };

  return (
    <div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={CHART_MARGIN}>
            <XAxis dataKey="idx" type="category" hide />
            <YAxis domain={domain} width={44} tickFormatter={formatPrice} tick={TICK_STYLE} />
            <YAxis yAxisId="vol" orientation="right" hide domain={[0, maxVolume]} />
            <Tooltip content={ChartTooltip} />
            <Bar dataKey="close" shape={candleShape} isAnimationActive={false} />
            <Bar dataKey="volume" yAxisId="vol" isAnimationActive={false}>
              {points.map((p) => (
                <Cell
                  key={p.idx}
                  fill={p.close >= p.open ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}
                />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-1 px-1">
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">VW-MACD</span>
        <span className="flex items-center gap-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 inline-block rounded" style={{ background: MACD_COLOR }} />
            MACD
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 inline-block rounded" style={{ background: SIGNAL_COLOR }} />
            Signal
          </span>
        </span>
      </div>
      <div style={{ height: 64 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={CHART_MARGIN}>
            <XAxis
              dataKey="idx"
              type="category"
              tickFormatter={formatTick}
              tick={TICK_STYLE}
              tickLine={false}
              axisLine={false}
              minTickGap={48}
              height={16}
            />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip content={ChartTooltip} />
            <ReferenceLine y={0} stroke="#334155" />
            <Line dataKey="macd" stroke={MACD_COLOR} dot={false} isAnimationActive={false} connectNulls />
            <Line dataKey="macdSignal" stroke={SIGNAL_COLOR} dot={false} isAnimationActive={false} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
