# FRAT Signals — Fractal Regime-Adaptive Trading System

A fractal regime-adaptive cryptocurrency signal dashboard powered by the Kraken exchange (CCXT spot API). Generates multi-timeframe BUY/SELL signals from Hurst/DFA regime detection, KAMA/T3 trend analysis, VW-MACD momentum, and BTC market filtering. Displays results in a responsive React dark-theme SPA with auto-refresh.

## Architecture Overview

```
               ┌──────────────────────────┐
               │      Kraken Exchange      │
               │      (CCXT Spot API)      │
               └──────────┬───────────────┘
                          │
               ┌──────────┼───────────────┐
               ▼          ▼               ▼
          ┌────────┐ ┌────────┐      ┌────────┐
          │ 15m    │ │ 1h     │      │ 4h     │
          │ OHLCV  │ │ OHLCV  │ ...  │ OHLCV  │
          └───┬────┘ └───┬────┘      └───┬────┘
              │          │               │
              ▼          ▼               ▼
     ┌────────────────── INDEPENDENT ANALYSIS PER TIMEFRAME ───────────┐
     │  Regime Engine → Timeframe Filter → BTC Filter → Confidence     │
     │  (Hurst/DFA)  (KAMA trend)    (BTC trend)  (weighted score)   │
     │  → Signal Decision (KAMA + T3 + VW-MACD + ATR)                 │
     │  → Adaptive TP/SL                                              │
     └─────────────────────────────────────────────────────────────────┘
              │          │               │
              ▼          ▼               ▼
     ┌─────────────────────────────────────────────────────────────────┐
     │                     Fractal Confluence                           │
     │        (bullishCount / bearishCount / neutralCount)              │
     └────────────────────────┬────────────────────────────────────────┘
                              │
                              ▼
                     ┌────────────────┐
                     │   React 2×2 Grid │
                     │   (4 timeframe   │
                     │    cards side    │
                     │    by side)      │
                     └────────────────┘
```

## Project Structure

```
frat-signals/
├── config.js                        # Central configuration — all tunable params
├── trend.js                         # Core algorithm: indicators + signal generation
├── server.js                        # Express API server (port 3001, Kraken)
├── package.json                     # Root dependencies + dev scripts
├── program.md                       # This file
│
├── services/
│   ├── regime-engine.js             # Hurst exponent, DFA, regime detection
│   ├── timeframe-filter.js          # KAMA trend filter (single-period evaluation)
│   ├── btc-filter.js                # Bitcoin market condition filter
│   ├── confidence-engine.js         # Weighted component scoring + grade
│   ├── risk-engine.js               # Position sizing (1% risk) — used by backtesting
│   ├── exit-engine.js               # Chandelier exit + trailing + partial TP — used by backtesting
│   ├── database.js                  # SQLite trade journal — NOT YET WIRED
│   └── exchange/
│       └── kraken.js                # CCXT Kraken spot wrapper
│
├── backtesting/
│   ├── engine.js                    # Historical simulation engine
│   ├── metrics.js                   # Performance statistics (Sharpe, Sortino, DD, CAGR)
│   ├── run.js                       # CLI entry point (npm run backtest)
│   ├── optimize.js                  # Multi-TF parameter sweep orchestrator
│   └── optimize-worker.js           # Single-backtest worker for optimizer
│
└── client/
    ├── package.json                 # Vite + React 18 + TypeScript dependencies
    ├── tsconfig.json                # Strict TypeScript config
    ├── vite.config.js               # Dev server with /api proxy to Express
    ├── tailwind.config.js           # Tailwind with Inter font
    ├── postcss.config.js            # PostCSS with Tailwind + Autoprefixer
    ├── eslint.config.js             # Flat config: TypeScript + React hooks
    ├── .prettierrc                  # Prettier config
    ├── index.html                   # SPA entry point (Inter font, dark theme-color meta)
    └── src/
        ├── main.tsx                 # ReactDOM entry with ErrorBoundary
        ├── App.tsx                  # Root component: pair selector, auto-refresh
        ├── api.ts                   # Fetch wrappers + TypeScript types
        ├── index.css                # Tailwind directives + base layer
        ├── useMediaQuery.ts         # Responsive hook
        └── components/
            ├── PairSelector.tsx       # Searchable trading pair dropdown
            ├── FractalSignals.tsx     # 2×2 grid container + confluence bar + footer
            ├── TimeframeCard.tsx      # Individual timeframe card
            ├── RegimeBadge.tsx        # Color-coded regime pill (UNUSED)
            ├── ConfidenceMeter.tsx    # SVG ring gauge with score + grade
            ├── ComponentBreakdown.tsx # Stacked bar of weighted components
            ├── ErrorBoundary.tsx      # Class-based error boundary with retry
            ├── Skeleton.tsx           # Loading skeleton (responsive 1/2-column grid)
            └── Sparkline.tsx          # SVG area sparkline using recharts
```

