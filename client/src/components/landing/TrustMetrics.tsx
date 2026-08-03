const METRICS = [
  { value: "13", label: "Markets" },
  { value: "4", label: "Timeframes" },
  { value: "180s", label: "Refresh" },
  { value: "A+", label: "Confidence" },
  { value: "6", label: "Signal Filters" },
];

export default function TrustMetrics() {
  return (
    <section className="border-b border-slate-800/60">
      <div className="max-w-7xl mx-auto px-5 py-12">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {METRICS.map((m) => (
            <div key={m.label} className="text-center">
              <div className="text-3xl font-extrabold tracking-tight text-gray-50 sm:text-4xl">{m.value}</div>
              <div className="mt-1 text-[12px] font-semibold uppercase tracking-wider text-gray-500">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
