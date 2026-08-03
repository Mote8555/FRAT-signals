export default function Problem() {
  return (
    <section className="border-t border-slate-800/60">
      <div className="max-w-4xl mx-auto px-5 py-16 sm:py-24">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-gray-50 sm:text-4xl">
          Most signals fail before the trade starts
        </h2>
        <div className="mt-10 space-y-6 text-center text-lg leading-relaxed text-gray-400">
          <p>
            Traditional indicators generate signals in <span className="text-gray-200">every market</span>.
            MACD crosses. RSI diverges. Moving averages flip.
          </p>
          <p>
            But most markets aren&apos;t trending. Signal tools keep firing anyway — because they never ask
            whether the market is statistically capable of producing trends.
          </p>
          <p className="font-semibold text-gray-200">
            FRAT detects whether the market is worth trading first. Only then does it generate a signal.
          </p>
        </div>
      </div>
    </section>
  );
}
