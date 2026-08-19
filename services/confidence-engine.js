const config = require("../config.js");

class ConfidenceEngine {
  constructor() {
    this.weights = config.confidence.weights;
  }

  score(inputs) {
    const weights = this.weights;
    let totalScore = 0;
    let totalWeight = 0;

    const components = [];

    if (inputs.regime) {
      const regimeScore = this.scoreRegime(inputs.regime, inputs.hurst, inputs.regimeConfidence);
      components.push({ name: "regime", score: regimeScore, weight: weights.regime });
      totalScore += regimeScore * weights.regime;
      totalWeight += weights.regime;
    }

    if (inputs.trend) {
      const trendScore = this.scoreTrend(inputs.trend, inputs.trendStrength, inputs.trendSlope, inputs.momentum?.currentPrice || 0);
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

  scoreRegime(regime, hurst, regimeConfidence) {
    if (regime !== "TRENDING") return 10;
    // regimeConfidence ranges 60-100 for TRENDING
    // Map 60→50, 80→75, 100→100
    return Math.round(50 + (regimeConfidence - 60) * 1.25);
  }

  scoreTrend(trend, strength, slope, currentPrice) {
    if (trend === "NEUTRAL") return 30;
    let score = 60; // base for passing the gate
    // |strength| is 1 or 2 — bonus for strong (both slope + price position aligned)
    score += Math.abs(strength) * 10;
    // Bonus for strong relative slope (slope normalized by price)
    const relSlope = currentPrice > 0 ? Math.abs(slope / currentPrice) : 0;
    if (relSlope > 0.001) score += 15;
    else if (relSlope > 0.0005) score += 10;
    else if (relSlope > 0.0002) score += 5;
    return Math.min(100, score);
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
    const t = config.confidence.gradeThresholds;
    if (score >= t["A+"]) return "A+";
    if (score >= t.A) return "A";
    if (score >= t.B) return "B";
    if (score >= t.C) return "C";
    return "IGNORE";
  }

  shouldTrade(grade, score, multiplier = 1.0) {
    if (multiplier === 1.0) return grade !== "IGNORE";
    if (grade === "A+" || grade === "A" || grade === "B") return true;
    const t = config.confidence.gradeThresholds;
    return score >= Math.round(t.C * multiplier);
  }
}

module.exports = new ConfidenceEngine();
