/**
 * bot.service.js
 * Orchestrates the trading loop.
 * Calls exchange → strategy → paper wallet → DB → emits via Socket.IO
 */

const exchangeSvc   = require("./exchange.service");
const strategySvc   = require("./strategies.service");
const PaperWallet   = require("./paper.service");
const Trade         = require("../models/Trade");
const Signal        = require("../models/Signal");
const BotLog        = require("../models/BotLog");

// ─── Mutable state (single instance per server process) ──────────────────────
let io          = null; // set by index.js after Socket.IO init
let running     = false;
let killSwitch  = false;
let botInterval = null;
let tickInterval = null;

const wallet = new PaperWallet(10_000);

let lastSignal = null;  // { signal, reason, price, ts }

let config = {
  symbol:    "BTC/USDT",
  strategy:  "ema_crossover",
  timeframe: "1m",
  params:    { fast: 9, slow: 21, rsiPeriod: 14, oversold: 30, overbought: 70, macdFast: 12, macdSlow: 26, macdSignal: 9, bbPeriod: 20, bbStdDev: 2 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function emit(event, data) {
  if (io) io.emit(event, data);
}

async function addLog(msg, type = "info") {
  console.log(`[${type.toUpperCase()}] ${msg}`);
  const log = await BotLog.create({ msg, type });
  emit("log", log);
}

// ─── Core tick ────────────────────────────────────────────────────────────────
async function tick() {
  if (!running || killSwitch) return;

  try {
    const candles = await exchangeSvc.fetchCandles(config.symbol, config.timeframe, 120);
    const price   = candles.at(-1)[4];

    wallet.updatePrice(price);
    emit("price", { symbol: config.symbol, price, ts: Date.now() });

    const { signal, reason } = strategySvc.evaluate(candles, config.strategy, config.params);

    // Track last signal for status panel
    lastSignal = { signal, reason, price, ts: new Date().toISOString() };

    // Persist every non-repeat HOLD and all BUY/SELL signals
    const sigDoc = await Signal.create({
      signal, symbol: config.symbol, price, strategy: config.strategy, reason,
    });
    emit("signal", sigDoc);

    if (signal === "BUY") {
      const fill = wallet.buy(price, config.symbol);
      if (fill) {
        await addLog(`📈 BUY ${fill.qty.toFixed(6)} ${config.symbol.split("/")[0]} @ $${price.toFixed(2)}  |  ${reason}`, "buy");
        emit("wallet", wallet.snapshot());
      }
    }

    if (signal === "SELL") {
      const fill = wallet.sell(price);
      if (fill) {
        const trade = await Trade.create({
          symbol:     config.symbol,
          side:       "sell",
          qty:        fill.qty,
          entryPrice: fill.entryPrice,
          exitPrice:  price,
          pnl:        fill.pnl,
          strategy:   config.strategy,
        });
        await addLog(
          `📉 SELL @ $${price.toFixed(2)}  |  PnL: ${fill.pnl >= 0 ? "+" : ""}$${fill.pnl.toFixed(2)}  |  ${reason}`,
          fill.pnl >= 0 ? "profit" : "loss"
        );
        emit("trade", trade);
        emit("wallet", wallet.snapshot());
      }
    }

  } catch (err) {
    await addLog(`Error: ${err.message}`, "error");
  }
}

// ─── Fast price-only tick ─────────────────────────────────────────────────────
async function priceTick() {
  try {
    const t = await exchangeSvc.fetchTicker(config.symbol);
    wallet.updatePrice(t.last);
    emit("price", { symbol: config.symbol, price: t.last, ts: Date.now() });
    emit("wallet", wallet.snapshot());
  } catch { /* ignore ticker failures */ }
}

// ─── Public API ───────────────────────────────────────────────────────────────
const TIMEFRAME_MS = { "1m": 60_000, "3m": 180_000, "5m": 300_000, "15m": 900_000, "1h": 3_600_000 };

function start(newConfig = {}) {
  if (killSwitch) throw new Error("Kill switch is active — deactivate it first");

  const { capital: newCapital, ...rest } = newConfig;
  config = { ...config, ...rest, params: { ...config.params, ...(rest.params || {}) } };

  // If a new capital is given and bot isn't running, reset wallet with it
  if (newCapital && !running) {
    wallet.reset(newCapital);
    addLog(`💰 Capital set to $${newCapital.toLocaleString()}`, "info");
  }

  running = true;
  lastSignal = null;

  clearInterval(botInterval);
  clearInterval(tickInterval);

  // Tell UI to clear old signals/logs from previous sessions
  emit("session_start", { symbol: config.symbol, strategy: config.strategy, timeframe: config.timeframe, ts: Date.now() });

  tick(); // run immediately
  botInterval  = setInterval(tick,      TIMEFRAME_MS[config.timeframe] || 60_000);
  tickInterval = setInterval(priceTick, 5_000);

  addLog(`🚀 Bot started — ${config.symbol} | ${config.strategy} | ${config.timeframe}`, "info");
  return getStatus();
}

function stop() {
  running = false;
  clearInterval(botInterval);
  clearInterval(tickInterval);
  botInterval = tickInterval = null;
  addLog("⏹ Bot stopped", "info");
  return getStatus();
}

function toggleKillSwitch(enabled) {
  killSwitch = Boolean(enabled);
  if (killSwitch && running) stop();
  addLog(killSwitch ? "🚨 KILL SWITCH ACTIVATED — all trading halted" : "✅ Kill switch deactivated", killSwitch ? "error" : "info");
  return getStatus();
}

function reset(capital) {
  stop();
  killSwitch = false;
  lastSignal = null;
  wallet.reset(capital);
  addLog(`🔄 Bot reset${capital ? ` — capital set to $${capital.toLocaleString()}` : " — balance restored"}`, "info");
  return getStatus();
}

function getStatus() {
  return {
    running,
    killSwitch,
    config,
    lastSignal,
    ...wallet.snapshot(),
  };
}

function setIO(socketIO) {
  io = socketIO;
}

module.exports = { start, stop, toggleKillSwitch, reset, getStatus, setIO };
