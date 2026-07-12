import { useState, useRef, useEffect } from "react";

interface PairSelectorProps {
  pairs: string[];
  selected: string;
  onSelect: (pair: string) => void;
  fullWidth?: boolean;
}

export default function PairSelector({ pairs, selected, onSelect, fullWidth }: PairSelectorProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = pairs.filter((p) => p.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter" && filtered.length > 0) {
      onSelect(filtered[0]);
      setQuery("");
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className={`relative ${fullWidth ? "w-full" : ""}`}>
      <input
        type="text"
        value={open ? query : selected}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onKeyDown={handleKeyDown}
        className={`p-2.5 text-base rounded-lg border border-gray-700 bg-gray-800 text-gray-50 font-semibold outline-none focus:border-blue-500 ${
          fullWidth ? "w-full" : "min-w-[180px]"
        }`}
        placeholder="Search pair..."
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-700 bg-gray-800 shadow-lg">
          {filtered.map((pair) => (
            <li
              key={pair}
              className={`px-4 py-2.5 cursor-pointer text-sm font-semibold hover:bg-gray-700 ${
                pair === selected ? "text-blue-400 bg-gray-700/50" : "text-gray-50"
              }`}
              onClick={() => {
                onSelect(pair);
                setQuery("");
                setOpen(false);
              }}
            >
              {pair}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
