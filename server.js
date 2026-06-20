const express = require("express");
const cors = require("cors");
const algo = require("./trend.js");
const RegimeEngine = require("./services/regime-engine.js");
const TimeframeFilter = require("./services/timeframe-filter.js");
const BTCFilter = require("./services/btc-filter.js");
const FundingRateAnalyzer = require("./services/funding-rate.js");
const OpenInterestAnalyzer = require("./services/open-interest.js");
const BinanceExchange = require("./services/exchange/binance.js");
const KrakenExchange = require("./services/exchange/kraken.js");
const YahooFinanceProvider = require("./services/exchange/yahoo.js");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const binance = new BinanceExchange();
const kraken = new KrakenExchange();
const yahoo = new YahooFinanceProvider();

const cryptoExchanges = { binance, kraken };

const TIMEFRAMES = ["15m", "1h", "4h", "1d"];
const TF_LIMITS = { "15m": 300, "1h": 300, "4h": 200, "1d": 200 };
const TF_MIN_CANDLES = { "15m": 200, "1h": 200, "4h": 150, "1d": 100 };

function getExchange(symbol, source = "binance") {
  if (algo.isForex(symbol)) return yahoo;
  return cryptoExchanges[source] || binance;
}

function getMarketType(symbol) {
  return algo.isForex(symbol) ? "forex" : "crypto";
}

function getDataSource(source = "binance") {
  if (source === "kraken") return kraken.name;
  return "Binance";
}

function candleDataFromOHLCV(ohlcv) {
  return {
    opens: ohlcv.map(c => c.open),
    highs: ohlcv.map(c => c.high),
    lows: ohlcv.map(c => c.low),
    closes: ohlcv.map(c => c.close),
    volumes: ohlcv.map(c => c.volume),
  };
}

async function fetchCandleData(symbol, timeframe = "1h", limit = 300, source = "binance") {
  const exchange = getExchange(symbol, source);
  const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, limit);
  if (!ohlcv || ohlcv.length < (TF_MIN_CANDLES[timeframe] || 200)) return null;
  return candleDataFromOHLCV(ohlcv);
}

async function analyzeTimeframe(symbol, timeframe, btcCandleData, source = "binance") {
  const limit = TF_LIMITS[timeframe] || 300;
  const candleData = await fetchCandleData(symbol, timeframe, limit, source);
  if (!candleData) return null;

  const trend = TimeframeFilter.evaluateTrend(candleData.closes, 20);

  const options = { marketType: getMarketType(symbol), source };
  if (!algo.isForex(symbol) && btcCandleData) options.btcPrices = btcCandleData.closes;

  if (timeframe === "1h" || timeframe === "15m") {
    const fourHourData = await fetchCandleData(symbol, "4h", 150, source);
    if (fourHourData) {
      const fourHourTrend = TimeframeFilter.evaluateTrend(fourHourData.closes, 60);
      options.validatingTrend = fourHourTrend;
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
  const market = req.query.market;
  const source = req.query.source || "binance";
  const pairs = market ? algo.getPairs(market, source) : algo.pairs;
  res.json({ pairs });
});

app.get("/api/regime/:pair(*)", async (req, res) => {
  try {
    const symbol = decodeURIComponent(req.params.pair).toUpperCase();
    if (!symbol.includes("/")) return res.status(400).json({ error: "Invalid symbol. Use format EUR/USD" });
    const source = req.query.source || "binance";

    const candleData = await fetchCandleData(symbol, "1h", 300, source);
    if (!candleData) return res.status(503).json({ error: "Failed to fetch market data" });

    const regime = RegimeEngine.detectRegime(candleData.closes);
    res.json({ pair: symbol, ...regime, marketType: getMarketType(symbol), dataSource: getDataSource(source) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/signal/:pair(*)", async (req, res) => {
  try {
    const symbol = decodeURIComponent(req.params.pair).toUpperCase();
    if (!symbol.includes("/")) return res.status(400).json({ error: "Invalid symbol. Use format EUR/USD" });
    const source = req.query.source || "binance";

    const options = { marketType: getMarketType(symbol), source };

    if (!algo.isForex(symbol)) {
      const isBTC = symbol.startsWith("BTC/");
      const btcSymbol = isBTC ? symbol : "BTC/USDT";
      const btcCandleData = await fetchCandleData(btcSymbol, "1h", 100, source);
      if (btcCandleData) options.btcPrices = btcCandleData.closes;
    }

    const candleData = await fetchCandleData(symbol, "1h", 300, source);
    if (!candleData) return res.status(503).json({ error: "Failed to fetch market data" });

    const fourHourData = await fetchCandleData(symbol, "4h", 150, source);
    if (fourHourData) {
      const fourHourTrend = TimeframeFilter.evaluateTrend(fourHourData.closes, 60);
      options.validatingTrend = fourHourTrend;
    }

    const signal = algo.generateSignal(symbol, candleData, options);
    const regime = RegimeEngine.detectRegime(candleData.closes);

    res.json({
      pair: symbol,
      signal,
      regime,
      timeframe: "1h",
      lastPrice: candleData.closes[candleData.closes.length - 1],
      marketType: getMarketType(symbol),
      dataSource: getDataSource(source),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/fractal/:pair(*)", async (req, res) => {
  try {
    const symbol = decodeURIComponent(req.params.pair).toUpperCase();
    if (!symbol.includes("/")) return res.status(400).json({ error: "Invalid symbol. Use format EUR/USD" });
    const source = req.query.source || "binance";

    const isForex = algo.isForex(symbol);
    let btcCandleData = null;

    if (!isForex) {
      const isBTC = symbol.startsWith("BTC/");
      const btcSymbol = isBTC ? symbol : "BTC/USDT";
      btcCandleData = await fetchCandleData(btcSymbol, "1h", 100, source);
    }

    const results = await Promise.all(
      TIMEFRAMES.map(tf => analyzeTimeframe(symbol, tf, btcCandleData, source))
    );

    let fundingData = null;
    let oiData = null;

    if (!isForex && source === "binance") {
      const exchange = getExchange(symbol, source);
      try {
        const raw = await exchange.fetchFundingRate(symbol);
        if (raw && typeof raw === 'number') {
          fundingData = FundingRateAnalyzer.analyze([raw]);
        }
      } catch {}
      try {
        const raw = await exchange.fetchOpenInterest(symbol);
        if (raw && typeof raw === 'number') {
          oiData = OpenInterestAnalyzer.analyze([raw]);
        }
      } catch {}
    }

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
      fundingData,
      oiData,
      marketType: getMarketType(symbol),
      dataSource: getDataSource(source),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    cryptoPairs: { binance: algo.cryptoPairs.length, kraken: algo.krakenCryptoPairs.length },
    forexPairs: algo.forexPairs.length,
    totalPairs: algo.pairs.length,
    exchanges: ["binance", "kraken"],
  });
});

app.listen(PORT, () => {
  console.log(`FRAT Signals API running on http://localhost:${PORT}`);
});
