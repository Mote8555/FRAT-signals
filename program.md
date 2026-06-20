# FRAT Signals — Fractal Regime-Adaptive Trading System

A production-grade cryptocurrency and forex trading engine using a fractal regime-adaptive methodology. Designed for Bitcoin, Ethereum, major altcoins, and major forex pairs.

## Architecture Overview

```
               ┌──────────────────────────────────┐
               │        Market Type Router         │
               │  (crypto → Binance, forex → Yahoo)│
               └──────┬─────────────────────┬─────┘
                      │                     │
              ┌───────▼───────┐     ┌───────▼───────┐
              │  Binance API   │     │  Yahoo Finance  │
              │  (crypto)      │     │  (forex)        │
              └───────┬───────┘     └───────┬───────┘
                      │                     │
              ┌───────┼─────────────────────┼───────┐
              ▼       ▼                     ▼       ▼
         ┌────────┐ ┌────────┐        ┌────────┐ ┌────────┐
         │ 15m    │ │ 1h     │        │ 4h     │ │ 1d     │
         │ OHLCV  │ │ OHLCV  │   ...  │ OHLCV  │ │ OHLCV  │
         └───┬────┘ └───┬────┘        └───┬────┘ └───┬────┘
             │          │                  │          │
             ▼          ▼                  ▼          ▼
    ┌────────────────── INDEPENDENT ANALYSIS PER TIMEFRAME ────────────┐
    │  Regime Engine → Timeframe Filter → Confidence (adjusted        │
    │  weights per market) → Signal Decision (KAMA + T3 + VW-MACD     │
    │  + ATR) + Adaptive TP/SL                                        │
    │                                                                 │
    │  Crypto only: BTC Filter → Open Interest → Funding Rate         │
    └──────────────────────────────────────────────────────────────────┘
             │          │                  │          │
             ▼          ▼                  ▼          ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                     Fractal Confluence                           │
    │        (bullishCount / bearishCount / neutralCount)              │
    └────────────────────────────┬────────────────────────────────────┘
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
├── trend.js                         # Core algorithm: indicators + signal generation (crypto + forex)
├── server.js                        # Express API server (port 3001, dual exchange routing)
├── package.json                     # Root dependencies + dev scripts
├── program.md                       # This file
│
├── services/
│   ├── regime-engine.js             # Hurst exponent, DFA, regime detection
│   ├── timeframe-filter.js          # Multi-timeframe KAMA trend filter
│   ├── btc-filter.js                # Bitcoin market condition filter
│   ├── open-interest.js             # Open interest trend & divergence
│   ├── funding-rate.js              # Perpetual futures funding rate analysis
│   ├── confidence-engine.js         # Weighted component scoring + grade
│   ├── risk-engine.js               # Position sizing (1% risk)
│   ├── exit-engine.js               # Chandelier exit + trailing + partial TP
│   ├── database.js                  # SQLite trade journal (with in-memory fallback)
│   └── exchange/
│       ├── binance.js               # CCXT Binance futures wrapper (crypto)
│       ├── yahoo.js                 # Yahoo Finance OHLCV provider (forex)
│       └── bybit.js                 # CCXT Bybit futures wrapper
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
        ├── App.jsx                  # Root component: market tabs (Crypto/Forex), pair selector, auto-refresh
        ├── api.js                   # Fetch wrappers for REST endpoints (supports ?market= param)
        └── components/
            ├── PairSelector.jsx       # Trading pair dropdown (filtered by active market tab)
            ├── FractalSignals.jsx     # 2×2 grid container + confluence bar + data source footer
            ├── TimeframeCard.jsx      # Individual timeframe card with ConfidenceMeter + ComponentBreakdown
            ├── SignalCard.jsx         # (legacy) Single-timeframe display
            ├── RegimeBadge.jsx        # Color-coded regime pill
            ├── ConfidenceMeter.jsx    # SVG ring gauge with score + grade (accepts size prop)
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

### Supported Pairs (by market type)

- **Crypto** (15): BTC/USDT, ETH/USDT, SOL/USDT, BNB/USDT, XRP/USDT, ADA/USDT, DOGE/USDT, AVAX/USDT, DOT/USDT, LINK/USDT, MATIC/USDT, UNI/USDT, ATOM/USDT, LTC/USDT, FIL/USDT
- **Forex** (7 majors): EUR/USD, GBP/USD, USD/JPY, AUD/USD, USD/CAD, NZD/USD, USD/CHF

API helpers: `getPairs(market)` returns the appropriate list; `isForex(pair)` returns true for forex pairs.

### Signal Output

```js
{
  pair: "BTC/USDT",
  type: "BUY",
  entryPrice: 64027.70,
  stopLoss: 63983.70,        // adaptive to regime
  takeProfit: 64247.70,      // adaptive to regime
  confidence: {
    score: 80,
    grade: "A",
    components: [
      { name: "regime", score: 100, weight: 25 },
      { name: "trend", score: 90, weight: 20 },
      { name: "momentum", score: 75, weight: 20 },
      { name: "btcFilter", score: 85, weight: 15 },
      { name: "openInterest", score: 30, weight: 10 },
      { name: "funding", score: 40, weight: 10 }
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

### `services/open-interest.js`

Open interest trend detector. Compares first-half vs second-half averages over a 10-point window. Also detects price/OI divergences:

- Price up + OI down → BEARISH_DIVERGENCE (weakening trend)
- Price down + OI up → BULLISH_DIVERGENCE (accumulation)

---

### `services/funding-rate.js`

Perpetual futures funding rate sentiment analyzer.

| Rate | Sentiment |
|------|-----------|
| > 0.0001 | BULLISH (longs paying shorts) |
| < -0.0001 | BEARISH (shorts paying longs) |
| Between | NEUTRAL |
| \|rate\| > 0.001 | EXTREME signal (LONG/SHORT_DOMINANT) |

---

### `services/confidence-engine.js`

Dual-weight composite scoring system. The `score()` function accepts a `marketType` parameter (`"crypto"` or `"forex"`) to select the appropriate weight set.

**Crypto weights** (same as original):

| Component | Weight | Score Source |
|-----------|--------|-------------|
| Regime | 25 | TRENDING=100, MEAN_REVERTING=40, RANDOM=10 |
| Trend | 20 | BULLISH/BEARISH=90, NEUTRAL=50 |
| Momentum | 20 | MACD direction + T3 slope magnitude |
| BTC Filter | 15 | Score from BTC filter |
| Open Interest | 10 | OI trend strength |
| Funding | 10 | Sentiment + extremity |

**Forex weights** (redistributed — no BTC filter, OI, or funding available):

| Component | Weight | Score Source |
|-----------|--------|-------------|
| Regime | 30 | TRENDING=100, MEAN_REVERTING=40, RANDOM=10 |
| Trend | 30 | BULLISH/BEARISH=90, NEUTRAL=50 |
| Momentum | 25 | MACD direction + T3 slope magnitude (relative to price) |
| BTC Filter | 0 | N/A for forex |
| Open Interest | 0 | N/A for forex |
| Funding | 0 | N/A for forex |

**Momentum thresholds** are computed relative to current price (`Math.abs(t3Slope / currentPrice)`) so the same thresholds work across assets of vastly different price scales (BTC ~$60k vs EUR/USD ~1.1).

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

### `services/exchange/binance.js` & `services/exchange/bybit.js`

Uniform CCXT adapters. Both expose the same async API:

```js
fetchOHLCV(symbol, timeframe, limit)    // → [{open, high, low, close, volume}]
fetchFundingRate(symbol)                 // → number or null
fetchOpenInterest(symbol)                // → number or null
placeOrder(symbol, type, side, amount, price)
cancelOrder(orderId, symbol)
fetchBalance()
```

Both default to futures (`defaultType: "future"`) with rate limiting.

### `services/exchange/yahoo.js`

Yahoo Finance OHLCV provider using the `yahoo-finance2` package. Used as the data source for forex pairs. Exposes a subset of the exchange API:

```js
fetchOHLCV(symbol, timeframe, limit)    // → [{open, high, low, close, volume}]
fetchFundingRate(symbol)                 // → null (not available for forex)
fetchOpenInterest(symbol)                // → null (not available for forex)
```

**Key behaviours**:
- Converts Yahoo Finance period1/period2 format to frame-based fetching matching the CCXT convention
- Supports 15m, 1h, 4h, and 1d timeframes
- 4h candles are aggregated from 1h data (since Yahoo does not provide native 4h for forex via this API)
- Returns volume in the same format as Binance for compatibility

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

Express server on port 3001. Routes requests to the appropriate exchange based on market type (crypto → Binance, forex → Yahoo Finance).

### `GET /api/pairs`
Returns the list of supported trading pairs. Accepts optional `?market=crypto` or `?market=forex` query parameter to filter. Default (no param) returns all pairs.

### `GET /api/regime/:pair`
Fetches 300 hourly candles from the appropriate exchange, runs regime detection. Returns `{ pair, regime, hurst, dfa, confidence, marketType, dataSource }`.

### `GET /api/signal/:pair`
Fetches live data, runs full signal pipeline. Returns `{ pair, signal, regime, timeframe, lastPrice, marketType, dataSource, timestamp }`. Signal is `null` when no trade conditions are met. Forex responses omit `btcFilter`.

### `GET /api/fractal/:pair`
Fetches all 4 timeframes (15m, 1h, 4h, 1d) in parallel from the appropriate exchange, runs the full signal pipeline on each, and returns a combined result with confluence stats.

**Crypto response**:
```json
{
  "pair": "BTC/USDT",
  "marketType": "crypto",
  "dataSource": "Binance",
  "timeframes": {
    "15m": { "signal": { "type": "SELL", ... }, "regime": { ... }, "lastPrice": 63947.3 },
    "1h":  { "signal": null, "regime": { ... }, "lastPrice": 64027.7 },
    "4h":  { "signal": null, "regime": { ... }, "lastPrice": 64100.0 },
    "1d":  { "signal": null, "regime": { ... }, "lastPrice": 63800.0 }
  },
  "confluence": { "bullishCount": 0, "bearishCount": 1, "neutralCount": 3 },
  "btcFilter": { "btcTrend": "BULLISH", "score": 82 },
  "timestamp": "2026-06-18T11:30:43.217Z"
}
```

**Forex response**:
```json
{
  "pair": "EUR/USD",
  "marketType": "forex",
  "dataSource": "Yahoo Finance",
  "timeframes": {
    "15m": { "signal": { "type": "BUY", ... }, "regime": { ... }, "lastPrice": 1.0842 },
    "1h":  { "signal": null, "regime": { ... }, "lastPrice": 1.0839 },
    "4h":  { "signal": null, "regime": { ... }, "lastPrice": 1.0845 },
    "1d":  { "signal": null, "regime": { ... }, "lastPrice": 1.0830 }
  },
  "confluence": { "bullishCount": 1, "bearishCount": 0, "neutralCount": 3 },
  "btcFilter": null,
  "timestamp": "2026-06-18T11:30:43.217Z"
}
```

Each timeframe is analyzed independently with its own candles. The `confluence` object counts how many timeframes agree on direction. `btcFilter` is only present for crypto pairs. Forex responses include `marketType: "forex"` and `dataSource: "Yahoo Finance"`.

### Frontend Components

The React SPA has two layers of components for signal display:

- **`FractalSignals`** — Top-level container showing the 2×2 grid of all 4 timeframes. Includes a confluence bar (colored by bullish/bearish ratio), the BTC filter badge (crypto only), and a dynamic data source footer. Wired as the main display in `App.jsx`.
- **`TimeframeCard`** — Individual card for one timeframe. Shows: timeframe label, color-coded regime pill, BUY/SELL badge (or "No signal"), entry price ± SL/TP with % distances, confidence score + grade (SVG ring gauge), component breakdown bar, and Hurst/DFA stats. Cards with active signals get a subtle colored border glow.
- **`SignalCard`** — (legacy) Single-timeframe card, retained for backward compatibility.

### `GET /api/status`
Health check — returns `{ status: "ok", pairs: { total: 22, crypto: 15, forex: 7 } }`.

---

**Note**: Pair parameter must be URL-encoded (e.g., `BTC%2FUSDT` for BTC/USDT). The fractal endpoint fetches ~1000 candles total across 4 timeframes per exchange request. Forex 4h candles are aggregated from 1h data server-side.

---

## React Frontend — `client/`

Vite + React SPA with dark theme. Features:
- **Market Tabs**: Crypto / Forex tab bar to switch between asset classes
- **Pair Selector**: Dropdown filtered by selected market tab (15 crypto pairs or 7 forex majors)
- **Signal Card**: BUY/SELL badge, entry price, SL/TP with % change, regime strength, Hurst/DFA
- **Regime Badge**: Color-coded pill (green=TRENDING, yellow=RANDOM, red=MEAN_REVERTING)
- **Confidence Meter**: SVG ring gauge (score 0-100, scalable via `size` prop) with letter grade
- **Component Breakdown**: Horizontal stacked bar showing each weighted component
- **Data Source Footer**: Shows "Data: Binance" or "Data: Yahoo Finance" on FractalSignals
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

Installs root dependencies (ccxt, express, cors, concurrently, yahoo-finance2) and client dependencies (react, recharts, vite).

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

## Data Flow

### Crypto flow
```
User selects Crypto tab → picks BTC/USDT
       │
       ▼
React frontend → GET /api/fractal/BTC%2FUSDT
       │
       ▼
Express server (isForex=false → Binance)
       │
       ├─→ Binance.fetchOHLCV("BTC/USDT", "15m", 300) ──┐
       ├─→ Binance.fetchOHLCV("BTC/USDT", "1h", 300)  ──┤
       ├─→ Binance.fetchOHLCV("BTC/USDT", "4h", 200)  ──┤  Promise.all
       └─→ Binance.fetchOHLCV("BTC/USDT", "1d", 200)  ──┘
       │                                                   
       ▼                    ┌──────────────────────────────┘
       │ For each timeframe:
       │   │ → RegimeEngine.detectRegime(closes)
       │   │ → FRATAlgorithm.generateSignal(candleData)
       │   │     ├── KAMA / T3 / VW-MACD / ATR calculation
       │   │     ├── Regime check (must be TRENDING)
       │   │     ├── Timeframe filter (must not be NEUTRAL)
       │   │     ├── BTC filter evaluation (once)
       │   │     ├── Confidence engine (crypto weights) scoring (must be ≥ 60)
       │   │     └── Adaptive SL/TP based on regime strength
       │   │
       ▼   ▼
JSON response → React renders FractalSignals (2×2 grid)
                      │
                      ├── TimeframeCard 15m
                      ├── TimeframeCard 1h
                      ├── TimeframeCard 4h
                      └── TimeframeCard 1d

Confluence bar: bullishCount/bearishCount/neutralCount
Data source footer: "Data: Binance"
```

### Forex flow
```
User selects Forex tab → picks EUR/USD
       │
       ▼
React frontend → GET /api/fractal/EUR%2FUSD
       │
       ▼
Express server (isForex=true → Yahoo Finance)
       │
       ├─→ Yahoo.fetchOHLCV("EUR/USD", "15m", 300) ──┐
       ├─→ Yahoo.fetchOHLCV("EUR/USD", "1h", 300)  ──┤
       ├─→ Yahoo.fetchOHLCV("EUR/USD", "4h", 200)  ──┤  Promise.all
       └─→ Yahoo.fetchOHLCV("EUR/USD", "1d", 200)  ──┘    (4h aggregated from 1h)
       │                                                   
       ▼                    ┌──────────────────────────────┘
       │ For each timeframe:
       │   │ → RegimeEngine.detectRegime(closes)
       │   │ → FRATAlgorithm.generateSignal(candleData)
       │   │     ├── KAMA / T3 / VW-MACD / ATR calculation
       │   │     ├── Regime check (must be TRENDING)
       │   │     ├── Timeframe filter (must not be NEUTRAL)
       │   │     ├── Confidence engine (forex weights) scoring (must be ≥ 60)
       │   │     └── Adaptive SL/TP based on regime strength
       │   │
       ▼   ▼
JSON response → React renders FractalSignals (2×2 grid)
                      │
                      ├── TimeframeCard 15m
                      ├── TimeframeCard 1h
                      ├── TimeframeCard 4h
                      └── TimeframeCard 1d

Confluence bar: bullishCount/bearishCount/neutralCount
Data source footer: "Data: Yahoo Finance"
```

---

## Configuration

### Risk Parameters (in code)
- `riskPercent`: 1.0 (default, change in `trend.js` constructor → `new RiskEngine({ riskPercent })`)
- Min/max position sizes: 0.001 / 10.0 (in `RiskEngine` constructor)

### Confidence Weights (in `services/confidence-engine.js`)
- **Crypto**: Regime: 25, Trend: 20, Momentum: 20, BTC Filter: 15, OI: 10, Funding: 10
- **Forex**: Regime: 30, Trend: 30, Momentum: 25, BTC Filter: 0, OI: 0, Funding: 0

### Exchange API Keys (in `server.js` or when instantiating exchanges)
Binance and Bybit adapters accept `{ apiKey, secret }` in constructor. Public endpoints (OHLCV, funding rates, OI) work without keys. Yahoo Finance requires no authentication for OHLCV data.

---

## Code Conventions

- **Exports**: Service modules export singleton instances (`module.exports = new ClassName()`) where stateless; constructors exported where stateful (`RiskEngine`, `SignalDatabase`, `BinanceExchange`, `BybitExchange`, `YahooFinanceProvider`).
- **Error handling**: All exchange methods use try/catch and return null on failure. API endpoints return 400/500 JSON errors.
- **Null returns**: Indicator methods return `null` on insufficient data rather than throwing. `generateSignal` returns `null` when conditions aren't met.
- **Rounding**: Prices, scores, and sizes are rounded to reasonable precision (2-4 decimal places).
- **No logging library**: Uses `console.error` for exchange errors; console.log for server startup.
