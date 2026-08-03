import type { ReactNode } from "react";
import { Award, Brain, Gauge, Layers, ShieldCheck, TrendingUp } from "lucide-react";

interface Feature {
  icon: typeof Brain;
  title: string;
  body: string;
  visual: ReactNode;
}

const FEATURES: Feature[] = [
  {
    icon: Brain,
    title: "Regime Detection",
    body: "Classifies each timeframe as TRENDING, RANDOM or MEAN_REVERTING — and only trades the trending ones.",
    visual: (
      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-full border border-green-500/40 bg-green-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-green-500">
          TRENDING
        </span>
        <span className="rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-0.5 text-[10px] font-semibold text-gray-500">
          RANDOM
        </span>
        <span className="rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-0.5 text-[10px] font-semibold text-gray-500">
          MEAN_REVERTING
        </span>
      </div>
    ),
  },
  {
    icon: TrendingUp,
    title: "Trend Filter",
    body: "KAMA and T3 confirm direction on the timeframe and against its 4h validating trend.",
    visual: (
      <svg viewBox="0 0 120 36" className="h-9 w-full text-green-500" aria-hidden="true">
        <polyline
          points="0,30 20,26 40,27 60,18 80,12 120,4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    icon: Gauge,
    title: "Momentum",
    body: "Volume-weighted MACD measures momentum strength and direction — after the trend is confirmed.",
    visual: (
      <div className="flex h-2 w-full gap-1">
        <div className="flex-1 rounded bg-red-500/60" />
        <div className="flex-1 rounded bg-slate-700" />
        <div className="flex-1 rounded bg-slate-700" />
        <div className="flex-1 rounded bg-green-500/60" />
        <div className="flex-1 rounded bg-green-500" />
      </div>
    ),
  },
  {
    icon: ShieldCheck,
    title: "BTC Market Filter",
    body: "Bitcoin's trend and volatility give every altcoin signal a market-wide reality check.",
    visual: (
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold text-gray-500">BTC</span>
        <span className="rounded-full border border-green-500/40 bg-green-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-green-500">
          BULLISH
        </span>
      </div>
    ),
  },
  {
    icon: Layers,
    title: "Adaptive Risk",
    body: "TP and SL scale with regime strength and ATR volatility — no fixed multipliers.",
    visual: (
      <div className="flex gap-1.5">
        <span className="rounded-md border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold text-red-500">
          SL · 2×ATR
        </span>
        <span className="rounded-md border border-green-500/40 bg-green-500/10 px-2.5 py-1 text-[10px] font-semibold text-green-500">
          TP · 5×ATR
        </span>
      </div>
    ),
  },
  {
    icon: Award,
    title: "Confidence",
    body: "Four weighted components grade every signal A+ through C — rejecting weak opportunities before they become losing trades.",
    visual: (
      <div className="flex h-2 w-full gap-0.5">
        <div className="flex-[30] rounded bg-green-500" />
        <div className="flex-[25] rounded bg-blue-500" />
        <div className="flex-[25] rounded bg-purple-500" />
        <div className="flex-[20] rounded bg-orange-500" />
      </div>
    ),
  },
];

export default function Features() {
  return (
    <section id="features" className="border-t border-slate-800/60">
      <div className="max-w-7xl mx-auto px-5 py-16 sm:py-20">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-gray-50 sm:text-4xl">
          Built for trending markets
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-gray-400">
          A complete signal pipeline — regime detection, trend filtering, momentum, and scoring — in
          one dashboard.
        </p>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-4 rounded-xl border border-slate-800/60 bg-gray-900 p-6 transition-colors hover:border-slate-700"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-blue-400">
                  <feature.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="text-xl font-bold text-gray-50">{feature.title}</h3>
              </div>
              <p className="text-sm leading-relaxed text-gray-400">{feature.body}</p>
              <div className="mt-auto rounded-lg border border-slate-800/60 bg-slate-950/50 p-3">
                {feature.visual}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
