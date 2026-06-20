class BTCFilter {
  calculateKAMA(prices, period = 10, fast = 2, slow = 30) {
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

  calculateEMA(prices, period) {
    const ema = [];
    const k = 2 / (period + 1);
    ema.push(prices[0]);
    for (let i = 1; i < prices.length; i++) {
      ema.push(prices[i] * k + ema[i - 1] * (1 - k));
    }
    return ema;
  }

  evaluate(prices) {
    if (prices.length < 50) return { btcTrend: "NEUTRAL", score: 50 };

    const kama = this.calculateKAMA(prices);
    const ema20 = this.calculateEMA(prices, 20);
    if (!kama || kama.length < 2) return { btcTrend: "NEUTRAL", score: 50 };

    const currentPrice = prices[prices.length - 1];
    const currentKAMA = kama[kama.length - 1];
    const prevKAMA = kama[kama.length - 2];
    const currentEMA20 = ema20[ema20.length - 1];

    const kamaSlope = currentKAMA - prevKAMA;
    const priceAboveKAMA = currentPrice > currentKAMA;
    const priceAboveEMA = currentPrice > currentEMA20;

    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + (r - meanReturn) ** 2, 0) / returns.length;
    const volatility = Math.sqrt(variance);

    let trendScore = 0;
    if (kamaSlope > 0) trendScore += 25;
    if (kamaSlope < 0) trendScore -= 25;
    if (priceAboveKAMA) trendScore += 15;
    if (!priceAboveKAMA) trendScore -= 15;
    if (priceAboveEMA) trendScore += 10;
    if (!priceAboveEMA) trendScore -= 10;

    if (volatility < 0.02) trendScore += 5;
    if (volatility > 0.05) trendScore -= 5;

    const normalizedScore = Math.max(0, Math.min(100, 50 + trendScore));
    const btcTrend = trendScore > 10 ? "BULLISH" : trendScore < -10 ? "BEARISH" : "NEUTRAL";

    return { btcTrend, score: normalizedScore };
  }

  blockAltcoinLongs(btcTrend) {
    return btcTrend === "BEARISH";
  }

  blockAltcoinShorts(btcTrend) {
    return btcTrend === "BULLISH";
  }
}

module.exports = new BTCFilter();
