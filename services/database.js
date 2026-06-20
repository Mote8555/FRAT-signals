class SignalDatabase {
  constructor(dbPath = ":memory:") {
    this.dbPath = dbPath;
    this.db = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      const Database = require("better-sqlite3");
      this.db = new Database(this.dbPath);
      this.db.pragma("journal_mode = WAL");
      this.createTables();
      this.initialized = true;
      return true;
    } catch {
      console.warn("better-sqlite3 not available, using in-memory storage");
      this.memoryStore = { signals: [], trades: [], regimes: [], performance: [] };
      this.initialized = true;
      return false;
    }
  }

  createTables() {
    if (!this.db) return;

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS signals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pair TEXT NOT NULL,
        side TEXT NOT NULL,
        entry_price REAL,
        confidence_score INTEGER,
        grade TEXT,
        regime TEXT,
        hurst REAL,
        timestamp TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        signal_id INTEGER,
        pair TEXT NOT NULL,
        side TEXT NOT NULL,
        entry_price REAL,
        exit_price REAL,
        position_size REAL,
        pnl REAL,
        pnl_percent REAL,
        exit_reason TEXT,
        entry_time TEXT,
        exit_time TEXT,
        FOREIGN KEY (signal_id) REFERENCES signals(id)
      );

      CREATE TABLE IF NOT EXISTS regimes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pair TEXT NOT NULL,
        regime TEXT NOT NULL,
        hurst REAL,
        dfa REAL,
        confidence INTEGER,
        timestamp TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS performance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total_trades INTEGER,
        win_rate REAL,
        profit_factor REAL,
        sharpe_ratio REAL,
        sortino_ratio REAL,
        max_drawdown REAL,
        cagr REAL,
        total_return REAL,
        timestamp TEXT DEFAULT (datetime('now'))
      );
    `);
  }

  logSignal(signal) {
    if (this.db) {
      const stmt = this.db.prepare(`
        INSERT INTO signals (pair, side, entry_price, confidence_score, grade, regime, hurst)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      return stmt.run(signal.pair, signal.type, signal.entryPrice, signal.confidence?.score, signal.confidence?.grade, signal.regime, signal.hurst);
    }
    this.memoryStore.signals.push({ ...signal, timestamp: new Date().toISOString() });
    return { id: this.memoryStore.signals.length };
  }

  logTrade(trade) {
    if (this.db) {
      const stmt = this.db.prepare(`
        INSERT INTO trades (signal_id, pair, side, entry_price, exit_price, position_size, pnl, pnl_percent, exit_reason, entry_time, exit_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      return stmt.run(trade.signalId, trade.pair, trade.side, trade.entryPrice, trade.exitPrice, trade.positionSize, trade.pnl, trade.pnlPercent, trade.exitReason, trade.entryTime, trade.exitTime);
    }
    this.memoryStore.trades.push({ ...trade, timestamp: new Date().toISOString() });
    return { id: this.memoryStore.trades.length };
  }

  logRegime(pair, regimeData) {
    if (this.db) {
      const stmt = this.db.prepare(`
        INSERT INTO regimes (pair, regime, hurst, dfa, confidence)
        VALUES (?, ?, ?, ?, ?)
      `);
      return stmt.run(pair, regimeData.regime, regimeData.hurst, regimeData.dfa, regimeData.confidence);
    }
    this.memoryStore.regimes.push({ pair, ...regimeData, timestamp: new Date().toISOString() });
    return { id: this.memoryStore.regimes.length };
  }

  logPerformance(perfData) {
    if (this.db) {
      const stmt = this.db.prepare(`
        INSERT INTO performance (total_trades, win_rate, profit_factor, sharpe_ratio, sortino_ratio, max_drawdown, cagr, total_return)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      return stmt.run(perfData.totalTrades, perfData.winRate, perfData.profitFactor, perfData.sharpeRatio, perfData.sortinoRatio, perfData.maxDrawdown, perfData.cagr, perfData.totalReturn);
    }
    this.memoryStore.performance.push({ ...perfData, timestamp: new Date().toISOString() });
    return { id: this.memoryStore.performance.length };
  }

  getSignals(limit = 50) {
    if (this.db) {
      return this.db.prepare("SELECT * FROM signals ORDER BY timestamp DESC LIMIT ?").all(limit);
    }
    return this.memoryStore.signals.slice(-limit).reverse();
  }

  getTrades(limit = 50) {
    if (this.db) {
      return this.db.prepare("SELECT * FROM trades ORDER BY exit_time DESC LIMIT ?").all(limit);
    }
    return this.memoryStore.trades.slice(-limit).reverse();
  }

  getPerformance() {
    if (this.db) {
      return this.db.prepare("SELECT * FROM performance ORDER BY timestamp DESC LIMIT 1").get();
    }
    return this.memoryStore.performance[this.memoryStore.performance.length - 1] || null;
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = SignalDatabase;
