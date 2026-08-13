# FRAT Signals User Guide

Welcome to **FRAT Signals** — the Fractal Regime-Adaptive Trading System. This guide will help you understand how to use the application to analyze cryptocurrency markets and receive trading signals.

---

## Table of Contents

1. [What is FRAT Signals?](#what-is-frat-signals)
2. [Getting Started](#getting-started)
3. [Dashboard Overview](#dashboard-overview)
4. [How to Use the App](#how-to-use-the-app)
5. [Understanding Signals](#understanding-signals)
6. [Key Concepts](#key-concepts)
7. [Confidence Grades](#confidence-grades)
8. [Supported Trading Pairs](#supported-trading-pairs)
9. [Frequently Asked Questions](#frequently-asked-questions)
10. [Troubleshooting](#troubleshooting)

---

## What is FRAT Signals?

FRAT Signals is a **cryptocurrency trading signal dashboard** that analyzes digital assets across multiple timeframes simultaneously. It combines advanced market analysis techniques to provide you with bullish (BUY) and bearish (SELL) signals with confidence scores.

### Key Highlights

- **Multi-Timeframe Analysis**: Analyzes markets across four timeframes (15 minutes, 1 hour, 4 hours, and 1 day) independently
- **Regime Detection**: Identifies whether markets are trending, random, or mean-reverting using sophisticated mathematical models
- **Confidence Scoring**: Every signal includes a grade (A+, A, B, C) based on multiple factors
- **Adaptive Targets**: Stop-loss and take-profit levels automatically adjust based on market volatility
- **Live Data**: Real-time price data streams from the Kraken cryptocurrency exchange
- **Responsive Design**: Works seamlessly on desktop and mobile devices

---

## Getting Started

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection to connect to the Kraken exchange
- No additional software installation required

### Running the Application

The application requires both a backend server and a frontend dashboard:

#### For Developers/Local Setup

1. **Install dependencies**:
   ```bash
   npm run install:all
   ```

2. **Start the development environment**:
   ```bash
   npm run dev
   ```

   This starts:
   - Backend server on `http://localhost:3001`
   - Frontend dashboard on `http://localhost:5173`

3. **Open your browser** and navigate to the frontend URL shown in the terminal

#### For Users

Simply navigate to the deployed FRAT Signals dashboard URL provided by your administrator.

---

## Dashboard Overview

### Top Section: Header

```
┌─────────────────────────────────────────┐
│          FRAT Signals                   │
│   Fractal Regime-Adaptive Trading       │
└─────────────────────────────────────────┘
```

The header identifies the application and displays the full system name.

### Middle Section: Controls

**Pair Selector**
- Dropdown menu to select which cryptocurrency pair to analyze
- Default: BTC/USDT
- Supports 13 major trading pairs (see [Supported Trading Pairs](#supported-trading-pairs) below)

**Refresh Button**
- Manually refresh signals for the selected pair
- The dashboard **automatically refreshes every 3 minutes** (180 seconds)
- Shows a loading spinner while fetching new data

### Main Section: Fractal Signals Grid

The core of the dashboard displays a **2×2 grid** showing four timeframes:

```
┌──────────────────────────────────────────────────────┐
│  Confluence Status (Overall Signal Strength)         │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌─────────────────────┐   ┌─────────────────────┐   │
│  │      15-Minute      │   │       1-Hour        │   │
│  │                     │   │                     │   │
│  │  [Signal Data]      │   │  [Signal Data]      │   │
│  └─────────────────────┘   └─────────────────────┘   │
│                                                        │
│  ┌─────────────────────┐   ┌─────────────────────┐   │
│  │      4-Hour         │   │       1-Day         │   │
│  │                     │   │                     │   │
│  │  [Signal Data]      │   │  [Signal Data]      │   │
│  └─────────────────────┘   └─────────────────────┘   │
│                                                        │
└──────────────────────────────────────────────────────┘
```

Each card shows detailed information for that specific timeframe.

### Confluence Bar (Top of Grid)

Shows the overall market direction by combining all four timeframes:

- **STRONG BULLISH**: 75%+ of timeframes show BUY signals (green)
- **BULLISH**: 50-75% show BUY signals (green)
- **WEAK BULLISH**: 25-50% show BUY signals (yellow)
- **WEAK BEARISH**: 25-50% show SELL signals (orange)
- **BEARISH**: 50-75% show SELL signals (red)
- **STRONG BEARISH**: 75%+ show SELL signals (red)
- **NEUTRAL**: Equal split or mixed signals (gray)

---

## How to Use the App

### Step 1: Select a Trading Pair

1. Click the **Pair Selector** dropdown
2. Search or scroll to find the cryptocurrency pair you want to analyze
3. Click to select (e.g., "ETH/USDT", "SOL/USDT")

### Step 2: View the Signals

The dashboard automatically loads signals for your selected pair. You'll see:

- **Timeframe Cards**: One for each of the 4 timeframes
- **Confluence Status**: Overall market direction at the top
- **Individual Signals**: BUY or SELL recommendation for each timeframe

### Step 3: Interpret the Signal Cards

Each timeframe card displays:

#### Signal Type (if present)
- **Green "BUY" badge**: Bullish signal
- **Red "SELL" badge**: Bearish signal
- **Gray "HOLD"**: No active signal (neutral market)

#### Regime Status (Market Type)
- **TRENDING** (green): Strong directional movement — best for trading
- **RANDOM** (yellow): Choppy, unpredictable movement — avoid trading
- **MEAN_REVERTING** (red): Market bouncing between extremes — reversal signals only

#### Confidence Score
- **Ring Gauge**: Visual representation of signal confidence (0-100)
- **Grade**: Letter grade A+, A, B, or C
- Higher scores = more reliable signals

#### Entry & Exit Prices
If a signal is active:
- **Entry Price**: Where to enter the trade
- **Stop Loss (SL)**: Where to exit if the market moves against you
- **Take Profit (TP)**: Target price to exit with profit
- **SL/TP Percentages**: Risk/reward ratio displayed

#### Component Breakdown
Stacked bar showing the contribution of different analysis factors:
- **Regime**: Market type strength
- **Trend**: Directional confirmation
- **Momentum**: Price movement velocity
- **BTC Filter**: Bitcoin market conditions

### Step 4: Expand the Chart (Optional)

Click on a timeframe card to expand and view:
- **Candlestick Chart**: Price bars showing OHLC (Open, High, Low, Close)
- **VW-MACD Indicator**: Volume-weighted momentum line
- **Trend Lines**: KAMA moving average

### Step 5: Manual Refresh

Click the **Refresh** button to immediately fetch fresh signals without waiting for auto-refresh. Useful after market events or news.

---

## Understanding Signals

### What is a BUY Signal?

A BUY signal means the system has detected bullish conditions on that timeframe:
- Market is **trending upward**
- Multiple indicators are aligned
- **Entry Price**: The current recommended buy level
- **Stop Loss**: Risk management level below entry
- **Take Profit**: Profit target above entry

### What is a SELL Signal?

A SELL signal means the system has detected bearish conditions:
- Market is **trending downward**
- Multiple indicators are aligned
- **Entry Price**: The current recommended sell level
- **Stop Loss**: Risk management level above entry
- **Take Profit**: Profit target below entry

### What if there's NO Signal?

If a timeframe shows no signal (gray "HOLD"):
- Market doesn't meet all entry conditions
- May be in a trending regime but indicators not yet aligned
- Or the market may be choppy/random
- **Recommendation**: Wait for clearer conditions

### Signal Strength (Confluence)

The more timeframes showing the **same direction** (all BUY or all SELL), the stronger the signal:

- **4/4 same direction**: Strongest confidence
- **3/4 same direction**: Strong confluence
- **2/4 same direction**: Mixed signals (take with caution)
- **1/4 same direction**: Weak confluence (avoid trading)
- **0/4 (all HOLD)**: No trade setup

---

## Key Concepts

### Timeframes

The system analyzes four independent timeframes. Each is suited for different trading styles:

| Timeframe | Best For | Hold Duration |
|-----------|----------|----------------|
| **15 Minute** | Scalpers | Minutes to hours |
| **1 Hour** | Day traders | Hours to a day |
| **4 Hour** | Swing traders | Days to weeks |
| **1 Day** | Position traders | Weeks to months |

**Tip**: Use longer timeframes (4h, 1d) for more reliable, sustained moves. Use shorter timeframes (15m, 1h) for faster entry/exit but expect more noise.

### Regime Detection

The system classifies markets into three regimes using mathematical analysis:

#### TRENDING Regime
- Strong directional movement
- Market consistently moves in one direction
- **Best time to trade**: Use BUY signals on uptrends, SELL on downtrends
- Confidence indicator: **Green badge**

#### RANDOM Regime
- Choppy, unpredictable price action
- No clear direction
- **Avoid trading**: Signals may fail
- Confidence indicator: **Yellow badge**

#### MEAN_REVERTING Regime
- Market bounces between extremes
- Not following a clear trend
- **Strategy**: Look for bounces at extremes
- Confidence indicator: **Red badge**

### BTC Filter

Bitcoin's condition influences signals for all altcoins (ETH, SOL, etc.):

- When **Bitcoin is strong and trending**, altcoin signals are more reliable
- When **Bitcoin is weak or choppy**, altcoin signals are riskier
- This reflects the reality that alt markets follow Bitcoin

### Confidence Grading

Each signal receives a letter grade based on multiple factors:

| Grade | Reliability | Action |
|-------|-------------|--------|
| **A+** | Highest | Very strong trade setup |
| **A** | High | Strong trade setup |
| **B** | Medium | Moderate trade setup |
| **C** | Low | Weak trade setup (minimum) |

**Signals below C are not displayed** (considered too weak to trade).

---

## Confidence Grades

### How Grades are Calculated

Each signal's confidence combines four weighted components:

1. **Regime Strength** (40% weight)
   - Is the market in TRENDING mode?
   - How strong is the trend?

2. **Trend Confirmation** (30% weight)
   - Do KAMA and T3 moving averages agree?
   - Is price in the right position relative to trends?

3. **Momentum** (20% weight)
   - Is VW-MACD aligned with the signal direction?
   - How strong is the momentum?

4. **BTC Market Filter** (10% weight)
   - Is Bitcoin's trend supportive?
   - Is Bitcoin's volatility normal?

### Interpreting Your Grade

```
A+ (90-100%) → Trade with high conviction
A  (80-89%)  → Trade with confidence
B  (70-79%)  → Trade with caution, use smaller size
C  (60-69%)  → Weakest acceptable trade; consider skipping
Below C      → Do not trade (too weak)
```

### Component Breakdown Bar

Each card shows a **stacked bar chart** breaking down which component contributes to the grade:

- **Longer bars** = stronger component contribution
- **Shorter bars** = weaker component contribution
- **All long bars** = well-confirmed signal
- **Mix of short/long** = some disagreement between indicators

---

## Supported Trading Pairs

FRAT Signals analyzes 13 major cryptocurrency trading pairs against USDT (US Dollar Tether):

### Major Coins
- `BTC/USDT` — Bitcoin
- `ETH/USDT` — Ethereum
- `SOL/USDT` — Solana

### Layer 1 Chains
- `BNB/USDT` — Binance Coin
- `ADA/USDT` — Cardano
- `AVAX/USDT` — Avalanche
- `DOT/USDT` — Polkadot
- `ATOM/USDT` — Cosmos

### Alternative Assets
- `XRP/USDT` — Ripple
- `DOGE/USDT` — Dogecoin
- `LINK/USDT` — Chainlink
- `LTC/USDT` — Litecoin
- `BCH/USDT` — Bitcoin Cash

**Note**: All pairs are spot trading pairs (not futures/leverage).

---

## Frequently Asked Questions

### Q: How often should I check the dashboard?

**A**: The dashboard automatically refreshes every 3 minutes. You can check it as often as you want, but signals only update on the 3-minute cycle. For real-time trading, you might want to check more frequently during volatile periods.

### Q: Should I take every signal?

**A**: Not necessarily. Consider:
- **Timeframe alignment**: Signals on multiple timeframes are more reliable
- **Confidence grade**: A+/A are stronger than B/C
- **Risk tolerance**: Larger position sizes on higher-grade signals
- **Market conditions**: Trending markets (green regime) are safer than random/mean-reverting

### Q: What if I disagree with a signal?

**A**: The system is analytical, not infallible. You should:
1. Review the confluence (how many timeframes agree?)
2. Check the confidence grade
3. Use your own judgment
4. Apply strict risk management

**Always use stop-losses to protect capital.**

### Q: Can I trade the same pair across multiple timeframes?

**A**: Yes! Many traders use a multi-timeframe strategy:
- Use the **4h and 1d signals** to identify the main trend
- Use the **15m and 1h signals** to find entry points within that trend
- This creates a "trade with the trend" approach

### Q: Why did my trade fail even with a high-grade signal?

**A**: Trading isn't 100% reliable. Reasons include:
- Sudden news events or black swan moves
- Market liquidity gaps
- Entry timing (price moved before you executed)
- Using stop-loss too tight (getting stopped out on normal volatility)

Always have a risk management plan (stop-loss, position size).

### Q: What's the difference between Stop Loss (SL) and Take Profit (TP)?

**A**: 
- **Stop Loss (SL)**: Price level where you exit the trade if it moves against you → Limits losses
- **Take Profit (TP)**: Price level where you exit the trade if it moves in your favor → Secures profits

The SL% and TP% show the risk/reward ratio of the setup.

### Q: Are these signals verified/backtested?

**A**: The system is built on proven trading techniques (Hurst exponent, KAMA, MACD). Past backtesting is available but real market performance depends on many factors. **Trade at your own risk** and always use risk management.

### Q: Can I use these signals for futures/margin trading?

**A**: These signals are designed for **spot trading only** (buying and holding). Futures/margin trading amplifies both gains and losses. Only use these signals for spot if you understand the added complexity and risks.

---

## Troubleshooting

### Problem: Dashboard won't load

**Solutions**:
1. Refresh your browser (Ctrl+R or Cmd+R)
2. Check your internet connection
3. Check that the backend server is running (see "Getting Started")
4. Clear browser cache and try again
5. Try a different browser

### Problem: No signals showing (all "HOLD")

**Possible reasons**:
- Market is choppy/random (RANDOM regime) → Signals only fire in TRENDING markets
- No confluence between indicators yet → Wait for clearer setup
- Bitcoin (BTC) is weak → Altcoin signals depend on BTC strength
- Very new market data → Wait for next refresh (3 minutes)

**Action**: Wait for market conditions to improve or try a different pair.

### Problem: Signals keep changing

**Normal behavior**. Signals update every 3 minutes as new price data arrives. In choppy markets, this is expected. To reduce "noise," focus on longer timeframes (4h, 1d) which are less volatile.

### Problem: BTC Filter showing as weak

**Meaning**: Bitcoin is not in an ideal state for altcoin trading. Altcoin signals will be less reliable. Options:
1. Wait for Bitcoin to recover
2. Focus on Bitcoin trading instead
3. Only trade very high-confidence (A+) altcoin signals

### Problem: Can't find my trading pair

**Solutions**:
1. Verify the pair is in the supported list (see [Supported Trading Pairs](#supported-trading-pairs))
2. Type in the search box to filter
3. Check spelling and format (e.g., "SOL/USDT" not "SOLANA")
4. If still missing, request it be added to the system

### Problem: Confidence grade seems low

**This might be intentional**:
- Market may lack clear directional conviction
- One of the four components (regime, trend, momentum, BTC) is weak
- Grade C is still tradeable but riskier
- Grade below C signals won't display at all

**Action**: Wait for higher-confidence setup or assess your risk tolerance for lower-grade trades.

### Problem: I see different signals on different timeframes

**This is normal and useful**:
- 15m might show BUY (short-term uptrend)
- 1h might show SELL (intermediate downtrend)
- 4h might show HOLD (larger trend not formed yet)

Check the **Confluence** bar at the top to see overall direction. Use the agreement between timeframes to decide which to trade.

---

## Tips for Successful Trading with FRAT Signals

### 1. **Always Use Stop-Losses**
- The SL suggested in each signal is adaptive to market conditions
- Never trade without a stop-loss; it's your safety net

### 2. **Check Confluence Before Trading**
- STRONG BULLISH or STRONG BEARISH (3-4 timeframes) = best trades
- Mixed signals = more risky, consider skipping

### 3. **Trade With the Trend**
- Use 4h/1d signals for the main trend direction
- Use 15m/1h signals for entry points within that trend
- Don't fight the bigger timeframe trend

### 4. **Position Size Scales with Confidence**
- A+ signals → Can use larger position size
- C signals → Use smaller position size
- No signal → No position

### 5. **Wait for Regime Confirmation**
- TRENDING (green) regime = most reliable
- RANDOM or MEAN_REVERTING = skip trading or use tighter stops

### 6. **Monitor Bitcoin (BTC)**
- Check BTC/USDT signals before trading altcoins
- Strong Bitcoin = stronger altcoin signals
- Weak Bitcoin = more caution needed for alts

### 7. **Keep a Trade Journal**
- Track which signals you took and which you skipped
- Note the outcome (profit/loss)
- Over time, identify patterns in what works for you

### 8. **Understand Your Risk Tolerance**
- Only trade with capital you can afford to lose
- Position size so your stop-loss is acceptable to you
- Never risk more than 1-2% of your portfolio on one trade

### 9. **Don't Over-Trade**
- FRAT Signals provides opportunity, not obligation
- Waiting for high-confidence setups is better than taking weak signals
- Quality > Quantity

### 10. **Stay Informed**
- Trading signals work best in normal market conditions
- Major news events (Fed announcements, hacks, regulations) can override signals
- Have a plan for black swan events

---

## Summary

FRAT Signals is a powerful tool for identifying trading opportunities across multiple timeframes. By understanding:

- ✅ How to navigate the dashboard
- ✅ What each signal component means
- ✅ How to interpret confidence grades
- ✅ The importance of confluence
- ✅ How to manage risk

You'll be well-equipped to use this system effectively.

**Remember**: No trading system is 100% accurate. Always use proper risk management, keep emotions in check, and never risk capital you can't afford to lose.

---

## Need Help?

If you encounter issues or have questions:

1. Review the **Troubleshooting** section above
2. Check the project's **README.md** for technical details
3. Review the **program.md** file for deep-dive technical documentation
4. Contact your system administrator or support team

**Happy trading! 🚀**
