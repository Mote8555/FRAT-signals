const express = require("express");
const cors = require("cors");
const algo = require("./trend.js");
const RegimeEngine = require("./services/regime-engine.js");
const TimeframeFilter = require("./services/timeframe-filter.js");
const BTCFilter = require("./services/btc-filter.js");
const KrakenExchange = require("./services/exchange/kraken.js");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const kraken = new KrakenExchange();

const TIMEFRAMES = ["15m", "1h", "4h", "1d"];
const TF_LIMITS = { "15m": 300, "1h": 300, "4h": 200, "1d": 200 };
const TF_MIN_CANDLES = { "15m": 200, "1h": 200, "4h": 150, "1d": 100 };

function candleDataFromOHLCV(ohlcv) {
  return {
    timestamps: ohlcv.map(c => c.timestamp),
    opens: ohlcv.map(c => c.open),
    highs: ohlcv.map(c => c.high),
    lows: ohlcv.map(c => c.low),
    closes: ohlcv.map(c => c.close),
    volumes: ohlcv.map(c => c.volume),
  };
}

function padStart(length, series) {
  if (!series) return null;
  const padding = new Array(Math.max(0, length - series.length)).fill(null);
  return [...padding, ...series];
}

function getIndicatorSeries(candleData) {
  const { closes, volumes, highs, lows } = candleData;
  const n = closes.length;

  const kama = padStart(n, algo.calculateKAMA(closes));
  const t3 = padStart(n, algo.calculateT3(closes));

  const vwmacd = algo.calculateVWMACD(closes, volumes);
  const macd = vwmacd ? padStart(n, vwmacd.macdLine) : null;
  const macdSignal = vwmacd ? padStart(n, vwmacd.signalLine) : null;

  const atr = padStart(n, algo.calculateATR(highs, lows, closes));

  return { kama, t3, macd, macdSignal, atr };
}

async function fetchCandleData(symbol, timeframe = "1h", limit = 300) {
  const ohlcv = await kraken.fetchOHLCV(symbol, timeframe, limit);
  if (!ohlcv || ohlcv.length < (TF_MIN_CANDLES[timeframe] || 200)) return null;
  return candleDataFromOHLCV(ohlcv);
}

async function analyzeTimeframe(symbol, timeframe, btcCandleData) {
  const limit = TF_LIMITS[timeframe] || 300;
  const candleData = await fetchCandleData(symbol, timeframe, limit);
  if (!candleData) return null;

  const trend = TimeframeFilter.evaluateTrend(candleData.closes, 20).trend;

  const options = {};
  if (btcCandleData) options.btcPrices = btcCandleData.closes;

  if (timeframe === "1h" || timeframe === "15m") {
    const fourHourData = await fetchCandleData(symbol, "4h", 150);
    if (fourHourData) {
      const fourHourTrend = TimeframeFilter.evaluateTrend(fourHourData.closes, 60);
      options.validatingTrend = fourHourTrend.trend;
    }
  }

  const signal = algo.generateSignal(symbol, candleData, options);
  const regime = RegimeEngine.detectRegime(candleData.closes);

  return {
    timeframe,
    signal,
    regime,
    trend,
    lastPrice: candleData.closes[candleData.closes.length - 1],
  };
}

app.get("/api/pairs", (req, res) => {
  const pairs = algo.getPairs();
  res.json({ pairs });
});

