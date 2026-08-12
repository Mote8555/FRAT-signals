import { Link } from "react-router-dom";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "View signals", to: "/app" },
      { label: "Methodology", href: "#pipeline" },
      { label: "Markets", href: "#markets" },
      { label: "Documentation", href: "https://github.com/Mote8555/FRAT-signals" },
    ],
  },
  {
    title: "Tools",
    links: [
      { label: "FRAS-Fractal Regime-Adaptive System", href: "https://fras-frontend.onrender.com/" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/60 bg-gray-900/40">
      <div className="max-w-7xl mx-auto px-5 py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <img src="/FRAT.webp" alt="FRAT Signals" className="h-8 w-8 rounded-md" />
              <span className="font-extrabold tracking-tight text-gray-50">FRAT Signals</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-gray-500">
              Fractal Regime-Adaptive Trading — multi-timeframe crypto signals with Hurst/DFA regime
              detection, trend confirmation and confidence scoring.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-[11px] font-semibold text-gray-300">
                Powered by Kraken
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-[11px] font-semibold text-gray-300">
                Provided by FRAT Signals
              </span>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-bold text-gray-50">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) =>
                  link.to ? (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="text-sm text-gray-500 rounded-md focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none hover:text-gray-200 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-gray-500 rounded-md focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none hover:text-gray-200 transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-3 border-t border-slate-800/60 pt-6 text-center">
          <p className="text-[11px] text-gray-600 max-w-md">
          Not financial advice. Trading cryptocurrencies involves substantial
            risk of loss.
          </p>
          <p className="text-[11px] text-gray-600">
            Data provided by Kraken &middot; FRAT Signals &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
