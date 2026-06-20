const BASE = "/api";

export async function fetchPairs(market) {
  const query = market ? `?market=${market}` : "";
  const res = await fetch(`${BASE}/pairs${query}`);
  if (!res.ok) throw new Error("Failed to fetch pairs");
  const data = await res.json();
  return data.pairs;
}

export async function fetchSignal(pair) {
  const res = await fetch(`${BASE}/signal/${encodeURIComponent(pair)}`);
  if (!res.ok) {
    if (res.status === 503) throw new Error("Market data unavailable");
    throw new Error("Failed to fetch signal");
  }
  return res.json();
}

export async function fetchRegime(pair) {
  const res = await fetch(`${BASE}/regime/${encodeURIComponent(pair)}`);
  if (!res.ok) throw new Error("Failed to fetch regime");
  return res.json();
}

export async function fetchFractal(pair) {
  const res = await fetch(`${BASE}/fractal/${encodeURIComponent(pair)}`);
  if (!res.ok) {
    if (res.status === 503) throw new Error("Market data unavailable");
    throw new Error("Failed to fetch fractal signals");
  }
  return res.json();
}
