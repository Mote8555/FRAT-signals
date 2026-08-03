import DashboardMockup from "./DashboardMockup";

export default function DashboardPreview() {
  return (
    <section id="dashboard" className="border-t border-slate-800/60">
      <div className="max-w-7xl mx-auto px-5 py-16 sm:py-20">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-gray-50 sm:text-4xl">
          See the whole picture at a glance
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-gray-400">
          Every timeframe, every score, every target — combined into a single confluence view that
          tells you whether the market is statistically worth trading.
        </p>

        <div className="mt-12">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}
