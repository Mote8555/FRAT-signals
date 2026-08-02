const FEATURES = [
  {
    title: "Multi-Timeframe Confluence",
    body: "Signals are generated independently across 15m, 1h, 4h and 1d, then combined into a single confluence score so you see the full fractal picture.",
  },
  {
    title: "Hurst / DFA Regime Engine",
    body: "Markets are classified as TRENDING, RANDOM or MEAN_REVERTING using rescaled-range and detrended fluctuation analysis. Trades only fire in trending conditions.",
  },
  {
    title: "Confidence Scoring",
    body: "Every signal carries a weighted confidence score and letter grade (A+ through C) built from regime, trend, momentum and BTC filter components.",
  },
  {
    title: "Adaptive TP / SL",
    body: "Take-profit and stop-loss targets scale with regime strength and ATR volatility instead of using fixed multipliers.",
  },
  {
    title: "BTC Market Filter",
    body: "Bitcoin trend and volatility are factored into the scoring pipeline, giving altcoin signals a market-wide reality check.",
  },
  {
    title: "Live Kraken Data",
    body: "Spot prices stream directly from the Kraken exchange via CCXT, with the dashboard auto-refreshing every 3 minutes.",
  },
];

export default function Features() {
  return (
    <section id="features" className="border-t border-slate-800/60">
      <div className="max-w-6xl mx-auto px-5 py-16 sm:py-20">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-50 text-center">
          Built for trending markets
        </h2>
        <p className="mt-3 text-gray-400 text-center max-w-2xl mx-auto">
          A full signal pipeline — regime detection, trend filtering, momentum, and scoring — in
          one dashboard.
        </p>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bg-gray-900 rounded-xl border border-slate-800/60 p-6 hover:border-slate-700 transition-colors"
            >
              <h3 className="font-bold text-gray-50 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feature.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
