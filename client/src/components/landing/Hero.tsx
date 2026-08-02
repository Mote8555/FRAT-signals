import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: "url(/FRAT.webp)",
          backgroundSize: "480px",
          backgroundPosition: "center",
          backgroundRepeat: "repeat",
        }}
      />
      <div className="max-w-6xl mx-auto px-5 py-20 sm:py-28 relative">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <span className="inline-block text-[11px] font-semibold px-3 py-1 rounded-full bg-slate-800 text-blue-400 border border-slate-700 mb-5">
              Fractal Regime-Adaptive Trading
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-50 leading-tight">
              Trade the trend,
              <br />
              <span className="text-blue-500">not the noise.</span>
            </h1>
            <p className="mt-5 text-gray-400 text-lg max-w-xl mx-auto lg:mx-0">
              FRAT Signals analyzes crypto markets across four timeframes with Hurst/DFA regime
              detection, KAMA/T3 trend confirmation, and VW-MACD momentum — scoring every signal
              with a weighted confidence grade.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                to="/app"
                className="px-6 py-3 rounded-lg bg-blue-500 text-white font-semibold text-base border-0 cursor-pointer hover:bg-blue-600 active:bg-blue-700 transition-colors text-center"
              >
                Launch Dashboard
              </Link>
              <a
                href="#methodology"
                className="px-6 py-3 rounded-lg border border-slate-700 bg-gray-900 text-gray-200 font-semibold text-base cursor-pointer hover:bg-slate-800 active:bg-slate-700 transition-colors text-center"
              >
                How it works
              </a>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0">
              {[
                { value: "4", label: "Timeframes" },
                { value: "13", label: "Kraken pairs" },
                { value: "60s", label: "Auto-refresh" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-extrabold text-gray-50">{stat.value}</div>
                  <div className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mt-0.5">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="relative">
              <div className="absolute -inset-6 rounded-full bg-blue-500/20 blur-3xl" />
              <img
                src="/FRAT.webp"
                alt="FRAT Signals brand"
                className="relative h-52 w-52 sm:h-64 sm:w-64 rounded-2xl border border-slate-800/60 shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
