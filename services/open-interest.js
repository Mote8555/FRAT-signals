class OpenInterestAnalyzer {
  analyze(oiHistory) {
    if (!oiHistory || oiHistory.length < 10) {
      return { trend: "NEUTRAL", strength: 0 };
    }

    const recent = oiHistory.slice(-10);
    const firstHalf = recent.slice(0, 5);
    const secondHalf = recent.slice(-5);

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const oiSlope = (secondAvg - firstAvg) / firstAvg;

    let trend;
    let strength;

    if (oiSlope > 0.02) {
      trend = "RISING";
      strength = Math.min(100, Math.round(oiSlope * 500 + 50));
    } else if (oiSlope < -0.02) {
      trend = "FALLING";
      strength = Math.min(100, Math.round(Math.abs(oiSlope) * 500 + 50));
    } else {
      trend = "NEUTRAL";
      strength = Math.round(50 - Math.abs(oiSlope) * 100);
    }

    const oiVariance = recent.reduce((sum, val) => sum + (val - secondAvg) ** 2, 0) / recent.length;
    const stability = oiVariance < 0.01 ? 10 : 0;

    return { trend, strength: Math.min(100, strength + stability) };
  }

  detectDivergence(prices, oiHistory) {
    if (prices.length < 14 || oiHistory.length < 14) return null;

    const recentPrices = prices.slice(-14);
    const recentOI = oiHistory.slice(-14);

    const priceSlope = recentPrices[recentPrices.length - 1] - recentPrices[0];
    const oiSlope = recentOI[recentOI.length - 1] - recentOI[0];

    if (priceSlope > 0 && oiSlope < 0) {
      return { type: "BEARISH_DIVERGENCE", severity: Math.min(100, Math.round(Math.abs(priceSlope / oiSlope) * 50)) };
    }

    if (priceSlope < 0 && oiSlope > 0) {
      return { type: "BULLISH_DIVERGENCE", severity: Math.min(100, Math.round(Math.abs(priceSlope / oiSlope) * 50)) };
    }

    return null;
  }
}

module.exports = new OpenInterestAnalyzer();
