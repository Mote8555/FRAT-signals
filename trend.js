const config = require("./config.js");
const RegimeEngine = require("./services/regime-engine.js");
const TimeframeFilter = require("./services/timeframe-filter.js");
const BTCFilter = require("./services/btc-filter.js");
const ConfidenceEngine = require("./services/confidence-engine.js");

class FRATAlgorithm {
  constructor() {
    this.cryptoPairs = [
      "BTC/USDT",
      "ETH/USDT",
      "SOL/USDT",
      "BNB/USDT",
      "XRP/USDT",
      "ADA/USDT",
      "DOGE/USDT",
      "AVAX/USDT",
      "DOT/USDT",
      "LINK/USDT",
      "ATOM/USDT",
      "LTC/USDT",
      "BCH/USDT",
    ];

    this.pairs = [...this.cryptoPairs];
  }

  getPairs() {
    return this.cryptoPairs;
  }

  calculateKAMA(prices, period = config.kama.period, fast = config.kama.fast, slow = config.kama.slow) {
    if (prices.length < period) return null;

    const kama = [];
    let er, sc;

    for (let i = period - 1; i < prices.length; i++) {
      const change = Math.abs(prices[i] - prices[i - period + 1]);
      let volatility = 0;

      for (let j = i - period + 2; j <= i; j++) {
        volatility += Math.abs(prices[j] - prices[j - 1]);
      }

      er = volatility === 0 ? 0 : change / volatility;
      sc = Math.pow(er * (2 / (fast + 1) - 2 / (slow + 1)) + 2 / (slow + 1), 2);

      if (i === period - 1) {
        kama.push(prices[i]);
      } else {
        const prevKAMA = kama[kama.length - 1];
        kama.push(prevKAMA + sc * (prices[i] - prevKAMA));
      }
    }

    return kama;
  }

  calculateT3(prices, period = config.t3.period, volumeFactor = config.t3.volumeFactor) {
    if (prices.length < period * 6) return null;

    const ema1 = this.calculateEMA(prices, period);
    const ema2 = this.calculateEMA(ema1, period);
    const ema3 = this.calculateEMA(ema2, period);
    const ema4 = this.calculateEMA(ema3, period);
    const ema5 = this.calculateEMA(ema4, period);
    const ema6 = this.calculateEMA(ema5, period);

    // ✅ FIXED: Wrapped negative values in parentheses
    const c1 = -(volumeFactor ** 3);
    const c2 = 3 * volumeFactor ** 2 + 3 * volumeFactor ** 3;
    const c3 =
      -6 * volumeFactor ** 2 - 3 * volumeFactor - 3 * volumeFactor ** 3;
    const c4 = 1 + 3 * volumeFactor + volumeFactor ** 3 + 3 * volumeFactor ** 2;

    const t3 = [];
    for (let i = 0; i < ema6.length; i++) {
      t3.push(c1 * ema6[i] + c2 * ema5[i] + c3 * ema4[i] + c4 * ema3[i]);
    }

    return t3;
  }

  calculateVWMACD(prices, volumes, fast = config.vwmacd.fast, slow = config.vwmacd.slow, signal = config.vwmacd.signal) {
    if (prices.length < slow) return null;

    const vwmaFast = this.calculateVWMA(prices, volumes, fast);
    const vwmaSlow = this.calculateVWMA(prices, volumes, slow);

    if (!vwmaFast || !vwmaSlow) return null;

    const offset = vwmaFast.length - vwmaSlow.length;
    const macdLine = [];
    for (let i = 0; i < vwmaSlow.length; i++) {
      macdLine.push(vwmaFast[i + offset] - vwmaSlow[i]);
    }

    const signalLine = this.calculateEMA(macdLine, signal);

    return { macdLine, signalLine };
  }

  calculateATR(highs, lows, closes, period = config.atr.period) {
    if (closes.length < period + 1) return null;

    const tr = [];
    for (let i = 1; i < closes.length; i++) {
      const hl = highs[i] - lows[i];
      const hc = Math.abs(highs[i] - closes[i - 1]);
      const lc = Math.abs(lows[i] - closes[i - 1]);
      tr.push(Math.max(hl, hc, lc));
    }

    return this.calculateSMA(tr, period);
  }

  getAdaptiveTargets(atr, regime) {
    const targets = config.adaptiveTargets[regime] || config.adaptiveTargets.default;
    return { stopLoss: atr * targets.sl, takeProfit: atr * targets.tp };
  }

