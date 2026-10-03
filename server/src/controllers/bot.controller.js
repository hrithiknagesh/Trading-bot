/**
 * bot.controller.js
 * HTTP handlers — only deals with req/res, delegates everything to bot.service.
 */

const botService = require("../services/bot.service");
const Trade      = require("../models/Trade");
const Signal     = require("../models/Signal");
const BotLog     = require("../models/BotLog");

// GET /api/bot/status
const getStatus = (_req, res) => {
  res.json(botService.getStatus());
};

// POST /api/bot/start   body: { symbol, strategy, timeframe, params }
const start = (req, res) => {
  try {
    const status = botService.start(req.body);
    res.json({ ok: true, ...status });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
};

// POST /api/bot/stop
const stop = (_req, res) => {
  const status = botService.stop();
  res.json({ ok: true, ...status });
};

// POST /api/bot/kill-switch   body: { enabled: boolean }
const killSwitch = (req, res) => {
  const status = botService.toggleKillSwitch(req.body.enabled);
  res.json({ ok: true, ...status });
};

// POST /api/bot/reset   body: { capital? }
const reset = (_req, res) => {
  const status = botService.reset(_req.body?.capital);
  res.json({ ok: true, ...status });
};

// GET /api/bot/trades?limit=20
const getTrades = async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const trades = await Trade.find().sort({ ts: -1 }).limit(limit);
  const totalPnl  = trades.reduce((s, t) => s + t.pnl, 0);
  const wins      = trades.filter((t) => t.pnl > 0).length;
  const winRate   = trades.length ? Math.round((wins / trades.length) * 100) : 0;
  res.json({ trades, totalPnl, winRate, total: trades.length });
};

// GET /api/bot/signals?limit=15
const getSignals = async (req, res) => {
  const limit = parseInt(req.query.limit) || 15;
  const signals = await Signal.find().sort({ ts: -1 }).limit(limit);
  res.json({ signals });
};

// GET /api/bot/logs?limit=30
const getLogs = async (req, res) => {
  const limit = parseInt(req.query.limit) || 30;
  const logs = await BotLog.find().sort({ ts: -1 }).limit(limit);
  res.json({ logs });
};

module.exports = { getStatus, start, stop, killSwitch, reset, getTrades, getSignals, getLogs };
