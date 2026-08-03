# FRAT Signals

**Fractal Regime-Adaptive Trading System** — a cryptocurrency signal dashboard that analyzes markets across four timeframes with Hurst/DFA regime detection, KAMA/T3 trend confirmation, and VW-MACD momentum, scoring every signal with a weighted confidence grade.

Live spot data streams from the Kraken exchange via CCXT into a responsive React dark-theme dashboard. Signals are generated independently on the 15m, 1h, 4h, and 1d timeframes, then combined into a fractal confluence view so you can see the full multi-timeframe picture at a glance.

## Features

- **Multi-Timeframe Confluence** — Signals are generated independently across 15m, 1h, 4h, and 1d, then combined into a single confluence score (bullish/bearish/neutral counts).
- **Hurst / DFA Regime Engine** — Markets are classified as `TRENDING`, `RANDOM`, or `MEAN_REVERTING` using rescaled-range (Hurst exponent) and detrended fluctuation analysis. Trades only fire in trending conditions.
- **Confidence Scoring** — Every signal carries a weighted confidence score and letter grade (`A+` through `C`) built from regime, trend, momentum, and BTC filter components.
- **Adaptive TP / SL** — Take-profit and stop-loss targets scale with regime strength and ATR volatility instead of using fixed multipliers.
- **BTC Market Filter** — Bitcoin's trend and volatility are factored into the scoring pipeline, giving altcoin signals a market-wide reality check.
- **Live Kraken Data** — Spot prices stream directly from the Kraken exchange via CCXT; the dashboard auto-refreshes every 180 seconds.
- **Per-Timeframe Charts** — Expandable candlestick charts with VW-MACD overlay, plus sparklines and confidence ring gauges per card.
- **Responsive Dark UI** — Slate/blue theme built with Tailwind CSS, stacked layout on mobile and side-by-side on desktop.

## How the Signal Pipeline Works

Every pair runs through the same six-stage analysis on each timeframe independently:

1. **Regime Engine** — Hurst exponent and DFA classify the timeframe as `TRENDING`, `RANDOM`, or `MEAN_REVERTING`. Non-trending regimes are rejected.
2. **Trend Filter** — KAMA and T3 moving averages confirm trend direction; the current timeframe's trend must agree with its 4h validating trend when present.
3. **Momentum** — Volume-weighted MACD measures momentum strength and direction.
4. **BTC Filter** — Bitcoin's trend and volatility contribute a market-wide score.
5. **Confidence Engine** — Regime, trend, momentum, and BTC components are weighted into a score graded `A+` through `C`. Grades below `C` are ignored.
6. **Signal Decision** — A `BUY` or `SELL` fires only when every condition passes, with regime-aware TP/SL targets.

### Indicators

