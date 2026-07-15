const metrics = require("./metrics.js");
const ExitEngine = require("../services/exit-engine.js");
const RiskEngine = require("../services/risk-engine.js");
const TimeframeFilter = require("../services/timeframe-filter.js");

class BacktestEngine {
  async run(strategy, candleData, symbol = "BACKTEST", options = {}) {
    const {
      initialBalance = 10000,
      commission = 0.001,
      slippage = 0.001,
      btcCloses = null,
    } = options;

    const riskEngine = new RiskEngine({ riskPercent: 1.0 });
    const trades = [];
    let balance = initialBalance;
    let openPosition = null;
    let highestSinceEntry = null;
    let lowestSinceEntry = null;
    let partialTaken = false;

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

      const currentPrice = slice.closes[slice.closes.length - 1];

      // Build BTC slice for this candle index
      const btcSlice = btcCloses ? btcCloses.slice(0, i + 1) : null;

      // Build 4H trend from downsampling 1H candles (every 4th candle)
      let validatingTrend = null;
      if (i >= 4) {
        const fourHourCloses = [];
        for (let j = 0; j <= i; j += 4) {
          fourHourCloses.push(candleData[j].close);
        }
        if (fourHourCloses.length > 65) {
          validatingTrend = TimeframeFilter.evaluateTrend(fourHourCloses, 60).trend;
        }
      }

      // --- Manage open position ---
      if (openPosition) {
        // Track highest/lowest since entry for trailing stops
        if (openPosition.side === "LONG") {
          highestSinceEntry = highestSinceEntry === null ? currentPrice : Math.max(highestSinceEntry, currentPrice);
          lowestSinceEntry = lowestSinceEntry === null ? currentPrice : Math.min(lowestSinceEntry, currentPrice);
        } else {
          highestSinceEntry = highestSinceEntry === null ? currentPrice : Math.max(highestSinceEntry, currentPrice);
          lowestSinceEntry = lowestSinceEntry === null ? currentPrice : Math.min(lowestSinceEntry, currentPrice);
        }

        // --- Chandelier exit: tighten stop if trailing is closer ---
        const chandelierStop = ExitEngine.calculateChandelierExit(
          slice.highs, slice.lows, slice.closes, openPosition.side
        );
        if (chandelierStop !== null) {
          if (openPosition.side === "LONG" && chandelierStop > openPosition.stopLoss) {
            openPosition.stopLoss = chandelierStop;
          }
          if (openPosition.side === "SHORT" && chandelierStop < openPosition.stopLoss) {
            openPosition.stopLoss = chandelierStop;
          }
        }

        // --- ATR-based trailing stop ---
        const atr = strategy.calculateATR(slice.highs, slice.lows, slice.closes);
        if (atr && atr.length > 0) {
          const currentATR = atr[atr.length - 1];
          const trail = ExitEngine.calculateTrail(
            currentPrice, openPosition.entryPrice, openPosition.side,
            highestSinceEntry, lowestSinceEntry, currentATR
          );
          if (trail.exit) {
            const exitPrice = applySlippage(currentPrice, openPosition.side === "LONG" ? "SELL" : "BUY");
            const grossPnl = openPosition.side === "LONG"
              ? (exitPrice - openPosition.entryPrice) * openPosition.size
              : (openPosition.entryPrice - exitPrice) * openPosition.size;
            const entryCost = openPosition.entryPrice * openPosition.size * commission;
            const exitCost = exitPrice * openPosition.size * commission;
            const netPnl = grossPnl - entryCost - exitCost;
            balance += netPnl;
            trades.push({ ...openPosition, exitPrice, exitTime: i, pnl: netPnl, exitReason: "TRAIL_STOP" });
            openPosition = null;
            highestSinceEntry = null;
            lowestSinceEntry = null;
            partialTaken = false;
            continue;
          }
        }

        // --- Partial take profit at 3R ---
        if (!partialTaken) {
          const partial = ExitEngine.checkPartialTakeProfit(
            currentPrice, openPosition.entryPrice, openPosition.side,
            openPosition.size, openPosition.stopDistance
          );
          if (partial.takePartial) {
            const partialSize = partial.sizeToSell;
            const exitPrice = applySlippage(currentPrice, openPosition.side === "LONG" ? "SELL" : "BUY");
            const grossPnl = openPosition.side === "LONG"
              ? (exitPrice - openPosition.entryPrice) * partialSize
              : (openPosition.entryPrice - exitPrice) * partialSize;
            const entryCost = openPosition.entryPrice * partialSize * commission;
            const exitCost = exitPrice * partialSize * commission;
            const netPnl = grossPnl - entryCost - exitCost;
            balance += netPnl;
            openPosition.size -= partialSize;
            openPosition.stopLoss = openPosition.entryPrice; // move SL to breakeven
            partialTaken = true;
            trades.push({
              ...openPosition,
              side: openPosition.side,
              exitPrice,
              exitTime: i,
              pnl: netPnl,
              exitReason: `PARTIAL_${partial.rMultiple}R`,
              size: partialSize,
            });
          }
        }

        // --- Standard SL/TP check ---
        if (openPosition.side === "LONG" && currentPrice <= openPosition.stopLoss) {
          const exitPrice = applySlippage(openPosition.stopLoss, "SELL");
          const grossPnl = (exitPrice - openPosition.entryPrice) * openPosition.size;
          const entryCost = openPosition.entryPrice * openPosition.size * commission;
          const exitCost = exitPrice * openPosition.size * commission;
          const netPnl = grossPnl - entryCost - exitCost;
          balance += netPnl;
          trades.push({ ...openPosition, exitPrice, exitTime: i, pnl: netPnl, exitReason: "SL" });
          openPosition = null;
          highestSinceEntry = null;
          lowestSinceEntry = null;
          partialTaken = false;
          continue;
        }

        if (openPosition.side === "LONG" && currentPrice >= openPosition.takeProfit) {
          const exitPrice = applySlippage(openPosition.takeProfit, "SELL");
          const grossPnl = (exitPrice - openPosition.entryPrice) * openPosition.size;
          const entryCost = openPosition.entryPrice * openPosition.size * commission;
          const exitCost = exitPrice * openPosition.size * commission;
          const netPnl = grossPnl - entryCost - exitCost;
          balance += netPnl;
          trades.push({ ...openPosition, exitPrice, exitTime: i, pnl: netPnl, exitReason: "TP" });
          openPosition = null;
          highestSinceEntry = null;
          lowestSinceEntry = null;
          partialTaken = false;
          continue;
        }

        if (openPosition.side === "SHORT" && currentPrice >= openPosition.stopLoss) {
          const exitPrice = applySlippage(openPosition.stopLoss, "BUY");
          const grossPnl = (openPosition.entryPrice - exitPrice) * openPosition.size;
          const entryCost = openPosition.entryPrice * openPosition.size * commission;
          const exitCost = exitPrice * openPosition.size * commission;
          const netPnl = grossPnl - entryCost - exitCost;
          balance += netPnl;
          trades.push({ ...openPosition, exitPrice, exitTime: i, pnl: netPnl, exitReason: "SL" });
          openPosition = null;
          highestSinceEntry = null;
          lowestSinceEntry = null;
          partialTaken = false;
          continue;
        }

        if (openPosition.side === "SHORT" && currentPrice <= openPosition.takeProfit) {
          const exitPrice = applySlippage(openPosition.takeProfit, "BUY");
          const grossPnl = (openPosition.entryPrice - exitPrice) * openPosition.size;
          const entryCost = openPosition.entryPrice * openPosition.size * commission;
          const exitCost = exitPrice * openPosition.size * commission;
          const netPnl = grossPnl - entryCost - exitCost;
          balance += netPnl;
          trades.push({ ...openPosition, exitPrice, exitTime: i, pnl: netPnl, exitReason: "TP" });
          openPosition = null;
          highestSinceEntry = null;
          lowestSinceEntry = null;
          partialTaken = false;
          continue;
        }
      }

      // --- Check for new signal ---
      if (!openPosition && balance > 0) {
        const signal = strategy.generateSignal(symbol, slice, {
          btcPrices: btcSlice,
          validatingTrend,
        });
        if (signal) {
          const slDistance = signal.stopLoss ? Math.abs(signal.entryPrice - signal.stopLoss) : 1;

          // Use RiskEngine with regime-adjusted sizing
          const riskResult = riskEngine.calculate({
            accountBalance: balance,
            stopDistance: slDistance,
            entryPrice: signal.entryPrice,
          });
          let positionSize = riskResult.positionSize;
          positionSize = riskEngine.adjustForRegime(positionSize, signal.regimeStrength);

          const entryPrice = applySlippage(signal.entryPrice, signal.type);
          const entryCost = entryPrice * positionSize * commission;
          const commitCost = entryPrice * positionSize + entryCost;

          if (commitCost <= balance && positionSize > 0) {
            balance -= entryCost;
            openPosition = {
              ...signal,
              side: signal.type === "BUY" ? "LONG" : "SHORT",
              entryPrice,
              size: Math.round(positionSize * 1000) / 1000,
              entryTime: i,
            };
            highestSinceEntry = entryPrice;
            lowestSinceEntry = entryPrice;
            partialTaken = false;
          }
        }
      }
    }

    // Force close any remaining position
    if (openPosition) {
      const lastPrice = candleData[candleData.length - 1].close;
      const exitPrice = applySlippage(lastPrice, openPosition.type === "BUY" ? "SELL" : "BUY");
      const grossPnl = openPosition.type === "BUY"
        ? (exitPrice - openPosition.entryPrice) * openPosition.size
        : (openPosition.entryPrice - exitPrice) * openPosition.size;
      const entryCost = openPosition.entryPrice * openPosition.size * commission;
      const exitCost = exitPrice * openPosition.size * commission;
      const netPnl = grossPnl - entryCost - exitCost;
      balance += netPnl;
      trades.push({ ...openPosition, exitPrice, exitTime: candleData.length - 1, pnl: netPnl, exitReason: "END" });
    }

    const result = metrics.calculate(trades, initialBalance, balance);
    return { ...result, trades };
  }
}

module.exports = new BacktestEngine();
