class RegimeEngine {
  calculateHurst(prices) {
    if (prices.length < 100) return null;

    const maxLag = Math.min(Math.floor(prices.length / 4), 100);
    const lags = [];
    const rsValues = [];

    for (let lag = 10; lag <= maxLag; lag += 5) {
      const segments = Math.floor(prices.length / lag);
      let rsSum = 0;

      for (let seg = 0; seg < segments; seg++) {
        const start = seg * lag;
        const segment = prices.slice(start, start + lag);
        const mean = segment.reduce((a, b) => a + b, 0) / segment.length;
        const deviations = segment.map(p => p - mean);
        const cumDev = [];
        let cumSum = 0;
        for (const d of deviations) {
          cumSum += d;
          cumDev.push(cumSum);
        }
        const R = Math.max(...cumDev) - Math.min(...cumDev);
        const S = Math.sqrt(segment.reduce((sum, p) => sum + (p - mean) ** 2, 0) / segment.length);
        if (S > 0) rsSum += R / S;
      }

      const avgRS = rsSum / segments;
      lags.push(Math.log(lag));
      rsValues.push(Math.log(avgRS));
    }

    const n = lags.length;
    const sumX = lags.reduce((a, b) => a + b, 0);
    const sumY = rsValues.reduce((a, b) => a + b, 0);
    const sumXY = lags.reduce((sum, x, i) => sum + x * rsValues[i], 0);
    const sumX2 = lags.reduce((sum, x) => sum + x * x, 0);

    const hurst = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return Math.max(0, Math.min(1, hurst));
  }

  calculateDFA(prices) {
    if (prices.length < 100) return null;

    const profile = [];
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    let cumSum = 0;
    for (const p of prices) {
      cumSum += p - mean;
      profile.push(cumSum);
    }

    const minLag = 10;
    const maxLag = Math.min(Math.floor(prices.length / 4), 100);
    const lags = [];
    const flucts = [];

    for (let lag = minLag; lag <= maxLag; lag += 5) {
      const segments = Math.floor(profile.length / lag);
      let f2Sum = 0;

      for (let seg = 0; seg < segments; seg++) {
        const start = seg * lag;
        const segment = profile.slice(start, start + lag);
        const x = Array.from({ length: segment.length }, (_, i) => i);
        const n = segment.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = segment.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((s, xi, i) => s + xi * segment[i], 0);
        const sumX2 = x.reduce((s, xi) => s + xi * xi, 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        let residual = 0;
        for (let i = 0; i < segment.length; i++) {
          residual += (segment[i] - (slope * i + intercept)) ** 2;
        }
        f2Sum += residual / segment.length;
      }

      const F = Math.sqrt(f2Sum / segments);
      lags.push(Math.log(lag));
      flucts.push(Math.log(F));
    }

    const n = lags.length;
    const sumX = lags.reduce((a, b) => a + b, 0);
    const sumY = flucts.reduce((a, b) => a + b, 0);
    const sumXY = lags.reduce((sum, x, i) => sum + x * flucts[i], 0);
    const sumX2 = lags.reduce((sum, x) => sum + x * x, 0);

    const alpha = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return Math.max(0, Math.min(2, alpha));
  }

  detectRegime(prices) {
    const hurst = this.calculateHurst(prices);
    const dfa = this.calculateDFA(prices);

    if (hurst === null) return { regime: "UNKNOWN", hurst: 0, dfa: 0, confidence: 0 };

    let regime;
    let confidence;

    if (hurst > 0.55) {
      regime = "TRENDING";
      confidence = Math.min(100, Math.round((hurst - 0.55) * 200 + 60));
    } else if (hurst >= 0.45) {
      regime = "RANDOM";
      confidence = Math.min(100, Math.round((1 - Math.abs(hurst - 0.5) * 2) * 100));
    } else {
      regime = "MEAN_REVERTING";
      confidence = Math.min(100, Math.round((0.45 - hurst) * 200 + 60));
    }

    if (dfa !== null) {
      if (dfa > 1.0 && hurst > 0.55) confidence = Math.min(100, confidence + 10);
      if (dfa < 0.5 && hurst < 0.45) confidence = Math.min(100, confidence + 10);
    }

    return { regime, hurst: Math.round(hurst * 100) / 100, dfa: dfa ? Math.round(dfa * 100) / 100 : null, confidence };
  }
}

module.exports = new RegimeEngine();
