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

export default function Pairs() {
  return (
    <section id="pairs" className="border-t border-slate-800/60">
      <div className="max-w-6xl mx-auto px-5 py-16 sm:py-20">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-50 text-center">
          Supported pairs
        </h2>
        <p className="mt-3 text-gray-400 text-center max-w-2xl mx-auto">
          Live spot data for 13 major cryptocurrency pairs via the Kraken exchange.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {PAIRS.map((pair) => (
            <span
              key={pair}
              className="px-4 py-2 rounded-full bg-gray-900 border border-slate-800/60 text-sm font-semibold text-gray-200"
            >
              {pair}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
