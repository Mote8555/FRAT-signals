const YahooFinance = require("yahoo-finance2").default;

const FOREX_SYMBOLS = {
  "EUR/USD": "EURUSD=X",
  "GBP/USD": "GBPUSD=X",
  "USD/JPY": "USDJPY=X",
  "AUD/USD": "AUDUSD=X",
  "USD/CAD": "USDCAD=X",
  "NZD/USD": "NZDUSD=X",
  "USD/CHF": "USDCHF=X",
};

class YahooFinanceProvider {
  constructor() {
    this.yf = new YahooFinance();
    this.name = "Yahoo Finance";
  }

  toYahooSymbol(symbol) {
    return FOREX_SYMBOLS[symbol] || symbol.replace("/", "") + "=X";
  }

  async fetchOHLCV(symbol = "EUR/USD", timeframe = "1h", limit = 500) {
    try {
      const yahooSymbol = this.toYahooSymbol(symbol);

      if (timeframe === "4h") {
        const hourlyData = await this.fetchOHLCV(symbol, "1h", limit * 5);
        return this.aggregateTo4h(hourlyData);
      }

      const interval = this.mapInterval(timeframe);
      if (!interval) return null;

      const msPerCandle = {
        "15m": 15 * 60 * 1000,
        "60m": 60 * 60 * 1000,
        "1d": 24 * 60 * 60 * 1000,
      };
      const msBack = (msPerCandle[interval] || 3600000) * Math.max(limit * 2, 500);
      const period1 = new Date(Date.now() - msBack);

      const result = await this.yf.chart(yahooSymbol, { interval, period1 });

      const quotes = (result.quotes || [])
        .filter(q => q.open != null && q.close != null && q.high != null)
        .slice(-limit)
        .map(c => ({
          timestamp: c.date,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume || 0,
        }));

      return quotes.length >= 10 ? quotes : null;
    } catch (error) {
      console.error(`Yahoo fetchOHLCV error: ${error.message}`);
      return null;
    }
  }

  mapInterval(timeframe) {
    const map = { "15m": "15m", "1h": "60m", "1d": "1d" };
    return map[timeframe] || null;
  }

  aggregateTo4h(hourlyData) {
    if (!hourlyData || hourlyData.length < 4) return null;
    const result = [];
    for (let i = 0; i + 3 < hourlyData.length; i += 4) {
      const slice = hourlyData.slice(i, i + 4);
      result.push({
        timestamp: slice[0].timestamp,
        open: slice[0].open,
        high: Math.max(...slice.map(c => c.high)),
        low: Math.min(...slice.map(c => c.low)),
        close: slice[slice.length - 1].close,
        volume: slice.reduce((s, c) => s + c.volume, 0),
      });
    }
    return result;
  }

  async fetchFundingRate() {
    return null;
  }

  async fetchOpenInterest() {
    return null;
  }
}

module.exports = YahooFinanceProvider;
