const STEPS = [
  {
    step: "01",
    title: "Regime Engine",
    body: "Hurst exponent and DFA classify each timeframe as TRENDING, RANDOM or MEAN_REVERTING.",
  },
  {
    step: "02",
    title: "Trend Filter",
    body: "KAMA and T3 moving averages confirm the trend direction on the timeframe and its higher-timeframe validator.",
  },
  {
    step: "03",
    title: "Momentum",
    body: "Volume-weighted MACD measures momentum strength and direction against the prevailing trend.",
  },
  {
    step: "04",
    title: "BTC Filter",
    body: "Bitcoin's trend and volatility contribute a market-wide score to every altcoin signal.",
  },
  {
    step: "05",
    title: "Confidence Engine",
    body: "Regime, trend, momentum and BTC components are weighted into a score graded A+ through C.",
  },
  {
    step: "06",
    title: "Signal Decision",
    body: "BUY or SELL fires only when every condition passes, with regime-aware TP/SL targets.",
  },
];

export default function Methodology() {
  return (
    <section id="methodology" className="border-t border-slate-800/60">
      <div className="max-w-6xl mx-auto px-5 py-16 sm:py-20">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-50 text-center">
          How the pipeline works
        </h2>
        <p className="mt-3 text-gray-400 text-center max-w-2xl mx-auto">
          Every pair runs through the same six-stage analysis on each timeframe independently.
        </p>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STEPS.map((s) => (
            <div
              key={s.step}
              className="bg-gray-900 rounded-xl border border-slate-800/60 p-6 flex flex-col gap-3"
            >
              <span className="text-sm font-bold text-blue-500">{s.step}</span>
              <h3 className="font-bold text-gray-50">{s.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 bg-gray-900 rounded-xl border border-slate-800/60 p-6">
          <div className="flex items-center justify-center gap-2 flex-wrap text-[13px] font-semibold text-gray-400">
            {["KAMA", "T3", "VW-MACD", "ATR", "Hurst", "DFA"].map((name) => (
              <span key={name} className="px-3 py-1 rounded-full bg-slate-800 text-gray-300 border border-slate-700">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
