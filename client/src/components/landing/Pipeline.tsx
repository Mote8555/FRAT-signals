import { ArrowDown } from "lucide-react";

interface Step {
  title: string;
  method: string;
  body: string;
  gate?: string;
}

const STEPS: Step[] = [
  {
    title: "Price",
    method: "Kraken OHLCV",
    body: "Live spot candles from Kraken across 15m, 1h, 4h and 1d.",
  },
  {
    title: "Regime Detection",
    method: "Hurst + DFA",
    body: "Is this market statistically trending, random or mean-reverting?",
    gate: "Rejected unless TRENDING",
  },
  {
    title: "Trend Filter",
    method: "KAMA + T3",
    body: "Confirms direction on the timeframe and its 4h validating trend.",
    gate: "Rejected if NEUTRAL or conflicting",
  },
  {
    title: "Momentum",
    method: "VW-MACD",
    body: "Measures momentum strength and direction after the trend is confirmed.",
  },
  {
    title: "BTC Filter",
    method: "KAMA + EMA20",
    body: "Bitcoin's trend and volatility give every signal a market-wide reality check.",
  },
  {
    title: "Confidence",
    method: "Weighted score",
    body: "Regime, trend, momentum and BTC are weighted into one score, graded A+ to C.",
    gate: "Rejected below grade C",
  },
  {
    title: "Trade",
    method: "BUY · SELL · IGNORE",
    body: "A signal fires only when every stage passes, with regime-aware TP/SL targets.",
  },
];

export default function Pipeline() {
  return (
    <section id="pipeline" className="border-t border-slate-800/60">
      <div className="max-w-3xl mx-auto px-5 py-16 sm:py-20">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-gray-50 sm:text-4xl">
          Every signal passes six filters
        </h2>
        <p className="mt-3 text-center text-gray-400">
          Each pair runs through the same pipeline on every timeframe, independently.
        </p>

        <div className="mt-12 flex flex-col items-center">
          {STEPS.map((step, idx) => (
            <div key={step.title} className="flex w-full max-w-xl flex-col items-center">
              <div
                className={`w-full rounded-xl border p-5 ${
                  idx === STEPS.length - 1
                    ? "border-blue-500/40 bg-blue-500/10 shadow-lg shadow-blue-500/10"
                    : "border-slate-800/60 bg-gray-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-50">{step.title}</h3>
                  <span className="text-[11px] font-semibold text-blue-400">{step.method}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{step.body}</p>
                {step.gate && (
                  <span className="mt-3 inline-block rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] font-semibold text-red-400">
                    {step.gate}
                  </span>
                )}
                {idx === STEPS.length - 1 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-md border border-green-500/40 bg-green-500/10 px-4 py-1.5 font-bold text-green-500">
                      BUY
                    </span>
                    <span className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-1.5 font-bold text-red-500">
                      SELL
                    </span>
                    <span className="rounded-md border border-slate-600 bg-slate-800/60 px-4 py-1.5 font-bold text-gray-400">
                      IGNORE
                    </span>
                  </div>
                )}
              </div>
              {idx < STEPS.length - 1 && (
                <div className="flex flex-col items-center py-2 text-slate-600">
                  <span className="text-[10px] uppercase tracking-wider">Passes filter</span>
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
