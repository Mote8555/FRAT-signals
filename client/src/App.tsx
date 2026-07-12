import { useState, useEffect, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import PairSelector from "./components/PairSelector";
import FractalSignals from "./components/FractalSignals";
import useMediaQuery from "./useMediaQuery";
import { fetchPairs, fetchFractal, type FractalData } from "./api";

export default function App() {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const [pairs, setPairs] = useState<string[]>([]);
  const [selected, setSelected] = useState("BTC/USDT");
  const [data, setData] = useState<FractalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPairs()
      .then((list) => {
        setPairs(list);
        setSelected((prev) => (list.includes(prev) ? prev : list[0]));
      })
      .catch(() => {
        const fallback = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BCH/USDT"];
        setPairs(fallback);
        setSelected((prev) => (fallback.includes(prev) ? prev : fallback[0]));
      });
  }, []);

  const loadFractal = useCallback(async (pair: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFractal(pair);
      setData(result);
      toast.success("Signals updated", { duration: 2000, icon: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      setData(null);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFractal(selected);
    const interval = setInterval(() => loadFractal(selected), 60000);
    return () => clearInterval(interval);
  }, [selected, loadFractal]);

  return (
    <div className="min-h-screen bg-slate-900 text-gray-50 font-sans">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1f2937",
            color: "#f9fafb",
            border: "1px solid #374151",
            fontSize: "14px",
          },
        }}
      />
      <div className={`max-w-[700px] mx-auto ${isMobile ? "px-3 py-6" : "px-5 py-10"}`}>
        <div className={`text-center ${isMobile ? "mb-6" : "mb-8"}`}>
          <h1 className="text-2xl font-extrabold tracking-tight">FRAT Signals</h1>
          <div className="text-[13px] text-gray-500 mt-1">Fractal Regime-Adaptive Trading</div>
        </div>

        <div
          className={`flex ${isMobile ? "flex-col gap-2" : "flex-row gap-3"} mb-5 ${isMobile ? "items-stretch" : "items-center"}`}
        >
          <PairSelector
            pairs={pairs}
            selected={selected}
            onSelect={setSelected}
            fullWidth={isMobile}
          />
          <button
            onClick={() => loadFractal(selected)}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg bg-blue-500 text-white font-semibold text-sm border-0 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "..." : "Refresh"}
          </button>
        </div>

        <FractalSignals data={data} loading={loading} error={error} />
      </div>
    </div>
  );
}
