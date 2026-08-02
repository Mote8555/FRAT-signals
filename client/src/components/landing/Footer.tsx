import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/60 bg-gray-900/40">
      <div className="max-w-6xl mx-auto px-5 py-12 flex flex-col items-center gap-6 text-center">
        <div className="flex items-center gap-2.5">
          <img src="/FRAT.webp" alt="FRAT Signals" className="h-8 w-8 rounded-md" />
          <span className="font-extrabold tracking-tight text-gray-50">FRAT Signals</span>
        </div>
        <p className="text-sm text-gray-500 max-w-xl">
          Fractal Regime-Adaptive Trading — multi-timeframe crypto signals with Hurst/DFA regime
          detection, trend confirmation and confidence scoring.
        </p>
        <Link
          to="/app"
          className="px-5 py-2.5 rounded-lg bg-blue-500 text-white font-semibold text-sm border-0 cursor-pointer hover:bg-blue-600 active:bg-blue-700 transition-colors"
        >
          Launch Dashboard
        </Link>
        <p className="text-[11px] text-gray-600 max-w-md">
          Educational tool only. Not financial advice. Trading cryptocurrencies involves
          substantial risk of loss.
        </p>
        <div className="text-[11px] text-gray-600">
          Data: Kraken &middot; FRAT Signals &copy; {new Date().getFullYear()}
        </div>
      </div>
    </footer>
  );
}
