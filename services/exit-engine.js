class ExitEngine {
  constructor() {
    this.chandelierMultiplier = 3;
    this.atrPeriod = 22;
    this.partialTakeProfitR = 3;
    this.partialSize = 0.5;
  }

  calculateChandelierExit(highs, lows, closes, side) {
    if (closes.length < this.atrPeriod + 1) return null;

    const tr = [];
    for (let i = 1; i < closes.length; i++) {
      const hl = highs[i] - lows[i];
      const hc = Math.abs(highs[i] - closes[i - 1]);
      const lc = Math.abs(lows[i] - closes[i - 1]);
      tr.push(Math.max(hl, hc, lc));
    }

    const atr = this.calculateSMA(tr, this.atrPeriod);
    if (!atr || atr.length === 0) return null;

    const currentATR = atr[atr.length - 1];
    const recentHigh = Math.max(...highs.slice(-this.atrPeriod));
    const recentLow = Math.min(...lows.slice(-this.atrPeriod));

    if (side === "LONG") {
      return recentHigh - currentATR * this.chandelierMultiplier;
    }
    return recentLow + currentATR * this.chandelierMultiplier;
  }

  calculateTrail(currentPrice, entryPrice, side, highestSinceEntry, lowestSinceEntry, atr) {
    if (side === "LONG") {
      const trailStop = highestSinceEntry - atr * 2;
      if (currentPrice < trailStop) return { exit: true, reason: "TRAIL_STOP" };
    } else {
      const trailStop = lowestSinceEntry + atr * 2;
      if (currentPrice > trailStop) return { exit: true, reason: "TRAIL_STOP" };
    }
    return { exit: false, reason: null };
  }

  checkPartialTakeProfit(currentPrice, entryPrice, side, positionSize, stopDistance) {
    const distance = Math.abs(currentPrice - entryPrice);
    const riskUnit = stopDistance || Math.abs(entryPrice * 0.01);
    const rMultiple = riskUnit > 0 ? distance / riskUnit : 0;

    if (rMultiple >= this.partialTakeProfitR) {
      return {
        takePartial: true,
        sizeToSell: positionSize * this.partialSize,
        rMultiple: Math.round(rMultiple * 10) / 10,
      };
    }

    return { takePartial: false, sizeToSell: 0, rMultiple: Math.round(rMultiple * 10) / 10 };
  }

  calculateSMA(values, period) {
    const sma = [];
    for (let i = period - 1; i < values.length; i++) {
      const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }
}

module.exports = new ExitEngine();
