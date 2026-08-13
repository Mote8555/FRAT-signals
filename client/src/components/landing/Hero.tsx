import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import ShapeGrid from "../ShapeGrid";

const HIGHLIGHTS = [
  "Regime Detection",
  "Multi-Timeframe Analysis",
  "Confidence Grading",
  "BTC Market Filter",
  "Adaptive Risk",
];

export default function Hero() {
  return (
    <section className="hero-glow relative overflow-hidden">
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <ShapeGrid
          direction="diagonal"
          speed={0.3}
          borderColor="rgba(148,163,184,0.1)"
          squareSize={44}
          shape="hexagon"
          hoverTrailAmount={3}
          hoverFillColor="rgba(59,130,246,0.12)"
          vignetteColor="#020617"
        />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-5 py-16 sm:py-24 text-center">
        <span className="inline-block text-[11px] font-semibold px-3 py-1 rounded-full bg-slate-800 text-blue-400 border border-slate-700">
          Fractal Regime-Adaptive Trading
        </span>

        <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-50 leading-tight">
          Trade the trend.
          <br />
          <span className="text-blue-500">Ignore the chaos.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-400">
          FRAT doesn&apos;t signal every market. It first measures whether a market is statistically
          worth trading — then generates high-conviction, confidence-graded signals you can actually
          act on.
        </p>

        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {HIGHLIGHTS.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                <Check className="h-3 w-3" aria-hidden="true" />
              </span>
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/app"
            className="px-7 py-3.5 rounded-lg bg-blue-500 text-white font-semibold text-base border-0 cursor-pointer hover:bg-blue-600 active:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition-colors"
          >
            View Signals
          </Link>
          <a
            href="#pipeline"
            className="px-7 py-3.5 rounded-lg border border-slate-700 bg-gray-900 text-gray-200 font-semibold text-base cursor-pointer hover:bg-slate-800 active:bg-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition-colors"
          >
            How signals are generated
          </a>
        </div>

       
      </div>
    </section>
  );
}
