import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: "Why doesn't FRAT trade every market?",
    a: "Most markets are ranging most of the time. FRAT measures each timeframe with Hurst and DFA analysis and only acts when the regime is classified as TRENDING — Hurst above 0.55. If the market isn't statistically capable of producing trends, no signal is generated.",
  },
  {
    q: "What is the Hurst exponent?",
    a: "A rescaled-range (R/S) statistic between 0 and 1 that measures persistence. Above 0.55 the market is trending (momentum persists), between 0.45 and 0.55 it behaves like a random walk, and below 0.45 it tends to mean-revert. FRAT only trades the trending band.",
  },
  {
    q: "What is DFA?",
    a: "Detrended Fluctuation Analysis measures long-range correlation in price. A DFA above 1.0 is consistent with a trending market and boosts regime confidence; values below 0.5 are consistent with mean-reversion.",
  },
  {
    q: "How often are signals updated?",
    a: "Signals are computed from live Kraken candles whenever you load a pair, and the dashboard auto-refreshes every 180 seconds.",
  },
  {
    q: "Which exchange is supported?",
    a: "Kraken spot via the CCXT library, covering 13 major USDT pairs: BTC, ETH, SOL, BNB, XRP, ADA, DOGE, AVAX, DOT, LINK, ATOM, LTC and BCH.",
  },
  {
    q: "How is confidence calculated?",
    a: "Four components are weighted and averaged into a 0–100 score: regime (30%), trend (25%), momentum (25%) and the BTC market filter (20%). The score maps to a grade: 90+ is A+, 80–89 A, 70–79 B, 60–69 C, and anything below 60 is IGNORE — no trade.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-slate-800/60">
      <div className="max-w-3xl mx-auto px-5 py-16 sm:py-20">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-gray-50 sm:text-4xl">
          Frequently asked questions
        </h2>
        <div className="mt-10 space-y-3">
          {FAQS.map((item, idx) => {
            const isOpen = open === idx;
            return (
              <div
                key={item.q}
                className={`rounded-xl border bg-gray-900 transition-colors ${
                  isOpen ? "border-blue-500/40" : "border-slate-800/60"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${idx}`}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none rounded-xl"
                >
                  <span className="font-semibold text-gray-50">{item.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-gray-500 ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <div id={`faq-panel-${idx}`} className="px-5 pb-4 text-sm leading-relaxed text-gray-400">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