app.get("/api/regime/:pair(*)", async (req, res) => {
  try {
    const symbol = decodeURIComponent(req.params.pair).toUpperCase();
    if (!symbol.includes("/")) return res.status(400).json({ error: "Invalid symbol. Use format BTC/USDT" });

    const candleData = await fetchCandleData(symbol, "1h", 300);
    if (!candleData) return res.status(503).json({ error: "Please refresh the page" });

    const regime = RegimeEngine.detectRegime(candleData.closes);
    res.json({ pair: symbol, ...regime });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/signal/:pair(*)", async (req, res) => {
  try {
    const symbol = decodeURIComponent(req.params.pair).toUpperCase();
    if (!symbol.includes("/")) return res.status(400).json({ error: "Invalid symbol. Use format BTC/USDT" });

    const isBTC = symbol.startsWith("BTC/");
    const btcSymbol = isBTC ? symbol : "BTC/USDT";
    const btcCandleData = await fetchCandleData(btcSymbol, "1h", 100);

    const options = {};
    if (btcCandleData) options.btcPrices = btcCandleData.closes;

    const candleData = await fetchCandleData(symbol, "1h", 300);
    if (!candleData) return res.status(503).json({ error: "Failed to fetch market data" });

    const fourHourData = await fetchCandleData(symbol, "4h", 150);
    if (fourHourData) {
      const fourHourTrend = TimeframeFilter.evaluateTrend(fourHourData.closes, 60);
      options.validatingTrend = fourHourTrend.trend;
    }

    const signal = algo.generateSignal(symbol, candleData, options);
    const regime = RegimeEngine.detectRegime(candleData.closes);

    res.json({
      pair: symbol,
      signal,
      regime,
      timeframe: "1h",
      lastPrice: candleData.closes[candleData.closes.length - 1],
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/fractal/:pair(*)", async (req, res) => {
  try {
    const symbol = decodeURIComponent(req.params.pair).toUpperCase();
    if (!symbol.includes("/")) return res.status(400).json({ error: "Invalid symbol. Use format BTC/USDT" });

    const isBTC = symbol.startsWith("BTC/");
    const btcSymbol = isBTC ? symbol : "BTC/USDT";
    const btcCandleData = await fetchCandleData(btcSymbol, "1h", 100);

    const results = await Promise.all(
      TIMEFRAMES.map(tf => analyzeTimeframe(symbol, tf, btcCandleData))
    );

    const timeframes = {};
    let bullishCount = 0;
    let bearishCount = 0;
    let neutralCount = 0;

    for (const r of results) {
      if (!r) {
        neutralCount++;
        continue;
      }
      timeframes[r.timeframe] = {
        signal: r.signal,
        regime: r.regime,
        trend: r.trend,
        lastPrice: r.lastPrice,
      };
      if (r.signal?.type === "BUY") bullishCount++;
      else if (r.signal?.type === "SELL") bearishCount++;
      else neutralCount++;
    }

    const btcFilter = btcCandleData
      ? BTCFilter.evaluate(btcCandleData.closes)
      : null;

    res.json({
      pair: symbol,
      timeframes,
      confluence: { bullishCount, bearishCount, neutralCount },
      btcFilter,
      dataSource: "Kraken",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/chart/:pair(*)/:timeframe", async (req, res) => {
  try {
    const symbol = decodeURIComponent(req.params.pair).toUpperCase();
    const timeframe = req.params.timeframe.toLowerCase();
    if (!symbol.includes("/")) return res.status(400).json({ error: "Invalid symbol. Use format BTC/USDT" });
    if (!TIMEFRAMES.includes(timeframe)) return res.status(400).json({ error: "Invalid timeframe. Use 15m, 1h, 4h or 1d" });

    const candleData = await fetchCandleData(symbol, timeframe);
    if (!candleData) return res.status(503).json({ error: "Failed to fetch market data" });

    res.json({
      pair: symbol,
      timeframe,
      timestamps: candleData.timestamps,
      opens: candleData.opens,
      highs: candleData.highs,
      lows: candleData.lows,
      closes: candleData.closes,
      volumes: candleData.volumes,
      indicators: getIndicatorSeries(candleData),
      dataSource: "Kraken",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    pairs: algo.cryptoPairs.length,
    exchange: "Kraken",
  });
});

app.listen(PORT, () => {
  console.log(`FRAT Signals API running on http://localhost:${PORT}`);
});
