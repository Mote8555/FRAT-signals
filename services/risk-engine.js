const config = require("../config.js");

class RiskEngine {
  constructor(overrides = {}) {
    this.defaultRiskPercent = overrides.riskPercent ?? config.risk.riskPercent;
    this.minPositionSize = overrides.minPositionSize ?? config.risk.minPositionSize;
    this.maxPositionSize = overrides.maxPositionSize ?? config.risk.maxPositionSize;
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
    const mult = config.risk.regimeMultipliers[regime] ?? config.risk.regimeMultipliers.default;
    return baseSize * mult;
  }
}

module.exports = RiskEngine;
