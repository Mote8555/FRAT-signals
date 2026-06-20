# TODO.md - FRAT Signals Development Plan

## Project Goal

Build a production-grade cryptocurrency trading engine optimized for:

- Bitcoin
- Ethereum
- Major Altcoins
- Perpetual Futures
- Spot Markets

Target objectives:

- Improve signal quality
- Reduce false signals during ranging markets
- Adapt to crypto volatility
- Integrate crypto-native metrics
- Support automated execution

---

# Phase 1 - Core Architecture Refactor

## Task 1.1 - Create Market Regime Engine

### Why

Current algorithm assumes trend-following conditions always exist.

Crypto frequently alternates between:

- Trending
- Mean-reverting
- Random walk
- Parabolic
- Panic selloffs

### Deliverables

Create:

```text
services/
 ├── regime-engine.js
```

Functions:

```js
calculateHurst();
calculateDFA();
detectRegime();
```

Output:

```js
{
    regime: "TRENDING",
    hurst: 0.62,
    confidence: 87
}
```

### Rules

```text
H > 0.55
TRENDING

0.45 <= H <= 0.55
RANDOM

H < 0.45
MEAN_REVERTING
```

### Signal Integration

Reject all trades when:

```js
regime !== "TRENDING";
```

---

# Phase 2 - Multi-Timeframe Analysis

## Task 2.1 - HTF Trend Filter

### Why

Most failed signals occur against higher timeframe trend.

### Deliverables

Create:

```text
services/
 ├── timeframe-filter.js
```

Evaluate:

- 15m
- 1H
- 4H
- Daily

Output:

```js
{
   shortTermTrend: "BULLISH",
   mediumTermTrend: "BULLISH",
   longTermTrend: "BULLISH"
}
```

### Entry Requirement

BUY only if:

```text
1H Bullish
AND
4H Bullish
```

SELL only if:

```text
1H Bearish
AND
4H Bearish
```

---

# Phase 3 - Bitcoin Market Filter

## Task 3.1 - BTC Dominance Filter

### Why

Altcoins follow Bitcoin.

A perfect altcoin signal often fails because BTC moves against it.

### Deliverables

Create:

```text
services/
 ├── btc-filter.js
```

Monitor:

- BTC Trend
- BTC Momentum
- BTC Volatility

Output:

```js
{
    btcTrend: "BULLISH",
    score: 82
}
```

### Rules

If BTC is bearish:

```js
blockAltcoinLongs();
```

If BTC is bullish:

```js
blockAltcoinShorts();
```

---

# Phase 4 - Replace Forex Volume Logic

## Task 4.1 - Remove VPCI Dependency

### Problem

VPCI was designed around markets where volume behavior differs.

Crypto provides better data.

### Remove

```js
calculateVPCI();
```

from signal scoring.

---

## Task 4.2 - Add Open Interest Analysis

Create:

```text
services/
 ├── open-interest.js
```

Track:

- OI Rising
- OI Falling
- OI Divergence

Output:

```js
{
    trend: "RISING",
    strength: 71
}
```

Signal boost:

```text
Price Up + OI Up
Bullish

Price Down + OI Up
Bearish
```

---

## Task 4.3 - Funding Rate Analysis

Create:

```text
services/
 ├── funding-rate.js
```

Fetch:

- Binance Funding
- Bybit Funding

Output:

```js
{
   fundingRate: 0.012,
   sentiment: "BULLISH"
}
```

Use as confirmation layer.

---

# Phase 5 - Confidence Engine Rewrite

## Task 5.1 - Remove Fixed Confidence

Current:

```js
50 + 20 + 15 + 15;
```

is arbitrary.

---

## Task 5.2 - Create Weighted Scoring Engine

Create:

```text
services/
 ├── confidence-engine.js
```

Score components:

| Component     | Weight |
| ------------- | ------ |
| Regime        | 25     |
| Trend         | 20     |
| Momentum      | 20     |
| BTC Filter    | 15     |
| Open Interest | 10     |
| Funding       | 10     |

Output:

```js
{
   score: 88,
   grade: "A"
}
```

Grades:

```text
90-100 A+
80-89  A
70-79  B
60-69  C
<60    Ignore
```

---

# Phase 6 - Dynamic Position Sizing

## Task 6.1 - Risk Engine

Create:

```text
services/
 ├── risk-engine.js
```

Inputs:

```js
accountBalance;
riskPercent;
ATR;
stopDistance;
```

Output:

```js
{
    positionSize: 0.42,
    riskAmount: 50
}
```

Formula:

```text
Risk per Trade = 1%
```

Default.

---

# Phase 7 - Adaptive TP/SL

## Task 7.1 - Dynamic Targets

Current:

```js
SL = ATR * 1.5;
TP = ATR * 3;
```

Replace with regime-aware targets.

### Trending

```text
SL = 2 ATR
TP = 5 ATR
```

### Strong Trend

```text
SL = 2 ATR
TP = 8 ATR
```

### Weak Trend

```text
SL = 1.5 ATR
TP = 2.5 ATR
```

---

# Phase 8 - Chandelier Exit Upgrade

## Task 8.1 - Trailing Exit System

Create:

```text
services/
 ├── exit-engine.js
```

Features:

- Chandelier Exit
- ATR Trail
- Partial Profit Taking

Logic:

```text
Take 50% at 3R

Trail remainder
```

---

# Phase 9 - Backtesting Framework

## Task 9.1 - Historical Testing Engine

Create:

```text
backtesting/
 ├── engine.js
 ├── metrics.js
```

Metrics:

- Win Rate
- Profit Factor
- Sharpe Ratio
- Sortino Ratio
- Max Drawdown
- CAGR

Output:

```js
{
    winRate: 48.2,
    profitFactor: 1.92,
    maxDrawdown: 11.5
}
```

---

# Phase 10 - Exchange Integration

## Task 10.1 - CCXT Integration

Install:

```bash
npm install ccxt
```

Create:

```text
services/
 ├── exchange/
 │   ├── binance.js
 │   ├── bybit.js
 │   ├── kucoin.js
```

Functions:

```js
fetchOHLCV();
fetchFundingRates();
fetchOpenInterest();
placeOrder();
cancelOrder();
```

---

# Phase 11 - Signal Database

## Task 11.1 - Trade Journal

Store:

```text
signals
entries
exits
performance
```

Tables:

```text
signals
trades
regimes
performance
```

---

# Phase 12 - Machine Learning Layer (Optional)

## Task 12.1 - Signal Quality Model

Collect:

- Regime
- ATR
- Hurst
- Funding
- OI
- Trend Score

Train model:

```text
XGBoost
Random Forest
LightGBM
```

Predict:

```text
Probability of Success
```

Instead of simple BUY/SELL.

---

# Success Criteria

The system should:

✓ Trade only trending markets

✓ Filter bad conditions using Hurst/DFA

✓ Respect Bitcoin direction

✓ Use Open Interest and Funding Rates

✓ Support multi-timeframe confirmation

✓ Produce confidence-scored signals

✓ Support automated execution

✓ Maintain profit factor > 1.5

✓ Keep max drawdown < 15%

✓ Support Binance and Bybit futures

---

# Final Architecture

```text
Price Data
     │
     ▼
Regime Engine (Hurst/DFA)
     │
     ▼
Trend Engine (KAMA/T3)
     │
     ▼
Momentum Engine (VW-MACD)
     │
     ▼
BTC Filter
     │
     ▼
Funding Analysis
     │
     ▼
Open Interest Analysis
     │
     ▼
Confidence Engine
     │
     ▼
Risk Engine
     │
     ▼
Execution Engine
```
