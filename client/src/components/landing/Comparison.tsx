import { X, Check } from "lucide-react";

const TRADITIONAL = ["MACD", "RSI", "EMA", "Signals everywhere", "Fixed TP / SL"];
const FRAT = [
  "Regime Detection",
  "Trend Confirmation",
  "BTC Market Filter",
  "Confidence Engine",
  "Adaptive Targets",
];

export default function Comparison() {
  return (
    <section className="border-t border-slate-800/60">
      <div className="max-w-5xl mx-auto px-5 py-16 sm:py-20">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-gray-50 sm:text-4xl">
          Why FRAT is different
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-800/60 bg-gray-900/50 p-6">
            <h3 className="text-lg font-bold text-gray-400">Traditional tools</h3>
            <ul className="mt-5 space-y-3">
              {TRADITIONAL.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-400">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-6 shadow-lg shadow-blue-500/10">
            <h3 className="text-lg font-bold text-gray-50">FRAT</h3>
            <ul className="mt-5 space-y-3">
              {FRAT.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-200">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
