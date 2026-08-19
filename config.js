/**
 * FRAT-Signals — Central Configuration
 *
 * All tunable indicator, strategy, and backtesting parameters live here.
 * Edit values below, then run `npm run backtest` to see the effect.
 * No source files need to be touched after initial setup.
 */

module.exports = {
  // ── Indicators ──────────────────────────────────────────────────────

  kama: {
    period: 20,        // Optimized 1d: 20 — slow ER catches major trends
    fast: 2,           // Optimized 1d: 2
    slow: 50,          // Optimized 1d: 50 — wide band for 1d adaptation
  },

  t3: {
    period: 5,         // Optimized 1d: 5
    volumeFactor: 0.5, // Optimized 1d: 0.5 — less smoothing = more responsive
  },

  vwmacd: {
    fast: 15,          // Optimized 1d: 15
    slow: 30,          // Optimized 1d: 30
    signal: 10,        // Optimized 1d: 10
  },

  atr: {
    period: 14,        // ATR lookback
  },

  // ── Regime Detection (Hurst / DFA) ──────────────────────────────────

  regime: {
    trendingThreshold: 0.55,   // H > this → TRENDING
    randomLower: 0.45,         // H >= this and <= trendingThreshold → RANDOM
                                // H < this → MEAN_REVERTING
    minDataPoints: 100,
    minLag: 10,
    maxLagCap: 100,
    lagStep: 5,
    dfaTrendingBoost: 10,      // +confidence when DFA>1.0 & H>trendingThreshold
    dfaMeanRevertingBoost: 10,  // +confidence when DFA<0.5 & H<randomLower
  },

  // ── Timeframe Filter ────────────────────────────────────────────────

  timeframeFilter: {
    trendPeriods: {
      SHORT: 20,       // 15m candles
      MEDIUM: 60,      // 1H candles
      LONG: 120,       // 4H candles
    },
    pricePositionThreshold: 0.01,  // 1% — min distance from avg for strength
  },

  // ── BTC Filter ──────────────────────────────────────────────────────

  btcFilter: {
    minDataPoints: 50,
    emaPeriod: 20,
    kamaSlopeWeight: 25,         // +/- score for KAMA slope direction
    priceVsKamaWeight: 15,       // +/- score for price vs KAMA
    priceVsEmaWeight: 10,        // +/- score for price vs EMA20
    lowVolatilityThreshold: 0.02, // bonus when vol < this
    highVolatilityThreshold: 0.05, // penalty when vol > this
    lowVolatilityBonus: 5,
    highVolatilityPenalty: 5,
    bullBearThreshold: 10,       // score > this → BULLISH, < -this → BEARISH
  },

  // ── Confidence Engine ───────────────────────────────────────────────

  confidence: {
    weights: {
      regime: 30,
      trend: 25,
      momentum: 25,
      btcFilter: 20,
    },
    gradeThresholds: {
      "A+": 90,
      A: 80,
      B: 70,
      C: 70,           // Optimized: was 60 — stricter filtering improves win rate
      // Below 70 → IGNORE (no trade)
    },
  },

  // ── Risk Management ─────────────────────────────────────────────────

  risk: {
    riskPercent: 1.0,          // % of account risked per trade
    minPositionSize: 0.001,
    maxPositionSize: 10,
    regimeMultipliers: {
      STRONG_TRENDING: 1.0,
      TRENDING: 1.0,
      WEAK_TRENDING: 0.5,
      default: 0.25,
    },
  },

  // ── Adaptive TP / SL (ATR multipliers) ──────────────────────────────

  adaptiveTargets: {
    STRONG_TRENDING: { sl: 2, tp: 8 },
    TRENDING: { sl: 2, tp: 5 },
    WEAK_TRENDING: { sl: 1.5, tp: 2.5 },
    default: { sl: 1.5, tp: 3 },
  },

  // ── Exit Engine ─────────────────────────────────────────────────────

  exit: {
    chandelierMultiplier: 3,   // Optimized cross-TF: 3
    atrPeriod: 22,
    partialTakeProfitR: 4,     // Optimized cross-TF: 4 (best avg score)
    partialSize: 0.5,
    trailMultiplier: 2.5,      // Optimized cross-TF: 2.5
  },

  // ── Timeframe Scaling ───────────────────────────────────────────────
  // Per-TF multipliers that tighten rules for shorter timeframes.
  // Applied in trend.js generateSignal() via options.timeframe.
  timeframeScaling: {
    "1d": {
      confidenceMultiplier: 1.0,   // baseline — no change
      regimeCheck: true,           // require TRENDING regime
      exitMultiplier: 1.0,         // baseline exits
      minTrendStrength: 0,         // no extra filter
    },
    "4h": {
      confidenceMultiplier: 1.2,   // raise grade threshold 20%
      regimeCheck: true,
      exitMultiplier: 0.85,        // tighter stops for faster TF
      minTrendStrength: 1,         // require at least strength=1
    },
    "1h": {
      confidenceMultiplier: 1.4,   // raise grade threshold 40%
      regimeCheck: true,
      exitMultiplier: 0.7,         // even tighter stops
      minTrendStrength: 1,
    },
    "15m": {
      confidenceMultiplier: 1.6,   // raise grade threshold 60%
      regimeCheck: true,
      exitMultiplier: 0.6,         // tightest stops for noise
      minTrendStrength: 2,         // require strong trend alignment
    },
  },

  // ── Backtesting ─────────────────────────────────────────────────────

  backtest: {
    initialBalance: 100,
    commission: 0.001,         // 0.1% per side
    slippage: 0.001,           // 0.1% per side
    warmupPeriod: 200,         // Skip first N candles
    validatingTrendPeriod: 60, // Higher-TF trend evaluation period
    validatingTrendMinCandles: 65, // Min higher-TF candles to use validating trend
    // Per-timeframe downsampling factor for validating trend
    // 0 = skip validating trend (no higher TF available)
    // N = take every Nth candle to simulate higher TF
    timeframeDownsample: {
      "1d": 0,       // no higher TF in our set → skip validating trend
      "4h": 4,       // every 4th 4H candle → 1D validation
      "1h": 4,       // every 4th 1H candle → 4H validation
      "15m": 4,      // every 4th 15m candle → 1H validation
    },
  },
};
