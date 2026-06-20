const BASE = "/api";

function qs(params) {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== "");
  return entries.length ? "?" + new URLSearchParams(entries).toString() : "";
}

export async function fetchPairs(market, source) {
  const res = await fetch(`${BASE}/pairs${qs({ market, source })}`);
  if (!res.ok) throw new Error("Failed to fetch pairs");
  const data = await res.json();
  return data.pairs;
}

export async function fetchSignal(pair, source) {
  const res = await fetch(`${BASE}/signal/${encodeURIComponent(pair)}${qs({ source })}`);
  if (!res.ok) {
    if (res.status === 503) throw new Error("Market data unavailable");
    throw new Error("Failed to fetch signal");
  }
  return res.json();
}

export async function fetchRegime(pair, source) {
  const res = await fetch(`${BASE}/regime/${encodeURIComponent(pair)}${qs({ source })}`);
  if (!res.ok) throw new Error("Failed to fetch regime");
  return res.json();
}

export async function fetchFractal(pair, source) {
  const res = await fetch(`${BASE}/fractal/${encodeURIComponent(pair)}${qs({ source })}`);
  if (!res.ok) {
    if (res.status === 503) throw new Error("Market data unavailable");
    throw new Error("Failed to fetch fractal signals");
  }
  return res.json();
}
