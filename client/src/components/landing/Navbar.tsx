import { Link } from "react-router-dom";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#pipeline", label: "Methodology" },
  { href: "#dashboard", label: "Dashboard" },
  { href: "#markets", label: "Markets" },
  { href: "#faq", label: "FAQ" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-5 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/FRAT.webp" alt="FRAT Signals" className="h-8 w-8 rounded-md" />
          <span className="font-extrabold tracking-tight text-gray-50">FRAT Signals</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-7 text-sm text-gray-400">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none hover:text-gray-50 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <Link
          to="/app"
          className="px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold text-sm border-0 cursor-pointer hover:bg-blue-600 active:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition-colors"
        >
          Launch Dashboard
        </Link>
      </div>
    </header>
  );
}