  generateSignal(pair, candleData, options = {}) {
    const { opens, highs, lows, closes, volumes } = candleData;
    const {
      btcPrices = null,
      validatingTrend = null,
      timeframe = "1d",
    } = options;

    const tfScale = config.timeframeScaling[timeframe] || config.timeframeScaling["1d"];

    const kama = this.calculateKAMA(closes);
    const t3 = this.calculateT3(closes);
    const vwmacd = this.calculateVWMACD(closes, volumes);
    const atr = this.calculateATR(highs, lows, closes);

    if (!kama || !t3 || !vwmacd || !atr) return null;

    const currentPrice = closes[closes.length - 1];
    const currentKAMA = kama[kama.length - 1];
    const currentATR = atr[atr.length - 1];

    const t3Slope = t3[t3.length - 1] - t3[t3.length - 2];
    const macdBullish =
      vwmacd.macdLine[vwmacd.macdLine.length - 1] >
      vwmacd.signalLine[vwmacd.signalLine.length - 1];
    const priceAboveKAMA = currentPrice > currentKAMA;
    const withinATR = Math.abs(currentPrice - currentKAMA) <= currentATR;

    const regime = RegimeEngine.detectRegime(closes);
    if (tfScale.regimeCheck && regime.regime !== "TRENDING") return null;

    const tfTrend = TimeframeFilter.evaluateTrend(closes, config.timeframeFilter.trendPeriods.MEDIUM);
    if (tfTrend.trend === "NEUTRAL") return null;

    // Multi-TF confirmation: validatingTrend is the higher-TF trend direction
    // If available, signal direction must agree with it
    if (validatingTrend && validatingTrend !== "NEUTRAL") {
      if (tfTrend.trend !== validatingTrend) return null;
    }

    // TF-scaled minimum trend strength
    if (tfScale.minTrendStrength > 0 && Math.abs(tfTrend.strength) < tfScale.minTrendStrength) return null;

    const btcResult = btcPrices
      ? BTCFilter.evaluate(btcPrices)
      : BTCFilter.evaluate(closes);

    const confidence = ConfidenceEngine.score({
      regime: regime.regime,
      hurst: regime.hurst,
      regimeConfidence: regime.confidence,
      trend: tfTrend.trend,
      trendStrength: tfTrend.strength,
      trendSlope: tfTrend.slope,
      momentum: { macdBullish, t3Slope, currentPrice },
      btcFilter: btcResult,
    });

    if (!ConfidenceEngine.shouldTrade(confidence.grade, confidence.score, tfScale.confidenceMultiplier)) return null;

    const isLong = t3Slope > 0 && priceAboveKAMA && withinATR && macdBullish;
    const isShort = t3Slope < 0 && !priceAboveKAMA && withinATR && !macdBullish;

    if (!isLong && !isShort) return null;

    const side = isLong ? "BUY" : "SELL";
    const regimeStrength = regime.confidence > config.confidence.gradeThresholds.A ? "STRONG_TRENDING" : regime.confidence > config.confidence.gradeThresholds.B ? "TRENDING" : "WEAK_TRENDING";
    const targets = this.getAdaptiveTargets(currentATR, regimeStrength);

    if (side === "SELL") {
      return {
        pair,
        type: "SELL",
        entryPrice: currentPrice,
        stopLoss: currentPrice + targets.stopLoss,
        takeProfit: currentPrice - targets.takeProfit,
        confidence,
        regime: regime.regime,
        regimeStrength,
        hurst: regime.hurst,
        dfa: regime.dfa,
        stopDistance: targets.stopLoss,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      pair,
      type: "BUY",
      entryPrice: currentPrice,
      stopLoss: currentPrice - targets.stopLoss,
      takeProfit: currentPrice + targets.takeProfit,
      confidence,
      regime: regime.regime,
      regimeStrength,
      hurst: regime.hurst,
      dfa: regime.dfa,
      stopDistance: targets.stopLoss,
      timestamp: new Date().toISOString(),
    };
  }

  calculateEMA(prices, period) {
    const ema = [];
    const k = 2 / (period + 1);
    ema.push(prices[0]);
    for (let i = 1; i < prices.length; i++) {
      ema.push(prices[i] * k + ema[i - 1] * (1 - k));
    }
    return ema;
  }

  calculateSMA(prices, period) {
    const sma = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices
        .slice(i - period + 1, i + 1)
        .reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  calculateVWMA(prices, volumes, period) {
    const vwma = [];
    for (let i = period - 1; i < prices.length; i++) {
      let pvSum = 0;
      let vSum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        pvSum += prices[j] * volumes[j];
        vSum += volumes[j];
      }
      vwma.push(pvSum / vSum);
    }
    return vwma;
  }
}

module.exports = new FRATAlgorithm();
