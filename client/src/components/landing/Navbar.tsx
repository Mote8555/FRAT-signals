import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/FRAT.webp" alt="FRAT Signals" className="h-8 w-8 rounded-md" />
          <span className="font-extrabold tracking-tight text-gray-50">FRAT Signals</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-400">
          <a href="#features" className="hover:text-gray-50 transition-colors">
            Features
          </a>
          <a href="#methodology" className="hover:text-gray-50 transition-colors">
            How it works
          </a>
          <a href="#pairs" className="hover:text-gray-50 transition-colors">
            Pairs
          </a>
        </nav>
        <Link
          to="/app"
          className="px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold text-sm border-0 cursor-pointer hover:bg-blue-600 active:bg-blue-700 transition-colors"
        >
          Launch Dashboard
        </Link>
      </div>
    </header>
  );
}