---

## Core Algorithm — `trend.js`

The `FRATAlgorithm` class is the system's central orchestrator. It imports all service modules and runs the signal pipeline.

### Indicators

| Indicator | Role | Parameters |
|-----------|------|------------|
| **KAMA** (Kaufman's Adaptive Moving Average) | Baseline trend filter | period=20, fast=2, slow=50 |
| **T3** (Tillson's T3 Moving Average) | Smoother trend confirmation | period=5, volumeFactor=0.5 |
| **VW-MACD** (Volume-Weighted MACD) | Momentum + volume combo | fast=15, slow=30, signal=10 |
| **ATR** (Average True Range) | Volatility measurement | period=14 |

All indicator parameters are centralized in `config.js` and can be tuned without touching source code.

### Signal Generation — `generateSignal(pair, candleData, options)`

Entry conditions (all must pass):

1. **Regime** → must be `"TRENDING"` (Hurst > 0.55). Regime check can be disabled per-TF via `timeframeScaling[tf].regimeCheck`.
2. **Timeframe trend** → must not be `"NEUTRAL"`
3. **Validating trend** (optional) → when supplied, must match the primary trend (multi-TF confirmation)
4. **TF-scaled min trend strength** → `|strength|` must meet `timeframeScaling[tf].minTrendStrength` (0 for 1d, 2 for 15m)
5. **Momentum** → VW-MACD line > signal line (for BUY), reverse for SELL
6. **KAMA position** → price must be on correct side of KAMA
7. **ATR proximity** → price within 1 ATR of KAMA
8. **T3 slope** → positive for BUY, negative for SELL
9. **Confidence** → weighted score must pass TF-scaled threshold (score ≥ 70 × `confidenceMultiplier`)

The `options.timeframe` parameter selects which `timeframeScaling` profile to apply. This allows the same algorithm to use tighter filters on noisy shorter timeframes and relaxed filters on longer ones.

### Adaptive TP/SL — `getAdaptiveTargets(atr, regime)`

| Regime Strength | Stop Loss | Take Profit |
|-----------------|-----------|-------------|
| STRONG_TRENDING (confidence > 80) | 2 × ATR | 8 × ATR |
| TRENDING (confidence > 70) | 2 × ATR | 5 × ATR |
| WEAK_TRENDING | 1.5 × ATR | 2.5 × ATR |
| Default | 1.5 × ATR | 3 × ATR |

Note: Exit multipliers from `timeframeScaling` further scale these targets in the backtesting engine.

### Supported Pairs (13 via Kraken)

BTC/USDT, ETH/USDT, SOL/USDT, BNB/USDT, XRP/USDT, ADA/USDT, DOGE/USDT, AVAX/USDT, DOT/USDT, LINK/USDT, ATOM/USDT, LTC/USDT, BCH/USDT

### Signal Output

```js
{
  pair: "BTC/USDT",
  type: "BUY",
  entryPrice: 64027.70,
  stopLoss: 63983.70,
  takeProfit: 64247.70,
  confidence: {
    score: 80,
    grade: "A",
    components: [
      { name: "regime", score: 100, weight: 30 },
      { name: "trend", score: 90, weight: 25 },
      { name: "momentum", score: 75, weight: 25 },
      { name: "btcFilter", score: 85, weight: 20 },
    ]
  },
  regime: "TRENDING",
  regimeStrength: "STRONG_TRENDING",
  hurst: 0.95,
  dfa: 1.7,
  stopDistance: 88,
  timestamp: "2026-06-18T11:20:24.792Z"
}
```

Returns `null` when no conditions are met.

---

## Service Modules

### `services/regime-engine.js`

Detects market regime using two independent methods:

- **Hurst Exponent (R/S analysis)**: Segments price data into lag windows, computes rescaled range for each, fits log-log regression. Output range [0, 1].
  - H > 0.55 → Trending (persistent)
  - 0.45 ≤ H ≤ 0.55 → Random walk
  - H < 0.45 → Mean-reverting (anti-persistent)

- **DFA (Detrended Fluctuation Analysis)**: Integrates price deviations, fits local linear trends per lag window, measures residual fluctuation. Output range [0, 2].
  - DFA > 1.0 consistent with trending → confidence boost
  - DFA < 0.5 consistent with mean-reversion → confidence boost

**Output**: `detectRegime(prices)` returns `{ regime, hurst, dfa, confidence }`

---

### `services/timeframe-filter.js`

Evaluates trend using KAMA slope and price position relative to period average. The `evaluateTrend(prices, period)` method scores on two axes (slope direction + price position), returning `"BULLISH"`, `"BEARISH"`, or `"NEUTRAL"`.

Multi-TF confirmation is achieved through `backtesting/engine.js`, which builds a `validatingTrend` by downsampling every Nth candle to simulate a higher timeframe. This validating trend is passed to `generateSignal()` where it must match the current TF's trend direction.

Contains two helper methods:
- `filter(prices15m, prices1H, prices4H, pricesDaily)` — multi-timeframe trend evaluation
- `isEntryAllowed(trend, side)` — entry gate based on medium + long term trend

---

### `services/btc-filter.js`

BTC market condition analyzer. Computes KAMA slope, price position vs KAMA and EMA20, and return volatility. Scores on a [0, 100] scale.

Contains two unused gates:
- `blockAltcoinLongs(btcTrend)` — intended to block longs when BTC is bearish
- `blockAltcoinShorts(btcTrend)` — intended to block shorts when BTC is bullish

These gates are **not called** in the signal pipeline. The BTC filter currently only contributes to the confidence score.

---

### `services/confidence-engine.js`

Weighted composite scoring system with 4 components:

| Component | Weight | Score Source |
|-----------|--------|-------------|
| Regime | 30 | TRENDING=100, MEAN_REVERTING=40, RANDOM=10 |
| Trend | 25 | BULLISH/BEARISH=90, NEUTRAL=50 |
| Momentum | 25 | MACD direction + T3 slope magnitude |
| BTC Filter | 20 | Score from BTC filter |

Momentum thresholds are computed relative to current price (`Math.abs(t3Slope / currentPrice)`) so the same thresholds work across assets of vastly different price scales.

**Grades**: 90+ → A+, 80-89 → A, 70-79 → B, 70 → C, <70 → IGNORE (no trade)

The `shouldTrade(grade, score, multiplier)` method applies a TF-scaled threshold: when `multiplier > 1.0`, the C threshold is raised (e.g., 1.4× for 1h = score must be ≥ 98 to pass as C). Grades A+, A, and B always pass regardless of multiplier.

---

### `services/risk-engine.js` — Used by backtesting

Position sizing based on fixed fractional risk:
```js
riskAmount = accountBalance × riskPercent / 100
positionSize = riskAmount / stopDistance
```

Regime-adjusted sizing: TRENDING/STRONG_TRENDING = 1.0×, WEAK_TRENDING = 0.5×, others = 0.25×.

Exported as a class (constructor). Used by `backtesting/engine.js` for position sizing during simulation.

---

### `services/exit-engine.js` — Used by backtesting

Three-layer exit management:
- **Chandelier Exit**: `recentHigh - 3×ATR` for longs, `recentLow + 3×ATR` for shorts
- **ATR Trail**: 2.5×ATR trailing stop from highest/lowest since entry
- **Partial Profit**: Take 50% off at 4R (4× risk), trail the remainder

Exported as a singleton. Used by `backtesting/engine.js` for exit management during simulation. Exit multipliers are TF-scaled via `config.timeframeScaling[tf].exitMultiplier` — shorter timeframes get tighter stops (e.g., 0.6× for 15m = chandelier 1.8, trail 1.5).

---

### `services/database.js` — NOT WIRED

Persistence layer using `better-sqlite3` with automatic in-memory fallback. Tables:

| Table | Columns |
|-------|---------|
| `signals` | id, pair, side, entry_price, confidence_score, grade, regime, hurst, timestamp |
| `trades` | id, signal_id, pair, side, entry/exit price, position_size, pnl, exit_reason, timestamps |
| `regimes` | id, pair, regime, hurst, dfa, confidence, timestamp |
| `performance` | id, total_trades, win_rate, profit_factor, sharpe_ratio, sortino_ratio, max_drawdown, cagr, total_return, timestamp |

Exported as a class (constructor). `better-sqlite3` is not listed in `package.json` — will fall back to in-memory if not globally installed.

---

### `services/exchange/kraken.js`

Kraken spot CCXT adapter. Exposes:

```js
fetchOHLCV(symbol, timeframe, limit)    // → [{open, high, low, close, volume}]
fetchFundingRate(symbol)                 // → null (not available on Kraken spot)
fetchOpenInterest(symbol)                // → null (not available on Kraken spot)
placeOrder(symbol, type, side, amount, price)
cancelOrder(orderId, symbol)
fetchBalance()
```

`placeOrder`, `cancelOrder`, and `fetchBalance` are available but **not currently called** — the system is signal-only with no automated execution.

---

## Backtesting

### `backtesting/engine.js`

Iterates over historical OHLCV data slice by slice, calling the strategy's `generateSignal()` at each step. Simulates position entry/exit with configurable commission (0.1%) and slippage (0.1%). Applies TF-scaled exit multipliers from `config.timeframeScaling`. Builds validating trend from downsampled candles for multi-TF confirmation.

### `backtesting/metrics.js`

Computes from trade list:

| Metric | Formula |
|--------|---------|
| Win Rate | winners / total × 100 |
| Profit Factor | gross profit / gross loss |
| Sharpe Ratio | (avg return / std dev) × √252 |
| Sortino Ratio | (avg return / downside dev) × √252 |
| Max Drawdown | peak-to-trough % |
| CAGR | (final/initial)^(1/years) - 1 |
| Total Return | (final - initial) / initial × 100 |

### `backtesting/run.js` — CLI entry point

```bash
npm run backtest -- --symbol=BNB/USDT --timeframe=1d --limit=500 --balance=10000
```

| Flag | Default | Description |
|------|---------|-------------|
| `--symbol` | `BCH/USDT` | Trading pair to backtest |
| `--timeframe` | `4h` | Candle timeframe (`15m`, `1h`, `4h`, `1d`) |
| `--limit` | `1500` | Number of candles to fetch (min 201) |
| `--balance` | `10000` | Starting account balance |

### `backtesting/optimize.js` — Multi-TF parameter sweep

Runs all parameter combinations across multiple timeframes in parallel (one worker per backtest). Aggregates results into a cross-TF summary.

```bash
node backtesting/optimize.js --symbol=BNB/USDT --timeframes=15m,1h,4h,1d --sweep=all --limit=500
```

| Flag | Default | Description |
|------|---------|-------------|
| `--symbol` | `BCH/USDT` | Trading pair |
| `--timeframes` | `1d` | Comma-separated TFs to test |
| `--sweep` | `all` | Which group: `kama`, `t3`, `vwmacd`, `regime`, `exits`, `confidence`, `all` |
| `--limit` | `500` | Candles per TF |

**Sweep groups** — each tests a range of values for one indicator while holding others at config defaults:

| Group | Parameters tested |
|-------|-------------------|
| `kama` | 10 combos: period ∈ {5,8,10,12,15,20} × fast ∈ {1,2,3} × slow ∈ {20,25,30,35,40,50,60} |
| `t3` | 10 combos: period ∈ {5,6,8,10,12} × volumeFactor ∈ {0.5,0.6,0.7,0.8} |
| `vwmacd` | 8 combos: fast/slow/signal ∈ standard MACD variants |
| `regime` | 7 combos: trendingThreshold ∈ {0.5–0.6} × randomLower ∈ {0.4–0.45} |
| `exits` | 8 combos: chandelier × trail × partialTP × tpTarget × slTarget |
| `confidence` | 7 combos: C threshold ∈ {50–70} × regime weight × momentum weight |

**Composite scoring** (for ranking): `sharpe×0.4 + sortino×0.3 + profitFactor×0.2 − maxDrawdown×0.1`

**Cross-TF aggregation**: Results are grouped by parameter set, averaged across all timeframes, and ranked by average score. The summary shows the top 15 most consistent parameter combos and which TFs they appeared in.

### `backtesting/optimize-worker.js`

Single-backtest worker spawned by `optimize.js`. Reads pre-fetched OHLCV from a temp JSON file, applies config overrides via deep-merge, runs one backtest, and outputs JSON metrics to stdout.

---

## Web API — `server.js`

Express server on port 3001. All requests routed to the Kraken exchange.

### `GET /api/pairs`
Returns the list of 13 supported crypto trading pairs.

### `GET /api/regime/:pair`
Fetches 300 hourly candles from Kraken. Returns `{ pair, regime, hurst, dfa, confidence }`.

### `GET /api/signal/:pair`
Fetches live data, runs full signal pipeline with BTC filter and 4h cross-validation. Returns `{ pair, signal, regime, timeframe, lastPrice, timestamp }`. Signal is `null` when no trade conditions are met.

### `GET /api/fractal/:pair`
Fetches all 4 timeframes (15m, 1h, 4h, 1d) in parallel from Kraken. Runs the full signal pipeline on each and returns a combined result with confluence stats.

```json
{
  "pair": "BTC/USDT",
  "timeframes": {
    "15m": { "signal": { "type": "SELL", ... }, "regime": { ... }, "lastPrice": 63947.3 },
    "1h":  { "signal": null, "regime": { ... }, "lastPrice": 64027.7 },
    "4h":  { "signal": null, "regime": { ... }, "lastPrice": 64100.0 },
    "1d":  { "signal": null, "regime": { ... }, "lastPrice": 63800.0 }
  },
  "confluence": { "bullishCount": 0, "bearishCount": 1, "neutralCount": 3 },
  "btcFilter": { "btcTrend": "BULLISH", "score": 82 },
  "dataSource": "Kraken",
  "timestamp": "2026-06-18T11:30:43.217Z"
}
```

### `GET /api/status`
Health check — returns `{ status: "ok", pairs: 13, exchange: "Kraken" }`.

---

## React Frontend — `client/`

Vite + React 18 + TypeScript SPA with dark theme (3-layer depth: slate-950 background → gray-900 cards → slate-800 elevated surfaces).

### Components

| Component | File | Description |
|-----------|------|-------------|
| **App** | `src/App.tsx` | Root: pair selector, refresh button, 180s auto-refresh, toast notifications |
| **PairSelector** | `src/components/PairSelector.tsx` | Searchable dropdown with keyboard nav, click-outside close |
| **FractalSignals** | `src/components/FractalSignals.tsx` | 2×2 grid container header (pair, BTC badge, confluence label), confluence bar, footer |
| **TimeframeCard** | `src/components/TimeframeCard.tsx` | Individual card: signal badge, sparkline, entry/SL/TP prices, confidence meter, breakdown, Hurst/DFA footer |
| **ConfidenceMeter** | `src/components/ConfidenceMeter.tsx` | SVG ring gauge (score 0-100, scalable size) with letter grade |
| **ComponentBreakdown** | `src/components/ComponentBreakdown.tsx` | Horizontal stacked bar + legend of weighted score components |
| **Sparkline** | `src/components/Sparkline.tsx` | Recharts SVG area sparkline (buy=green, sell=red) |
| **Skeleton** | `src/components/Skeleton.tsx` | Loading skeleton, responsive grid (1-col mobile, 2-col desktop) with sparkline + breakdown placeholders |
| **ErrorBoundary** | `src/components/ErrorBoundary.tsx` | Class-based error boundary with try-again button |
| **RegimeBadge** | `src/components/RegimeBadge.tsx` | Color-coded regime pill (**not currently used** — inline badge in TimeframeCard is used instead) |

### Data & Utilities

| File | Description |
|------|-------------|
| `src/api.ts` | `fetchPairs()`, `fetchFractal()`, TypeScript interfaces (FractalData, TimeframeData, Signal, Confidence, Regime, etc.) |
| `src/useMediaQuery.ts` | React hook for responsive breakpoint matching |

### Features
- Pair search with filtered dropdown (13 Kraken pairs)
- Per-timeframe signal badges (BUY/SELL) with glow effect
- Adaptive TP/SL display with percentage change from entry
- Regime pill (TRENDING/RANDOM/MEAN_REVERTING/UNKNOWN) per card
- Sparkline area chart per card when signal exists
- Confidence ring gauge (score + letter grade) per card
- Score breakdown bar (weighted component visualization)
- Confluence bar + label (e.g. "STRONG BULLISH (3/4)")
- BTC market condition badge
- 3-minute auto-refresh
- Animated loading spinner on manual Refresh
- Error state with warning icon + retry button
- Responsive layout (stacked on mobile, side-by-side on desktop)
- Dark theme (slate-950 / gray-900 / slate-800) with Inter font
- Toast notifications for signal updates and errors

---

## Setup & Running

### Prerequisites
- Node.js ≥ 18
- npm

### Installation

```bash
npm run install:all
```

### Development

```bash
npm run dev
```

Starts both:
- **API server** on `http://localhost:3001`
- **Vite dev server** on `http://localhost:5173` (proxies /api to Express)

### Production Build

```bash
npm run build --prefix client
npm run server
```

Netlify builds and deploys the client. The API is proxied to `https://frat-signals.onrender.com` (configured in `netlify.toml`).

---

## Configuration — `config.js`

All tunable parameters are centralized in `config.js`. No source files need to be touched to adjust indicators, thresholds, exits, or backtesting settings.

### Config sections

| Section | Description |
|---------|-------------|
| `kama` | KAMA indicator: period, fast, slow |
| `t3` | T3 indicator: period, volumeFactor |
| `vwmacd` | VW-MACD indicator: fast, slow, signal |
| `atr` | ATR period |
| `regime` | Hurst/DFA thresholds, lag settings, DFA boosts |
| `timeframeFilter` | Trend evaluation periods (SHORT/MEDIUM/LONG) |
| `btcFilter` | BTC market filter weights and thresholds |
| `confidence` | Component weights (regime/trend/momentum/btc) and grade thresholds |
| `risk` | Risk percent, position size limits, regime multipliers |
| `adaptiveTargets` | TP/SL ATR multipliers per regime strength |
| `exit` | Chandelier multiplier, trail multiplier, partial TP R-multiple |
| `timeframeScaling` | Per-TF multipliers (see below) |
| `backtest` | Initial balance, commission, slippage, warmup, downsample factors |

### Timeframe Scaling — `config.timeframeScaling`

Per-timeframe multipliers that tighten rules for shorter, noisier timeframes. Applied in `trend.js` via `options.timeframe`.

| TF | Confidence Mult. | Regime Check | Exit Mult. | Min Trend Strength | Effect |
|----|-------------------|--------------|------------|-------------------|--------|
| **1d** | 1.0× (baseline) | yes | 1.0× | 0 | No changes — baseline behavior |
| **4h** | 1.2× | yes | 0.85× | 1 | Raise grade threshold 20%, tighter stops |
| **1h** | 1.4× | yes | 0.7× | 1 | Raise grade threshold 40%, tighter stops |
| **15m** | 1.6× | yes | 0.6× | 2 | Raise grade threshold 60%, tightest stops, require strong trend |

The exit multiplier scales `config.exit.chandelierMultiplier` and `config.exit.trailMultiplier`. For example, with baseline chandelier=3 and 1h multiplier=0.7, the effective chandelier becomes 2.1.

### Backtesting downsample factors — `config.backtest.timeframeDownsample`

Simulates higher-TF validating trends by taking every Nth candle:

| TF | Downsample | Validates against |
|----|------------|-------------------|
| 1d | 0 (skip) | No higher TF available |
| 4h | 4 | → 1D trend |
| 1h | 4 | → 4H trend |
| 15m | 4 | → 1H trend |

---

## Code Conventions

- **Exports**: Stateless service modules export singleton instances (`module.exports = new ClassName()`). Stateful modules export classes (`RiskEngine`, `SignalDatabase`, `KrakenExchange`).
- **Error handling**: Exchange methods use try/catch and return null on failure. API endpoints return 400/500 JSON errors.
- **Null returns**: Indicator methods return `null` on insufficient data rather than throwing. `generateSignal` returns `null` when conditions aren't met.
- **Rounding**: Prices, scores, and sizes rounded to reasonable precision (2-4 decimal places).
- **No logging library**: Uses `console.error` for exchange errors; `console.log` for server startup.
