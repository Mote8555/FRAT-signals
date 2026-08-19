/**
 * Optimizer Worker — runs a single backtest with config overrides.
 * Spawned by optimize.js. Reads pre-fetched data from a temp file.
 * Outputs JSON to stdout.
 *
 * Usage:
 *   node optimize-worker.js --dataFile=/tmp/frat-opt-data-xxx.json --overrides='{"kama":{"period":15}}'
 */

// ── Apply config overrides BEFORE requiring any other modules ─────────
const fs = require("fs");
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

const overridesJSON = getArg("overrideFile", "");
let overrides;
try {
  if (overridesJSON && fs.existsSync(overridesJSON)) {
    overrides = JSON.parse(fs.readFileSync(overridesJSON, "utf-8"));
  } else {
    overrides = JSON.parse(overridesJSON || "{}");
  }
} catch {
  console.error("Invalid overrides");
  process.exit(1);
}

// Deep merge overrides into config
const config = require("../config.js");
function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}
deepMerge(config, overrides);

// Now require everything (they read from the already-mutated config singleton)
const algo = require("../trend.js");
const engine = require("./engine.js");

const dataFile = getArg("dataFile", "");
const timeframe = getArg("timeframe", "1d");

async function run() {
  if (!dataFile || !fs.existsSync(dataFile)) {
    console.log(JSON.stringify({ error: "missing data file" }));
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(dataFile, "utf-8"));
  const { ohlcv, btcCloses } = payload;

  const result = await engine.run(algo, ohlcv, "BACKTEST", {
    initialBalance: config.backtest.initialBalance,
    commission: config.backtest.commission,
    slippage: config.backtest.slippage,
    btcCloses,
    timeframe,
  });

  // Output only metrics (no trade log)
  const { trades, ...metrics } = result;
  console.log(JSON.stringify(metrics));
}

run().catch(err => {
  console.log(JSON.stringify({ error: err.message }));
  process.exit(1);
});
