# FRAT Signals — Fractal Regime-Adaptive Trading System

A production-grade cryptocurrency trading engine using a fractal regime-adaptive methodology. Designed for Bitcoin, Ethereum, and major altcoins via the Kraken exchange.

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
├── trend.js                         # Core algorithm: indicators + signal generation
├── server.js                        # Express API server (port 3001, Kraken)
├── package.json                     # Root dependencies + dev scripts
├── program.md                       # This file
│
├── services/
│   ├── regime-engine.js             # Hurst exponent, DFA, regime detection
│   ├── timeframe-filter.js          # Multi-timeframe KAMA trend filter
│   ├── btc-filter.js                # Bitcoin market condition filter
│   ├── confidence-engine.js         # Weighted component scoring + grade
│   ├── risk-engine.js               # Position sizing (1% risk)
│   ├── exit-engine.js               # Chandelier exit + trailing + partial TP
│   ├── database.js                  # SQLite trade journal (with in-memory fallback)
│   └── exchange/
│       └── kraken.js                # CCXT Kraken spot wrapper
│
├── backtesting/
│   ├── engine.js                    # Historical simulation engine
│   └── metrics.js                   # Performance statistics (Sharpe, Sortino, DD, CAGR)
│
└── client/
    ├── package.json                 # Vite + React dependencies
    ├── vite.config.js               # Dev server with /api proxy to Express
    ├── index.html                   # SPA entry point
    └── src/
        ├── main.jsx                 # ReactDOM entry
        ├── App.jsx                  # Root component: pair selector, auto-refresh
        ├── api.js                   # Fetch wrappers for REST endpoints
        └── components/
            ├── PairSelector.jsx       # Trading pair dropdown
            ├── FractalSignals.jsx     # 2×2 grid container + confluence bar + footer
            ├── TimeframeCard.jsx      # Individual timeframe card
            ├── SignalCard.jsx         # (legacy) Single-timeframe display
            ├── RegimeBadge.jsx        # Color-coded regime pill
            ├── ConfidenceMeter.jsx    # SVG ring gauge with score + grade
            └── ComponentBreakdown.jsx # Stacked bar of weighted components
