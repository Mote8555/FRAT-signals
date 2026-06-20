const ccxt = require("ccxt");

class KrakenExchange {
  constructor(config = {}) {
    this.exchange = new ccxt.kraken({
      apiKey: config.apiKey || "",
      secret: config.secret || "",
      enableRateLimit: true,
    });
  }

  get name() {
    return "Kraken";
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
      console.error(`Kraken fetchOHLCV error: ${error.message}`);
      return null;
    }
  }

  async fetchFundingRate() {
    return null;
  }

  async fetchOpenInterest() {
    return null;
  }

  async placeOrder(symbol, type, side, amount, price = null) {
    try {
      const order = await this.exchange.createOrder(symbol, type, side, amount, price);
      return order;
    } catch (error) {
      console.error(`Kraken placeOrder error: ${error.message}`);
      return null;
    }
  }

  async cancelOrder(orderId, symbol) {
    try {
      return await this.exchange.cancelOrder(orderId, symbol);
    } catch (error) {
      console.error(`Kraken cancelOrder error: ${error.message}`);
      return null;
    }
  }

  async fetchBalance() {
    try {
      return await this.exchange.fetchBalance();
    } catch (error) {
      console.error(`Kraken fetchBalance error: ${error.message}`);
      return null;
    }
  }
}

module.exports = KrakenExchange;
