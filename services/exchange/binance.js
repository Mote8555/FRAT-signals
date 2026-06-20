const ccxt = require("ccxt");

class BinanceExchange {
  constructor(config = {}) {
    this.exchange = new ccxt.binance({
      apiKey: config.apiKey || "",
      secret: config.secret || "",
      enableRateLimit: true,
      options: { defaultType: "future" },
    });
  }

  async fetchOHLCV(symbol = "BTC/USDT", timeframe = "1h", limit = 500) {
    try {
      const ohlcv = await this.exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
      return ohlcv.map(c => ({
        timestamp: c[0],
        open: c[1],
        high: c[2],
        low: c[3],
        close: c[4],
        volume: c[5],
      }));
    } catch (error) {
      console.error(`Binance fetchOHLCV error: ${error.message}`);
      return null;
    }
  }

  async fetchFundingRate(symbol = "BTC/USDT") {
    try {
      const funding = await this.exchange.fetchFundingRate(symbol);
      return funding.fundingRate || null;
    } catch (error) {
      console.error(`Binance fetchFundingRate error: ${error.message}`);
      return null;
    }
  }

  async fetchOpenInterest(symbol = "BTC/USDT") {
    try {
      const oi = await this.exchange.fetchOpenInterest(symbol);
      return oi.openInterestAmount || null;
    } catch (error) {
      console.error(`Binance fetchOpenInterest error: ${error.message}`);
      return null;
    }
  }

  async placeOrder(symbol, type, side, amount, price = null) {
    try {
      const order = await this.exchange.createOrder(symbol, type, side, amount, price);
      return order;
    } catch (error) {
      console.error(`Binance placeOrder error: ${error.message}`);
      return null;
    }
  }

  async cancelOrder(orderId, symbol) {
    try {
      return await this.exchange.cancelOrder(orderId, symbol);
    } catch (error) {
      console.error(`Binance cancelOrder error: ${error.message}`);
      return null;
    }
  }

  async fetchBalance() {
    try {
      return await this.exchange.fetchBalance();
    } catch (error) {
      console.error(`Binance fetchBalance error: ${error.message}`);
      return null;
    }
  }
}

module.exports = BinanceExchange;
