const PAIRS = [
  "BTC/USDT",
  "ETH/USDT",
  "SOL/USDT",
  "BNB/USDT",
  "XRP/USDT",
  "ADA/USDT",
  "DOGE/USDT",
  "AVAX/USDT",
  "DOT/USDT",
  "LINK/USDT",
  "ATOM/USDT",
  "LTC/USDT",
  "BCH/USDT",
];

export default function Markets() {
  return (
    <section id="markets" className="border-t border-slate-800/60">
      <div className="max-w-7xl mx-auto px-5 py-16 sm:py-20">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-gray-50 sm:text-4xl">
          Supported markets
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-gray-400">
          Live spot data for 13 major cryptocurrency pairs via the Kraken exchange.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {PAIRS.map((pair) => (
            <div
              key={pair}
              className="rounded-lg border border-slate-800/60 bg-gray-900 px-4 py-3.5 text-center text-sm font-semibold text-gray-200 transition-colors hover:border-slate-700"
            >
              {pair}
            </div>
          ))}
          <div className="flex items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/5 px-4 py-3.5 text-center text-sm font-semibold text-blue-400">
            Kraken Spot
          </div>
        </div>
      </div>
    </section>
  );
}
