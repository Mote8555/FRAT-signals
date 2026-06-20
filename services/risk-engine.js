class RiskEngine {
  constructor(config = {}) {
    this.defaultRiskPercent = config.riskPercent ?? 1.0;
    this.minPositionSize = config.minPositionSize ?? 0.001;
    this.maxPositionSize = config.maxPositionSize ?? 10;
  }

  calculate(inputs) {
    const accountBalance = inputs.accountBalance ?? 10000;
    const riskPercent = inputs.riskPercent ?? this.defaultRiskPercent;
    const atr = inputs.atr ?? 0;
    const stopDistance = inputs.stopDistance ?? (atr * 2);
    const entryPrice = inputs.entryPrice ?? 0;

    if (entryPrice <= 0 || stopDistance <= 0 || accountBalance <= 0) {
      return { positionSize: 0, riskAmount: 0, error: "Invalid inputs" };
    }

    const riskAmount = (accountBalance * riskPercent) / 100;
    const rawSize = riskAmount / stopDistance;
    const positionSize = Math.max(this.minPositionSize, Math.min(this.maxPositionSize, rawSize));
    const dollarRisk = positionSize * stopDistance;

    const riskReward = inputs.takeProfitDistance && stopDistance > 0
      ? (inputs.takeProfitDistance / stopDistance).toFixed(2)
      : 0;

    return {
      positionSize: Math.round(positionSize * 1000) / 1000,
      riskAmount: Math.round(riskAmount * 100) / 100,
      dollarRisk: Math.round(dollarRisk * 100) / 100,
      riskPercent,
      riskReward: parseFloat(riskReward),
    };
  }

  adjustForRegime(baseSize, regime) {
    if (regime === "STRONG_TRENDING") return baseSize * 1.0;
    if (regime === "TRENDING") return baseSize * 1.0;
    if (regime === "WEAK_TRENDING") return baseSize * 0.5;
    return baseSize * 0.25;
  }
}

module.exports = RiskEngine;
