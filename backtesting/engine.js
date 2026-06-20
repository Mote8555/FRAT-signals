const metrics = require("./metrics.js");

class BacktestEngine {
  async run(strategy, candleData, symbol = "BACKTEST", options = {}) {
    const { initialBalance = 10000, commission = 0.001, slippage = 0.001 } = options;
    const trades = [];
    let balance = initialBalance;
    let openPosition = null;

    function applySlippage(price, side) {
      return side === "BUY" ? price * (1 + slippage) : price * (1 - slippage);
    }

    for (let i = 200; i < candleData.length; i++) {
      const slice = {
        opens: candleData.slice(0, i + 1).map(c => c.open),
        highs: candleData.slice(0, i + 1).map(c => c.high),
        lows: candleData.slice(0, i + 1).map(c => c.low),
        closes: candleData.slice(0, i + 1).map(c => c.close),
        volumes: candleData.slice(0, i + 1).map(c => c.volume),
      };

      if (openPosition) {
        const currentPrice = slice.closes[slice.closes.length - 1];

        if (openPosition.side === "LONG" && currentPrice <= openPosition.stopLoss) {
          const exitPrice = applySlippage(openPosition.stopLoss, "SELL");
          const grossPnl = (exitPrice - openPosition.entryPrice) * openPosition.size;
          const netPnl = grossPnl - (openPosition.entryPrice * openPosition.size * commission);
          balance += netPnl;
          trades.push({ ...openPosition, exitPrice, exitTime: i, pnl: netPnl, exitReason: "SL" });
          openPosition = null;
          continue;
        }

        if (openPosition.side === "LONG" && currentPrice >= openPosition.takeProfit) {
          const exitPrice = applySlippage(openPosition.takeProfit, "SELL");
          const grossPnl = (exitPrice - openPosition.entryPrice) * openPosition.size;
          const netPnl = grossPnl - (openPosition.entryPrice * openPosition.size * commission);
          balance += netPnl;
          trades.push({ ...openPosition, exitPrice, exitTime: i, pnl: netPnl, exitReason: "TP" });
          openPosition = null;
          continue;
        }

        if (openPosition.side === "SHORT" && currentPrice >= openPosition.stopLoss) {
          const exitPrice = applySlippage(openPosition.stopLoss, "BUY");
          const grossPnl = (openPosition.entryPrice - exitPrice) * openPosition.size;
          const netPnl = grossPnl - (openPosition.entryPrice * openPosition.size * commission);
          balance += netPnl;
          trades.push({ ...openPosition, exitPrice, exitTime: i, pnl: netPnl, exitReason: "SL" });
          openPosition = null;
          continue;
        }

        if (openPosition.side === "SHORT" && currentPrice <= openPosition.takeProfit) {
          const exitPrice = applySlippage(openPosition.takeProfit, "BUY");
          const grossPnl = (openPosition.entryPrice - exitPrice) * openPosition.size;
          const netPnl = grossPnl - (openPosition.entryPrice * openPosition.size * commission);
          balance += netPnl;
          trades.push({ ...openPosition, exitPrice, exitTime: i, pnl: netPnl, exitReason: "TP" });
          openPosition = null;
          continue;
        }
      }

      if (!openPosition && balance > 0) {
        const signal = strategy.generateSignal(symbol, slice);
        if (signal) {
          const slDistance = signal.stopLoss ? Math.abs(signal.entryPrice - signal.stopLoss) : 1;
          const positionSize = balance * 0.01 / slDistance;
          const entryPrice = applySlippage(signal.entryPrice, signal.type);
          const commitCost = entryPrice * positionSize;
          if (commitCost <= balance) {
            openPosition = {
              ...signal,
              entryPrice,
              size: Math.round(positionSize * 1000) / 1000,
              entryTime: i,
            };
          }
        }
      }
    }

    if (openPosition) {
      const lastPrice = candleData[candleData.length - 1].close;
      const exitPrice = applySlippage(lastPrice, openPosition.type === "BUY" ? "SELL" : "BUY");
      const grossPnl = openPosition.type === "BUY"
        ? (exitPrice - openPosition.entryPrice) * openPosition.size
        : (openPosition.entryPrice - exitPrice) * openPosition.size;
      const netPnl = grossPnl - (openPosition.entryPrice * openPosition.size * commission);
      balance += netPnl;
      trades.push({ ...openPosition, exitPrice, exitTime: candleData.length - 1, pnl: netPnl, exitReason: "END" });
    }

    const result = metrics.calculate(trades, initialBalance, balance);
    return { ...result, trades };
  }
}

module.exports = new BacktestEngine();
