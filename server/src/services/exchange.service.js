/**
 * exchange.service.js
 * Thin wrapper around CCXT — isolates all exchange calls.
 * All methods return plain JS objects so consumers never depend on ccxt types.
 */

const ccxt = require("ccxt");

// Public Binance instance — no API keys needed for paper trading
const exchange = new ccxt.binance({
  enableRateLimit: true,
  options: { defaultType: "spot" },
});

/**
 * Fetch recent OHLCV candles.
 * @returns {number[][]} [[ts, open, high, low, close, volume], ...]
 */
async function fetchCandles(symbol, timeframe, limit = 100) {
  return exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
}

/**
 * Fetch current ticker for a symbol.
 * @returns {{ last, bid, ask, percentage, quoteVolume }}
 */
async function fetchTicker(symbol) {
  const t = await exchange.fetchTicker(symbol);
  return {
    last:        t.last,
    bid:         t.bid,
    ask:         t.ask,
    percentage:  t.percentage,
    quoteVolume: t.quoteVolume,
  };
}

/**
 * Fetch tickers for multiple symbols in one call.
 * @returns {Record<string, { last, percentage }>}
 */
async function fetchTickers(symbols) {
  const result = await exchange.fetchTickers(symbols);
  return Object.fromEntries(
    symbols.map((s) => [s, { last: result[s]?.last, percentage: result[s]?.percentage }])
  );
}

module.exports = { fetchCandles, fetchTicker, fetchTickers };
