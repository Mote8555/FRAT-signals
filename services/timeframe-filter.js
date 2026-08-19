const config = require("../config.js");

class TimeframeFilter {
  constructor() {
    this.trendPeriods = config.timeframeFilter.trendPeriods;
  }

  calculateKAMA(prices, period = config.kama.period, fast = config.kama.fast, slow = config.kama.slow) {
    if (prices.length < period) return null;

    const kama = [];

    for (let i = period - 1; i < prices.length; i++) {
      const change = Math.abs(prices[i] - prices[i - period + 1]);
      let volatility = 0;

      for (let j = i - period + 2; j <= i; j++) {
        volatility += Math.abs(prices[j] - prices[j - 1]);
      }

      const er = volatility === 0 ? 0 : change / volatility;
      const sc = Math.pow(er * (2 / (fast + 1) - 2 / (slow + 1)) + 2 / (slow + 1), 2);

      if (i === period - 1) {
        kama.push(prices[i]);
      } else {
        const prevKAMA = kama[kama.length - 1];
        kama.push(prevKAMA + sc * (prices[i] - prevKAMA));
      }
    }

    return kama;
  }

  evaluateTrend(prices, period) {
    if (prices.length < period + 5) return { trend: "NEUTRAL", strength: 0, slope: 0 };

    const kama = this.calculateKAMA(prices, Math.min(period, 10));
    if (!kama || kama.length < 3) return "NEUTRAL";

    const currentKAMA = kama[kama.length - 1];
    const prevKAMA = kama[kama.length - 2];
    const slope = currentKAMA - prevKAMA;

    const avgPrice = prices.slice(-period).reduce((a, b) => a + b, 0) / period;
    const pricePosition = (prices[prices.length - 1] - avgPrice) / avgPrice;

    let strength = 0;
    if (slope > 0) strength += 1;
    if (slope < 0) strength -= 1;
    if (pricePosition > config.timeframeFilter.pricePositionThreshold) strength += 1;
    if (pricePosition < -config.timeframeFilter.pricePositionThreshold) strength -= 1;

    if (strength >= 1) return { trend: "BULLISH", strength, slope };
    if (strength <= -1) return { trend: "BEARISH", strength, slope: -slope };
    return { trend: "NEUTRAL", strength: 0, slope: 0 };
  }

  filter(prices15m, prices1H, prices4H, pricesDaily) {
    const shortTermTrend = this.evaluateTrend(prices15m, this.trendPeriods.SHORT);
    const mediumTermTrend = this.evaluateTrend(prices1H, this.trendPeriods.MEDIUM);
    const longTermTrend = this.evaluateTrend(prices4H, this.trendPeriods.LONG);

    return { shortTermTrend, mediumTermTrend, longTermTrend };
  }

  isEntryAllowed(trend, side) {
    if (side === "BUY") {
      return trend.mediumTermTrend === "BULLISH" && trend.longTermTrend === "BULLISH";
    }
    if (side === "SELL") {
      return trend.mediumTermTrend === "BEARISH" && trend.longTermTrend === "BEARISH";
    }
    return true;
  }
}

module.exports = new TimeframeFilter();
