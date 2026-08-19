const config = require("../config.js");
const algo = require("../trend.js");
const engine = require("./engine.js");
const KrakenExchange = require("../services/exchange/kraken.js");

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

const symbol = getArg("symbol", "BCH/USDT");
const timeframe = getArg("timeframe", "1d");
const limit = parseInt(getArg("limit", "1500"), 10);
const balance = parseFloat(getArg("balance", String(config.backtest.initialBalance)));

async function run() {
  console.log(
    `\nBacktest: ${symbol} | ${timeframe} | ${limit} candles | $${balance} balance\n`,
  );

  const kraken = new KrakenExchange();

  // Fetch symbol data
  const ohlcv = await kraken.fetchOHLCV(symbol, timeframe, limit);
  if (!ohlcv || ohlcv.length < 201) {
    console.error(`Need at least 201 candles, got ${ohlcv ? ohlcv.length : 0}`);
    process.exit(1);
  }

  // Fetch BTC data for the BTC filter (skip if symbol is already BTC)
  let btcCloses = null;
  const isBTC = symbol.startsWith("BTC/");
  if (!isBTC) {
    const btcData = await kraken.fetchOHLCV("BTC/USDT", timeframe, limit);
    if (btcData && btcData.length > 200) {
      btcCloses = btcData.map((c) => c.close);
      console.log(
        `Fetched ${btcData.length} BTC/USDT candles for market filter`,
      );
    } else {
      console.log(
        "Warning: Could not fetch BTC data, BTC filter will use symbol prices",
      );
    }
  }

  console.log(`Fetched ${ohlcv.length} candles from Kraken`);
  console.log(
    `Date range: ${new Date(ohlcv[0].timestamp).toISOString().slice(0, 10)} to ${new Date(ohlcv[ohlcv.length - 1].timestamp).toISOString().slice(0, 10)}\n`,
  );

  const result = await engine.run(algo, ohlcv, symbol, {
    initialBalance: balance,
    commission: config.backtest.commission,
    slippage: config.backtest.slippage,
    btcCloses,
    timeframe,
  });

  console.log("=== Results ===");
  console.log(`Total Trades:   ${result.totalTrades}`);
  console.log(`Win Rate:       ${result.winRate}%`);
  console.log(`Profit Factor:  ${result.profitFactor}`);
  console.log(`Sharpe Ratio:   ${result.sharpeRatio}`);
  console.log(`Sortino Ratio:  ${result.sortinoRatio}`);
  console.log(`Max Drawdown:   ${result.maxDrawdown}%`);
  console.log(`CAGR:           ${result.cagr}%`);
  console.log(`Total Return:   ${result.totalReturn}%`);
  console.log(`Net Profit:     $${result.netProfit}`);
  console.log(`Avg Win:        $${result.avgProfit}`);
  console.log(`Avg Loss:       $${result.avgLoss}`);

  if (result.trades.length > 0) {
    console.log("\n=== Trade Log ===");
    console.log("Type  | Entry     | Exit      | PnL      | Reason");
    console.log("------+-----------+-----------+----------+--------");
    for (const t of result.trades) {
      const type = t.side === "LONG" ? "BUY " : "SELL";
      const entry = t.entryPrice.toFixed(2).padStart(9);
      const exit = t.exitPrice.toFixed(2).padStart(9);
      const pnl = (t.pnl >= 0 ? "+" : "") + t.pnl.toFixed(2);
      console.log(
        `${type}  | ${entry} | ${exit} | ${pnl.padStart(8)} | ${t.exitReason}`,
      );
    }
  }

  console.log("");
}

run().catch((err) => {
  console.error("Backtest failed:", err.message);
  process.exit(1);
});
