class FundingRateAnalyzer {
  analyze(rateHistory) {
    if (!rateHistory || rateHistory.length < 5) {
      return { fundingRate: 0, sentiment: "NEUTRAL" };
    }

    const latestRate = rateHistory[rateHistory.length - 1];
    const avgRate = rateHistory.reduce((a, b) => a + b, 0) / rateHistory.length;

    let sentiment;
    if (latestRate > 0.0001) {
      sentiment = "BULLISH";
    } else if (latestRate < -0.0001) {
      sentiment = "BEARISH";
    } else {
      sentiment = "NEUTRAL";
    }

    const extremeThreshold = 0.001;
    let extremeSignal = null;
    if (latestRate > extremeThreshold) {
      extremeSignal = "LONG_DOMINANT";
    } else if (latestRate < -extremeThreshold) {
      extremeSignal = "SHORT_DOMINANT";
    }

    return {
      fundingRate: Math.round(latestRate * 100000) / 100000,
      avgRate: Math.round(avgRate * 100000) / 100000,
      sentiment,
      extremeSignal,
    };
  }

  async fetchFromExchange(exchange, symbol) {
    try {
      if (!exchange.hasFetchFundingRate) return null;
      const funding = await exchange.fetchFundingRate(symbol);
      return funding.fundingRate || null;
    } catch {
      return null;
    }
  }
}

module.exports = new FundingRateAnalyzer();
