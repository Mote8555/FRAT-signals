/**
 * FRAT-Signals Optimizer — Parameter Sweep Harness
 *
 * Usage:
 *   node backtesting/optimize.js --symbol=BNB/USDT --timeframes=4h,1h,15m --limit=500
 *   node backtesting/optimize.js --symbol=BNB/USDT --timeframe=1d --limit=500
 *   node backtesting/optimize.js --sweep=kama       # sweep only KAMA params
 *   node backtesting/optimize.js --sweep=all        # sweep everything
 *
 * Multi-timeframe mode (--timeframes=4h,1h,15m):
 *   - Fetches data for each timeframe separately
 *   - Runs the same parameter sweep on each
 *   - Prints per-TF ranked tables + cross-TF aggregated summary
 *   - Identifies best overall and best per TF
 *
 * Results are ranked by composite score:
 *   score = sharpe * 0.4 + sortino * 0.3 + profitFactor * 0.2 - maxDrawdown * 0.1
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

// ── CLI args ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name, fallback) {
  for (const arg of args) {
    if (arg === `--${name}`) {
      const idx = args.indexOf(arg);
      return args[idx + 1] || fallback;
    }
    if (arg.startsWith(`--${name}=`)) {
      return arg.slice(`--${name}=`.length);
    }
  }
  return fallback;
}
const symbol = getArg("symbol", "BNB/USDT");
const timeframesArg = getArg("timeframes", "");
const singleTimeframe = getArg("timeframe", "1d");
const limit = getArg("limit", "500");
const sweepType = getArg("sweep", "all");

const timeframes = timeframesArg
  ? timeframesArg.split(",").map(t => t.trim())
  : [singleTimeframe];

const workerPath = path.join(__dirname, "optimize-worker.js");

// ── Fetch data for a timeframe ────────────────────────────────────────
async function fetchData(tf) {
  const KrakenExchange = require("../services/exchange/kraken.js");
  const kraken = new KrakenExchange();

  const dataFile = path.join(os.tmpdir(), `frat-opt-data-${tf}-${Date.now()}.json`);

  console.log(`\nFetching ${symbol} ${tf} × ${limit} candles from Kraken...`);
  const ohlcv = await kraken.fetchOHLCV(symbol, tf, limit);
  if (!ohlcv || ohlcv.length < 201) {
    console.error(`  Need at least 201 candles for ${tf}, got ${ohlcv ? ohlcv.length : 0}`);
    return null;
  }
  console.log(`  Got ${ohlcv.length} candles (${new Date(ohlcv[0].timestamp).toISOString().slice(0,10)} → ${new Date(ohlcv[ohlcv.length-1].timestamp).toISOString().slice(0,10)})`);

  let btcCloses = null;
  if (!symbol.startsWith("BTC/")) {
    const btcData = await kraken.fetchOHLCV("BTC/USDT", tf, limit);
    if (btcData && btcData.length > 200) {
      btcCloses = btcData.map(c => c.close);
      console.log(`  Got ${btcData.length} BTC candles`);
    }
  }

  const payload = { ohlcv, btcCloses, timeframe: tf };
  fs.writeFileSync(dataFile, JSON.stringify(payload));
  console.log(`  Saved to ${dataFile}`);
  return dataFile;
}

// ── Parameter grids ───────────────────────────────────────────────────
const grids = {
  kama: {
    label: "KAMA",
    params: ["kama.period", "kama.fast", "kama.slow"],
    values: [
      [5, 2, 20],
      [5, 1, 30],
      [8, 2, 25],
      [10, 2, 30],   // baseline
      [10, 1, 40],
      [12, 2, 35],
      [15, 2, 40],
      [15, 1, 50],
      [20, 2, 50],
      [20, 3, 60],
    ],
  },
  t3: {
    label: "T3",
    params: ["t3.period", "t3.volumeFactor"],
    values: [
      [5, 0.5],
      [5, 0.7],
      [6, 0.6],
      [8, 0.5],
      [8, 0.7],     // baseline
      [8, 0.8],
      [10, 0.6],
      [10, 0.7],
      [12, 0.7],
      [12, 0.8],
    ],
  },
  vwmacd: {
    label: "VW-MACD",
    params: ["vwmacd.fast", "vwmacd.slow", "vwmacd.signal"],
    values: [
      [8, 21, 7],
      [8, 26, 9],
      [10, 22, 7],
      [12, 26, 9],   // baseline
      [12, 30, 9],
      [12, 26, 7],
      [15, 30, 10],
      [8, 21, 5],
    ],
  },
  regime: {
    label: "Regime",
    params: ["regime.trendingThreshold", "regime.randomLower"],
    values: [
      [0.50, 0.40],
      [0.52, 0.42],
      [0.53, 0.43],
      [0.55, 0.45],   // baseline
      [0.57, 0.45],
      [0.58, 0.45],
      [0.60, 0.45],
    ],
  },
  exits: {
    label: "Exits",
    params: [
      "exit.chandelierMultiplier",
      "exit.trailMultiplier",
      "exit.partialTakeProfitR",
      "adaptiveTargets.STRONG_TRENDING.tp",
      "adaptiveTargets.TRENDING.tp",
    ],
    values: [
      [2, 1.5, 2, 6, 4],
      [2, 2, 3, 6, 4],
      [2.5, 2, 3, 8, 5],
      [3, 2, 3, 8, 5],    // baseline
      [3, 2.5, 4, 8, 5],
      [3, 3, 3, 10, 6],
      [4, 2, 3, 8, 5],
      [3, 1.5, 2, 6, 4],
    ],
  },
  confidence: {
    label: "Confidence",
    params: [
      "confidence.gradeThresholds.C",
      "confidence.weights.regime",
      "confidence.weights.momentum",
    ],
    values: [
      [50, 35, 30],
      [55, 30, 25],
      [60, 30, 25],    // baseline (C=60)
      [60, 35, 30],
      [65, 30, 25],
      [70, 30, 25],
      [50, 25, 30],
    ],
  },
};

// ── Build test cases ──────────────────────────────────────────────────
function buildTestCases() {
  const testCases = [];
  if (sweepType === "all") {
    for (const key of Object.keys(grids)) {
      for (const values of grids[key].values) {
        testCases.push({ group: grids[key].label, params: grids[key].params, values });
      }
    }
  } else if (grids[sweepType]) {
    const g = grids[sweepType];
    for (const values of g.values) {
      testCases.push({ group: g.label, params: g.params, values });
    }
  } else {
    console.error(`Unknown sweep: ${sweepType}. Use: all, kama, t3, vwmacd, regime, exits, confidence`);
    process.exit(1);
  }
  return testCases;
}

// ── Composite score ───────────────────────────────────────────────────
function compositeScore(r) {
  const pf = isFinite(r.profitFactor) ? r.profitFactor : 0;
  return (r.sharpeRatio || 0) * 0.4
       + (r.sortinoRatio || 0) * 0.3
       + pf * 0.2
       - (r.maxDrawdown || 0) * 0.1;
}

// ── Run sweep for one timeframe ───────────────────────────────────────
async function runSweep(tf, dataFile, testCases) {
  console.log(`\n${"═".repeat(130)}`);
  console.log(`  TIMEFRAME: ${tf.toUpperCase()} — ${testCases.length} combinations`);
  console.log(`${"═".repeat(130)}\n`);

  const results = [];

  for (let idx = 0; idx < testCases.length; idx++) {
    const tc = testCases[idx];
    const overrides = {};
    for (let i = 0; i < tc.params.length; i++) {
      const keys = tc.params[i].split(".");
      let obj = overrides;
      for (let k = 0; k < keys.length - 1; k++) {
        if (!obj[keys[k]]) obj[keys[k]] = {};
        obj = obj[keys[k]];
      }
      obj[keys[keys.length - 1]] = tc.values[i];
    }

    const overrideJSON = JSON.stringify(overrides);
    const overrideFile = path.join(os.tmpdir(), `frat-opt-override-${tf}-${Date.now()}.json`);
    fs.writeFileSync(overrideFile, overrideJSON);
    const cmd = `node "${workerPath}" --dataFile="${dataFile}" --overrideFile="${overrideFile}" --timeframe="${tf}"`;

    process.stdout.write(`[${idx + 1}/${testCases.length}] ${tc.group} ${JSON.stringify(tc.values)} ... `);

    try {
      const output = execSync(cmd, { encoding: "utf-8", timeout: 120000, stdio: ["pipe", "pipe", "pipe"] });
      fs.unlinkSync(overrideFile);
      const parsed = JSON.parse(output.trim());
      const score = compositeScore(parsed);
      results.push({ ...tc, result: parsed, score, timeframe: tf });
      console.log(`trades=${parsed.totalTrades} wr=${(parsed.winRate||0).toFixed(1)}% pf=${(parsed.profitFactor||0).toFixed(2)} sharpe=${(parsed.sharpeRatio||0).toFixed(2)} dd=${(parsed.maxDrawdown||0).toFixed(1)}% score=${score.toFixed(2)}`);
    } catch (err) {
      const stderr = err.stderr ? err.stderr.toString().slice(0, 100) : "";
      console.log(`FAILED: ${err.message.slice(0, 80)} ${stderr}`);
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

// ── Print ranked table for one timeframe ──────────────────────────────
function printPerTFTable(tf, results) {
  console.log(`\n${"─".repeat(130)}`);
  console.log(`  ${tf.toUpperCase()} — TOP 10 (composite = sharpe×0.4 + sortino×0.3 + pf×0.2 − dd×0.1)`);
  console.log(`${"─".repeat(130)}`);

  console.log(`${"Rank".padStart(4)} | ${"Group".padEnd(10)} | ${"Params".padEnd(40)} | ${"Trd".padStart(4)} | ${"WR%".padStart(6)} | ${"PF".padStart(6)} | ${"Sharpe".padStart(6)} | ${"Sortino".padStart(7)} | ${"DD%".padStart(6)} | ${"$Net".padStart(9)} | ${"Score".padStart(6)}`);
  console.log("─".repeat(130));

  const top = results.slice(0, 10);
  for (let i = 0; i < top.length; i++) {
    const r = top[i];
    const res = r.result;
    const paramStr = r.params.map((p, j) => `${p.split(".").pop()}=${r.values[j]}`).join(", ");
    const marker = i === 0 ? " ◀ BEST" : "";
    console.log(
      `${String(i + 1).padStart(4)} | ${r.group.padEnd(10)} | ${paramStr.padEnd(40)} | ${String(res.totalTrades).padStart(4)} | ${(res.winRate||0).toFixed(1).padStart(6)} | ${(isFinite(res.profitFactor)?res.profitFactor:0).toFixed(2).padStart(6)} | ${(res.sharpeRatio||0).toFixed(2).padStart(6)} | ${(res.sortinoRatio||0).toFixed(2).padStart(7)} | ${(res.maxDrawdown||0).toFixed(1).padStart(6)} | ${(res.netProfit||0).toFixed(0).padStart(9)} | ${r.score.toFixed(2).padStart(6)}${marker}`
    );
  }

  // Per-group best for this TF
  console.log(`\n  BEST PER GROUP (${tf.toUpperCase()}):`);
  const groups = [...new Set(results.map(r => r.group))];
  for (const g of groups) {
    const best = results.filter(r => r.group === g)[0];
    if (!best) continue;
    const res = best.result;
    const paramStr = best.params.map((p, j) => `${p.split(".").pop()}=${best.values[j]}`).join(", ");
    console.log(`    ${g.padEnd(10)} → ${paramStr}  (score=${best.score.toFixed(2)})`);
  }
}

// ── Cross-timeframe aggregated summary ────────────────────────────────
function printCrossTFSummary(allTFResults) {
  console.log(`\n${"═".repeat(130)}`);
  console.log("  CROSS-TIMEFRAME SUMMARY");
  console.log(`${"═".repeat(130)}`);

  // Build a map: paramKey → { group, params, values, scores per TF, avgScore }
  const paramMap = new Map();

  for (const [tf, results] of Object.entries(allTFResults)) {
    for (const r of results) {
      const key = JSON.stringify(r.values);
      if (!paramMap.has(key)) {
        paramMap.set(key, {
          group: r.group,
          params: r.params,
          values: r.values,
          scores: {},
          results: {},
        });
      }
      const entry = paramMap.get(key);
      entry.scores[tf] = r.score;
      entry.results[tf] = r.result;
    }
  }

  // Calculate average score across all TFs
  const tfs = Object.keys(allTFResults);
  const aggregated = [];
  for (const [, entry] of paramMap) {
    const tfScores = tfs.map(tf => entry.scores[tf] || 0);
    entry.avgScore = tfScores.reduce((a, b) => a + b, 0) / tfs.length;
    entry.minScore = Math.min(...tfScores);
    entry.maxScore = Math.max(...tfScores);
    entry.scoreVariance = entry.maxScore - entry.minScore;
    aggregated.push(entry);
  }

  aggregated.sort((a, b) => b.avgScore - a.avgScore);

  // Print top 15 overall
  console.log(`\n  TOP 15 BY AVERAGE SCORE ACROSS ${tfs.length} TIMEFRAMES:`);
  console.log(`${"─".repeat(130)}`);

  const tfHeaders = tfs.map(tf => tf.toUpperCase().padStart(8)).join(" | ");
  console.log(`${"Rank".padStart(4)} | ${"Group".padEnd(10)} | ${"Params".padEnd(35)} | ${"AvgSc".padStart(6)} | ${"MinSc".padStart(6)} | ${"MaxSc".padStart(6)} | ${"Var".padStart(5)} | ${tfHeaders}`);
  console.log("─".repeat(130));

  const top = aggregated.slice(0, 15);
  for (let i = 0; i < top.length; i++) {
    const e = top[i];
    const paramStr = e.params.map((p, j) => `${p.split(".").pop()}=${e.values[j]}`).join(", ");
    const tfScores = tfs.map(tf => (e.scores[tf] || 0).toFixed(2).padStart(8)).join(" | ");
    const marker = i === 0 ? " ◀ BEST" : "";
    console.log(
      `${String(i + 1).padStart(4)} | ${e.group.padEnd(10)} | ${paramStr.padEnd(35)} | ${e.avgScore.toFixed(2).padStart(6)} | ${e.minScore.toFixed(2).padStart(6)} | ${e.maxScore.toFixed(2).padStart(6)} | ${e.scoreVariance.toFixed(2).padStart(5)} | ${tfScores}${marker}`
    );
  }

  // Best per TF
  console.log(`\n  BEST PER TIMEFRAME:`);
  for (const tf of tfs) {
    const tfResults = allTFResults[tf];
    if (!tfResults || tfResults.length === 0) continue;
    const best = tfResults[0];
    const paramStr = best.params.map((p, j) => `${p.split(".").pop()}=${best.values[j]}`).join(", ");
    const res = best.result;
    console.log(`    ${tf.toUpperCase().padEnd(4)} → ${paramStr}`);
    console.log(`           trades=${res.totalTrades}  wr=${res.winRate}%  pf=${res.profitFactor}  sharpe=${res.sharpeRatio}  dd=${res.maxDrawdown}%  $${res.netProfit}  score=${best.score.toFixed(2)}`);
  }

  // Consistency analysis: which params appear in top 3 of ALL timeframes
  console.log(`\n  CONSISTENCY ANALYSIS (params in top 3 of every TF):`);
  const consistent = aggregated.filter(e => {
    return tfs.every(tf => {
      const tfResults = allTFResults[tf] || [];
      const rank = tfResults.findIndex(r => JSON.stringify(r.values) === JSON.stringify(e.values));
      return rank >= 0 && rank < 3;
    });
  });

  if (consistent.length > 0) {
    for (const e of consistent) {
      const paramStr = e.params.map((p, j) => `${p.split(".").pop()}=${e.values[j]}`).join(", ");
      console.log(`    ${e.group.padEnd(10)} → ${paramStr}  (avg=${e.avgScore.toFixed(2)}, consistent across all TFs)`);
    }
  } else {
    console.log("    No parameter combo appears in top 3 of every timeframe.");
    console.log("    Showing params in top 5 of at least 2 TFs:");
    const top5Consistent = aggregated.filter(e => {
      let count = 0;
      for (const tf of tfs) {
        const tfResults = allTFResults[tf] || [];
        const rank = tfResults.findIndex(r => JSON.stringify(r.values) === JSON.stringify(e.values));
        if (rank >= 0 && rank < 5) count++;
      }
      return count >= 2;
    });
    for (const e of top5Consistent.slice(0, 10)) {
      const paramStr = e.params.map((p, j) => `${p.split(".").pop()}=${e.values[j]}`).join(", ");
      let tfsInTop5 = [];
      for (const tf of tfs) {
        const tfResults = allTFResults[tf] || [];
        const rank = tfResults.findIndex(r => JSON.stringify(r.values) === JSON.stringify(e.values));
        if (rank >= 0 && rank < 5) tfsInTop5.push(`${tf}=#${rank + 1}`);
      }
      console.log(`    ${e.group.padEnd(10)} → ${paramStr}  (${tfsInTop5.join(", ")})`);
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  const testCases = buildTestCases();

  console.log(`\nFRAT Multi-Timeframe Optimizer`);
  console.log(`  Symbol:     ${symbol}`);
  console.log(`  Timeframes: ${timeframes.join(", ")}`);
  console.log(`  Sweep:      ${sweepType} (${testCases.length} combinations)`);
  console.log(`  Limit:      ${limit} candles per TF`);

  const allTFResults = {};
  const dataFiles = [];

  for (const tf of timeframes) {
    const dataFile = await fetchData(tf);
    if (!dataFile) {
      console.log(`Skipping ${tf} — insufficient data`);
      continue;
    }
    dataFiles.push(dataFile);
    const results = await runSweep(tf, dataFile, testCases);
    allTFResults[tf] = results;
    printPerTFTable(tf, results);
  }

  // Cleanup data files
  for (const f of dataFiles) {
    try { fs.unlinkSync(f); } catch {}
  }

  // Cross-TF summary (only if multiple TFs)
  if (timeframes.length > 1) {
    printCrossTFSummary(allTFResults);
  } else {
    // Single TF — just print the full ranked table
    const tf = timeframes[0];
    const results = allTFResults[tf];
    if (results && results.length > 0) {
      console.log(`\n${"═".repeat(130)}`);
      console.log("RANKED RESULTS (composite = sharpe×0.4 + sortino×0.3 + pf×0.2 − dd×0.1)");
      console.log(`${"═".repeat(130)}\n`);

      console.log(`${"Rank".padStart(4)} | ${"Group".padEnd(10)} | ${"Params".padEnd(40)} | ${"Trd".padStart(4)} | ${"WR%".padStart(6)} | ${"PF".padStart(6)} | ${"Sharpe".padStart(6)} | ${"Sortino".padStart(7)} | ${"DD%".padStart(6)} | ${"Ret%".padStart(7)} | ${"$Net".padStart(9)} | ${"Score".padStart(6)}`);
      console.log("─".repeat(130));

      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        const res = r.result;
        const paramStr = r.params.map((p, j) => `${p.split(".").pop()}=${r.values[j]}`).join(", ");
        const marker = i === 0 ? " ◀ BEST" : "";
        console.log(
          `${String(i + 1).padStart(4)} | ${r.group.padEnd(10)} | ${paramStr.padEnd(40)} | ${String(res.totalTrades).padStart(4)} | ${(res.winRate||0).toFixed(1).padStart(6)} | ${(isFinite(res.profitFactor)?res.profitFactor:0).toFixed(2).padStart(6)} | ${(res.sharpeRatio||0).toFixed(2).padStart(6)} | ${(res.sortinoRatio||0).toFixed(2).padStart(7)} | ${(res.maxDrawdown||0).toFixed(1).padStart(6)} | ${(res.totalReturn||0).toFixed(1).padStart(7)} | ${(res.netProfit||0).toFixed(0).padStart(9)} | ${r.score.toFixed(2).padStart(6)}${marker}`
        );
      }

      console.log(`\n${"═".repeat(130)}`);
      console.log("BEST PER GROUP:");
      console.log(`${"═".repeat(130)}`);
      const groups = [...new Set(results.map(r => r.group))];
      for (const g of groups) {
        const best = results.filter(r => r.group === g)[0];
        if (!best) continue;
        const res = best.result;
        const paramStr = best.params.map((p, j) => `${p.split(".").pop()}=${best.values[j]}`).join(", ");
        console.log(`  ${g.padEnd(10)} → ${paramStr}`);
        console.log(`             trades=${res.totalTrades}  wr=${res.winRate}%  pf=${res.profitFactor}  sharpe=${res.sharpeRatio}  dd=${res.maxDrawdown}%  $${res.netProfit}`);
      }

      const baseline = results.find(r =>
        r.group === "KAMA" && r.values[0] === 10 && r.values[1] === 2 && r.values[2] === 30
      );
      if (baseline) {
        const b = baseline.result;
        const best = results[0];
        const bv = best.result;
        console.log(`\n${"═".repeat(130)}`);
        console.log("BASELINE vs OVERALL BEST:");
        console.log(`  Baseline: KAMA(10,2,30) → trades=${b.totalTrades}  wr=${b.winRate}%  pf=${b.profitFactor}  sharpe=${b.sharpeRatio}  dd=${b.maxDrawdown}%  $${b.netProfit}`);
        console.log(`  Best:     ${best.group}(${best.params.map((p,j)=>p.split(".").pop()+"="+best.values[j]).join(", ")}) → trades=${bv.totalTrades}  wr=${bv.winRate}%  pf=${bv.profitFactor}  sharpe=${bv.sharpeRatio}  dd=${bv.maxDrawdown}%  $${bv.netProfit}`);
        const delta = ((bv.netProfit - b.netProfit) / Math.abs(b.netProfit || 1) * 100).toFixed(1);
        console.log(`  Delta:    $${(bv.netProfit - b.netProfit).toFixed(2)} (${delta}%)`);
      }
    }
  }

  console.log("");
}

main().catch(err => {
  console.error("Optimizer failed:", err.message);
  process.exit(1);
});
