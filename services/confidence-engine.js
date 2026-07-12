class ConfidenceEngine {
  constructor() {
    this.weights = {
      regime: 30,
      trend: 25,
      momentum: 25,
      btcFilter: 20,
    };
  }

  score(inputs) {
    const weights = this.weights;
    let totalScore = 0;
    let totalWeight = 0;

    const components = [];

    if (inputs.regime) {
      const regimeScore = this.scoreRegime(inputs.regime);
      components.push({ name: "regime", score: regimeScore, weight: weights.regime });
      totalScore += regimeScore * weights.regime;
      totalWeight += weights.regime;
    }

    if (inputs.trend) {
      const trendScore = this.scoreTrend(inputs.trend);
      components.push({ name: "trend", score: trendScore, weight: weights.trend });
      totalScore += trendScore * weights.trend;
      totalWeight += weights.trend;
    }

    if (inputs.momentum !== undefined && inputs.momentum !== null) {
      const macdBullish = inputs.momentum.macdBullish === true;
      const t3Slope = inputs.momentum.t3Slope || 0;
      const currentPrice = inputs.momentum.currentPrice || 0;
      const momentumScore = this.scoreMomentum(macdBullish, t3Slope, currentPrice);
      components.push({ name: "momentum", score: momentumScore, weight: weights.momentum });
      totalScore += momentumScore * weights.momentum;
      totalWeight += weights.momentum;
    }

    if (inputs.btcFilter) {
      const btcScore = this.scoreBTC(inputs.btcFilter);
      components.push({ name: "btcFilter", score: btcScore, weight: weights.btcFilter });
      totalScore += btcScore * weights.btcFilter;
      totalWeight += weights.btcFilter;
    }

    const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
    const grade = this.grade(finalScore);

    return { score: finalScore, grade, components };
  }

  scoreRegime(regime) {
    switch (regime) {
      case "TRENDING": return 100;
      case "MEAN_REVERTING": return 40;
      case "RANDOM": return 10;
      default: return 50;
    }
  }

  scoreTrend(trend) {
    if (trend === "BULLISH" || trend === "BEARISH") return 90;
    if (trend === "NEUTRAL") return 50;
    return 30;
  }

  scoreMomentum(macdBullish, t3Slope, currentPrice = 0) {
    let score = 50;
    if (macdBullish) score += 25;
    if (!macdBullish) score -= 25;

    const relSlope = currentPrice > 0 ? Math.abs(t3Slope / currentPrice) : Math.abs(t3Slope);
    if (relSlope > 0.00002) score += 15;
    if (relSlope < 0.000002) score -= 10;
    return Math.max(0, Math.min(100, score));
  }

  scoreBTC(btcResult) {
    if (!btcResult) return 50;
    if (btcResult.btcTrend === "BULLISH" || btcResult.btcTrend === "BEARISH") {
      return btcResult.score || 75;
    }
    return 40;
  }

  grade(score) {
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    return "IGNORE";
  }

  shouldTrade(grade) {
    return grade !== "IGNORE";
  }
}

module.exports = new ConfidenceEngine();
