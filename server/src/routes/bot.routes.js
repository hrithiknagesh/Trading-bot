const { Router } = require("express");
const ctrl = require("../controllers/bot.controller");
const exchangeSvc = require("../services/exchange.service");

const router = Router();

router.get("/status",       ctrl.getStatus);
router.post("/start",       ctrl.start);
router.post("/stop",        ctrl.stop);
router.post("/kill-switch", ctrl.killSwitch);
router.post("/reset",       ctrl.reset);
router.get("/trades",       ctrl.getTrades);
router.get("/signals",      ctrl.getSignals);
router.get("/logs",         ctrl.getLogs);

// GET /api/bot/candles?symbol=DOGE/USDT&timeframe=1m&limit=100
router.get("/candles", async (req, res) => {
  try {
    const { symbol = "BTC/USDT", timeframe = "1m", limit = 100 } = req.query;
    const candles = await exchangeSvc.fetchCandles(symbol, timeframe, parseInt(limit));
    res.json({ candles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bot/ticker?symbol=DOGE/USDT
router.get("/ticker", async (req, res) => {
  try {
    const { symbol = "BTC/USDT" } = req.query;
    const ticker = await exchangeSvc.fetchTicker(symbol);
    res.json(ticker);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
