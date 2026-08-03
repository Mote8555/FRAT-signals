import { Link } from "react-router-dom";

export default function CTA() {
  return (
    <section className="cta-glow border-t border-slate-800/60">
      <div className="max-w-4xl mx-auto px-5 py-20 sm:py-28 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-50 sm:text-4xl">
          Ready to trade higher-quality signals?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-gray-400">
          FRAT filters markets before generating signals — so the signals you see are the ones
          statistically worth acting on.
        </p>
        <div className="mt-9">
          <Link
            to="/app"
            className="inline-block px-7 py-3.5 rounded-lg bg-blue-500 text-white font-semibold text-base border-0 cursor-pointer hover:bg-blue-600 active:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition-colors"
          >
            Launch Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