```

---

## Core Algorithm — `trend.js`

The `FRATAlgorithm` class is the system's central orchestrator. It imports all service modules and runs the signal pipeline.

### Indicators

| Indicator | Role | Parameters |
|-----------|------|------------|
| **KAMA** (Kaufman's Adaptive Moving Average) | Baseline trend filter | period=10, fast=2, slow=30 |
| **T3** (Tillson's T3 Moving Average) | Smoother trend confirmation | period=8, volumeFactor=0.7 |
| **VW-MACD** (Volume-Weighted MACD) | Momentum + volume combo | fast=12, slow=26, signal=9 |
| **ATR** (Average True Range) | Volatility measurement | period=14 |

### Signal Generation — `generateSignal(pair, candleData)`

Entry conditions (all must pass):

1. **Regime** → must be `"TRENDING"` (Hurst > 0.55)
2. **Timeframe trend** → must not be `"NEUTRAL"`
3. **Momentum** → VW-MACD line > signal line (for BUY), reverse for SELL
4. **KAMA position** → price must be on correct side of KAMA
5. **ATR proximity** → price within 1 ATR of KAMA
6. **T3 slope** → positive for BUY, negative for SELL
7. **Confidence** → weighted score must grade ≥ 60 (not "IGNORE")

### Adaptive TP/SL — `getAdaptiveTargets(atr, regime)`

| Regime Strength | Stop Loss | Take Profit |
|-----------------|-----------|-------------|
| STRONG_TRENDING (confidence > 80) | 2 × ATR | 8 × ATR |
| TRENDING (confidence > 60) | 2 × ATR | 5 × ATR |
| WEAK_TRENDING | 1.5 × ATR | 2.5 × ATR |
| Default | 1.5 × ATR | 3 × ATR |

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

Evaluates trend using KAMA slope and price position relative to period average. Scores on three axes (SHORT=20, MEDIUM=60, LONG=120 periods) and classifies as BULLISH/BEARISH/NEUTRAL.

**Entry gate**: BUY only if medium AND long term both BULLISH. SELL only if both BEARISH.

---

### `services/btc-filter.js`

BTC market condition analyzer. Computes KAMA slope, price position vs KAMA and EMA20, and return volatility. Scores on a [0, 100] scale.

**Rules**:
- BTC BEARISH → block altcoin longs
- BTC BULLISH → block altcoin shorts

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

**Grades**: 90+ → A+, 80-89 → A, 70-79 → B, 60-69 → C, <60 → IGNORE (no trade)

---

### `services/risk-engine.js`

Position sizing based on fixed fractional risk:

```js
riskAmount = accountBalance × riskPercent / 100
positionSize = riskAmount / stopDistance
```

Regime-adjusted sizing: TRENDING/STRONG_TRENDING = 1.0×, WEAK_TRENDING = 0.5×, others = 0.25×.

---

### `services/exit-engine.js`

Three-layer exit management:
- **Chandelier Exit**: `recentHigh - 3×ATR` for longs, `recentLow + 3×ATR` for shorts
- **ATR Trail**: 2×ATR trailing stop from highest/lowest since entry
- **Partial Profit**: Take 50% off at 3R (3× risk), trail the remainder

---

### `services/database.js`

Persistence layer using `better-sqlite3` with automatic in-memory fallback. Tables:

| Table | Columns |
|-------|---------|
| `signals` | id, pair, side, entry_price, confidence_score, grade, regime, hurst, timestamp |
| `trades` | id, signal_id, pair, side, entry/exit price, position_size, pnl, exit_reason, timestamps |
| `regimes` | id, pair, regime, hurst, dfa, confidence, timestamp |
| `performance` | id, total_trades, win_rate, profit_factor, sharpe_ratio, sortino_ratio, max_drawdown, cagr, total_return, timestamp |

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

---

## Backtesting — `backtesting/`

### `backtesting/engine.js`

Iterates over historical OHLCV data slice by slice, calling the strategy's `generateSignal()` at each step. Simulates position entry/exit with configurable commission (0.1%) and slippage (0.1%). Collects all trades and passes them to the metrics calculator.

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

---

## Web API — `server.js`

Express server on port 3001. All requests routed to the Kraken exchange.

### `GET /api/pairs`
Returns the list of 13 supported crypto trading pairs.

### `GET /api/regime/:pair`
Fetches 300 hourly candles from Kraken. Returns `{ pair, regime, hurst, dfa, confidence }`.

### `GET /api/signal/:pair`
Fetches live data, runs full signal pipeline. Returns `{ pair, signal, regime, timeframe, lastPrice, timestamp }`. Signal is `null` when no trade conditions are met.

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

Vite + React SPA with dark theme. Features:
- **Pair Selector**: Dropdown with 13 Kraken pairs
- **Signal Card**: BUY/SELL badge, entry price, SL/TP with % change, regime strength, Hurst/DFA
- **Regime Badge**: Color-coded pill (green=TRENDING, yellow=RANDOM, red=MEAN_REVERTING)
- **Confidence Meter**: SVG ring gauge (score 0-100, scalable via `size` prop) with letter grade
- **Component Breakdown**: Horizontal stacked bar showing each weighted component
- **Data Source Footer**: Shows "Data: Kraken" on FractalSignals
- **Auto-Refresh**: Polls API every 60 seconds
- **Refresh Button**: Manual trigger
- **Fractal View**: 2×2 grid showing all 4 timeframes simultaneously
- **Confluence Bar**: Aggregated signal alignment (e.g., "2/4 bullish")

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

---

## Configuration

### Risk Parameters (in code)
- `riskPercent`: 1.0 (default, change in `trend.js` constructor → `new RiskEngine({ riskPercent })`)
- Min/max position sizes: 0.001 / 10.0 (in `RiskEngine` constructor)

### Confidence Weights
- **Kraken Spot**: Regime: 30, Trend: 25, Momentum: 25, BTC Filter: 20

---

## Code Conventions

- **Exports**: Service modules export singleton instances (`module.exports = new ClassName()`) where stateless; constructors exported where stateful (`RiskEngine`, `SignalDatabase`, `KrakenExchange`).
- **Error handling**: All exchange methods use try/catch and return null on failure. API endpoints return 400/500 JSON errors.
- **Null returns**: Indicator methods return `null` on insufficient data rather than throwing. `generateSignal` returns `null` when conditions aren't met.
- **Rounding**: Prices, scores, and sizes are rounded to reasonable precision (2-4 decimal places).
- **No logging library**: Uses `console.error` for exchange errors; console.log for server startup.
