class MetricsCalculator {
  calculate(trades, initialBalance, finalBalance) {
    const totalTrades = trades.length;
    if (totalTrades === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        profitFactor: 0,
        sharpeRatio: 0,
        sortinoRatio: 0,
        maxDrawdown: 0,
        cagr: 0,
        totalReturn: 0,
        netProfit: 0,
      };
    }

    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl <= 0);
    const winRate = (winningTrades.length / totalTrades) * 100;

    const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    const totalReturn = initialBalance > 0
      ? ((finalBalance - initialBalance) / initialBalance) * 100
      : 0;

    const returns = trades.map(t => t.pnl / initialBalance);

    const avgReturn = returns.length > 0
      ? returns.reduce((a, b) => a + b, 0) / returns.length
      : 0;

    const variance = returns.length > 1
      ? returns.reduce((sum, r) => sum + (r - avgReturn) ** 2, 0) / (returns.length - 1)
      : 0;

    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

    const negativeReturns = returns.filter(r => r < 0);
    const downsideVariance = negativeReturns.length > 1
      ? negativeReturns.reduce((sum, r) => sum + r ** 2, 0) / negativeReturns.length
      : 0;

    const downsideDev = Math.sqrt(downsideVariance);
    const sortinoRatio = downsideDev > 0 ? (avgReturn / downsideDev) * Math.sqrt(252) : 0;

    let peak = initialBalance;
    let maxDrawdown = 0;
    let runningBalance = initialBalance;

    for (const trade of trades) {
      runningBalance += trade.pnl;
      if (runningBalance > peak) {
        peak = runningBalance;
      }
      const drawdown = ((peak - runningBalance) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    const totalDays = trades.length * 1;
    const years = totalDays / 365;
    const cagr = years > 0 && initialBalance > 0 && finalBalance > 0
      ? (Math.pow(finalBalance / initialBalance, 1 / years) - 1) * 100
      : 0;

    return {
      totalTrades,
      winRate: Math.round(winRate * 100) / 100,
      profitFactor: Math.round(profitFactor * 100) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      sortinoRatio: Math.round(sortinoRatio * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      cagr: Math.round(cagr * 100) / 100,
      totalReturn: Math.round(totalReturn * 100) / 100,
      netProfit: Math.round((finalBalance - initialBalance) * 100) / 100,
      avgProfit: Math.round((grossProfit / (winningTrades.length || 1)) * 100) / 100,
      avgLoss: Math.round((grossLoss / (losingTrades.length || 1)) * 100) / 100,
    };
  }
}

module.exports = new MetricsCalculator();