| Indicator | Role | Parameters |
|-----------|------|------------|
| **KAMA** (Kaufman's Adaptive Moving Average) | Baseline trend filter | period=10, fast=2, slow=30 |
| **T3** (Tillson's T3 Moving Average) | Smoother trend confirmation | period=8, volumeFactor=0.7 |
| **VW-MACD** (Volume-Weighted MACD) | Momentum + volume combo | fast=12, slow=26, signal=9 |
| **ATR** (Average True Range) | Volatility measurement | period=14 |
| **Hurst exponent** | Regime classification (R/S analysis) | lag windows 10–100 |
| **DFA** (Detrended Fluctuation Analysis) | Regime confidence boost | lag windows 10–100 |

### Entry Conditions

A signal is emitted only when all of the following pass:

1. Regime is `TRENDING` (Hurst > 0.55)
2. Timeframe trend is not `NEUTRAL`
3. Optional validating (4h) trend matches the primary trend
4. VW-MACD line above signal line (BUY) or below (SELL)
5. Price on the correct side of KAMA
6. Price within 1 ATR of KAMA
7. T3 slope positive (BUY) or negative (SELL)
8. Confidence grade ≥ `C` (not `IGNORE`)

### Adaptive TP/SL

| Regime Strength | Stop Loss | Take Profit |
|-----------------|-----------|-------------|
| STRONG_TRENDING (confidence > 80) | 2 × ATR | 8 × ATR |
| TRENDING (confidence > 60) | 2 × ATR | 5 × ATR |
| WEAK_TRENDING | 1.5 × ATR | 2.5 × ATR |
| Default | 1.5 × ATR | 3 × ATR |

## Supported Pairs (13)

`BTC/USDT`, `ETH/USDT`, `SOL/USDT`, `BNB/USDT`, `XRP/USDT`, `ADA/USDT`, `DOGE/USDT`, `AVAX/USDT`, `DOT/USDT`, `LINK/USDT`, `ATOM/USDT`, `LTC/USDT`, `BCH/USDT`

## Project Structure

```
frat-signals/
├── trend.js                         # Core algorithm: indicators + signal generation
├── server.js                        # Express API server (port 3001, Kraken)
├── package.json                     # Root dependencies + dev scripts
├── program.md                       # Deep-dive internal documentation
├── todo.md                          # Development roadmap
│
├── services/
│   ├── regime-engine.js             # Hurst exponent, DFA, regime detection
│   ├── timeframe-filter.js          # KAMA trend filter
│   ├── btc-filter.js                # Bitcoin market condition filter
│   ├── confidence-engine.js         # Weighted component scoring + grade
│   ├── risk-engine.js               # Position sizing (1% risk) — not yet wired
│   ├── exit-engine.js               # Chandelier exit + trailing + partial TP — used in backtesting
│   ├── database.js                  # SQLite trade journal — not yet wired
│   └── exchange/
│       └── kraken.js                # CCXT Kraken spot wrapper
│
├── backtesting/
│   ├── engine.js                    # Historical simulation engine
│   ├── metrics.js                   # Performance statistics (Sharpe, Sortino, DD, CAGR)
│   └── run.js                       # CLI entry point (npm run backtest)
│
└── client/                          # Vite + React 18 + TypeScript SPA
    ├── index.html                   # SPA entry point (Inter font, dark theme)
    ├── vite.config.js               # Dev server with /api proxy to Express
    ├── tailwind.config.js           # Tailwind with Inter font
    └── src/
        ├── main.tsx                 # ReactDOM entry with ErrorBoundary + router
        ├── App.tsx                  # Dashboard: pair selector, auto-refresh
        ├── api.ts                   # Fetch wrappers + TypeScript types
        ├── pages/LandingPage.tsx    # Marketing landing page
        └── components/
            ├── PairSelector.tsx       # Searchable trading pair dropdown
            ├── FractalSignals.tsx     # 2×2 grid + confluence bar + footer
            ├── TimeframeCard.tsx      # Per-timeframe card with chart toggle
            ├── CandleChart.tsx        # Candlestick + VW-MACD chart (Recharts)
            ├── ConfidenceMeter.tsx    # SVG ring gauge with score + grade
            ├── ComponentBreakdown.tsx # Stacked bar of weighted components
            ├── Sparkline.tsx          # SVG area sparkline
            ├── ErrorBoundary.tsx      # Error boundary with retry
            ├── Skeleton.tsx           # Loading skeleton
            └── landing/               # Navbar, Hero, Features, Methodology, Pairs, Footer
```

## API Reference

The Express server (port 3001) routes all requests to Kraken spot data. In development the Vite dev server proxies `/api` to it.

### `GET /api/pairs`
Returns the list of 13 supported trading pairs.

```json
{ "pairs": ["BTC/USDT", "ETH/USDT", "SOL/USDT", "..."] }
```

### `GET /api/regime/:pair`
Fetches 300 hourly candles and returns the market regime.

```json
{
  "pair": "BTC/USDT",
  "regime": "TRENDING",
  "hurst": 0.62,
  "dfa": 1.15,
  "confidence": 87
}
```

### `GET /api/signal/:pair`
Fetches live data and runs the full signal pipeline (BTC filter + 4h validation). `signal` is `null` when no trade conditions are met.

```json
{
  "pair": "BTC/USDT",
  "signal": {
    "type": "BUY",
    "entryPrice": 64027.70,
    "stopLoss": 63983.70,
    "takeProfit": 64247.70,
    "confidence": { "score": 80, "grade": "A", "components": [...] },
    "regime": "TRENDING",
    "regimeStrength": "STRONG_TRENDING",
    "hurst": 0.95,
    "dfa": 1.7,
    "stopDistance": 88,
    "timestamp": "2026-06-18T11:20:24.792Z"
  },
  "regime": { "regime": "TRENDING", "hurst": 0.95, "dfa": 1.7, "confidence": 87 },
  "timeframe": "1h",
  "lastPrice": 64027.7,
  "timestamp": "2026-06-18T11:20:24.792Z"
}
```

### `GET /api/fractal/:pair`
Fetches all four timeframes (15m, 1h, 4h, 1d) in parallel, runs the pipeline on each, and returns combined results with confluence stats. This is the endpoint powering the dashboard.

```json
{
  "pair": "BTC/USDT",
  "timeframes": {
    "15m": { "signal": { "type": "SELL", "...": "..." }, "regime": { "...": "..." }, "lastPrice": 63947.3 },
    "1h":  { "signal": null, "regime": { "...": "..." }, "lastPrice": 64027.7 },
    "4h":  { "signal": null, "regime": { "...": "..." }, "lastPrice": 64100.0 },
    "1d":  { "signal": null, "regime": { "...": "..." }, "lastPrice": 63800.0 }
  },
  "confluence": { "bullishCount": 0, "bearishCount": 1, "neutralCount": 3 },
  "btcFilter": { "btcTrend": "BULLISH", "score": 82 },
  "dataSource": "Kraken",
  "timestamp": "2026-06-18T11:30:43.217Z"
}
```

### `GET /api/chart/:pair/:timeframe`
Returns OHLCV candles plus indicator series (KAMA, T3, VW-MACD, MACD signal, ATR) for a pair and timeframe (`15m`, `1h`, `4h`, or `1d`).

### `GET /api/status`
Health check.

```json
{ "status": "ok", "pairs": 13, "exchange": "Kraken" }
```

## Tech Stack

- **Backend**: Node.js, Express, CCXT (Kraken spot)
- **Frontend**: Vite, React 18, TypeScript, Tailwind CSS, Recharts, react-router-dom, react-hot-toast
- **Analysis**: Hurst exponent, Detrended Fluctuation Analysis (DFA), KAMA, T3, VW-MACD, ATR

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm

### Installation

```bash
npm run install:all
```

Installs root dependencies and the client dependencies.

### Development

```bash
npm run dev
```

Starts both concurrently:
- **API server** on `http://localhost:3001`
- **Vite dev server** on `http://localhost:5173` (proxies `/api` to Express)

Then open the dashboard at `http://localhost:5173/app`.

### Production Build

```bash
npm run build --prefix client
npm run server
```

### Running individually

```bash
npm run server     # API only
npm run client     # Vite dev server only
```

## Backtesting

The backtest engine replays historical OHLCV through the signal pipeline, simulating entries/exits with configurable commission (0.1%) and slippage (0.1%), Chandelier exits, ATR trailing stops, and partial profit-taking at 3R.

```bash
npm run backtest -- --symbol=BCH/USDT --timeframe=1d --limit=500 --balance=10000
```

| Flag | Default | Description |
|------|---------|-------------|
| `--symbol` | `BCH/USDT` | Trading pair to backtest |
| `--timeframe` | `1d` | Candle timeframe (`15m`, `1h`, `4h`, `1d`) |
| `--limit` | `500` | Number of candles to fetch (min 201) |
| `--balance` | `10000` | Starting account balance |

Output metrics: total trades, win rate, profit factor, Sharpe ratio, Sortino ratio, max drawdown, CAGR, total return, net profit, avg win, avg loss, and a full trade log.

## Deployment

The frontend is deployed to **Netlify** and the API is hosted separately on **Render**.

- `netlify.toml` builds the client (`cd client && npm ci && npm run build`) and publishes `client/dist`.
- All `/api/*` requests are proxied to `https://frat-signals.onrender.com/api/*`.
- SPA routing is handled by a catch-all redirect to `/index.html`.

## Status & Roadmap

**Wired and working:**
- Live multi-timeframe signal pipeline (Kraken spot data)
- Confidence scoring and adaptive TP/SL
- Backtest CLI with full performance metrics
- Dashboard + landing page

**Built but not yet wired into the live pipeline:**
- `services/risk-engine.js` — position sizing (used by the backtest engine)
- `services/exit-engine.js` — Chandelier exit / ATR trail / partial TP (used by the backtest engine)
- `services/database.js` — SQLite trade journal (auto-falls back to in-memory)
- BTC filter hard gates (`blockAltcoinLongs` / `blockAltcoinShorts`) — the filter currently only contributes to the confidence score

**Planned (see `todo.md`):**
- Open Interest and Funding Rate analysis (futures, e.g. Binance/Bybit)
- Automated order execution
- Machine-learning signal quality model
