/**
 * strategies.service.js
 * Pure strategy logic — takes an array of OHLCV candles, returns BUY/SELL/HOLD
 * No side effects, fully unit-testable.
 */

const { EMA, RSI, MACD, BollingerBands } = require("technicalindicators");

/**
 * @param {number[][]} candles  - CCXT format: [ts, open, high, low, close, volume]
 * @param {string}     type     - strategy identifier
 * @param {object}     params   - configurable parameters
 * @returns {{ signal: "BUY"|"SELL"|"HOLD", reason: string }}
 */
function evaluate(candles, type, params) {
  const closes = candles.map((c) => c[4]);

  try {
    switch (type) {
      case "ema_crossover": return emaCrossover(closes, params);
      case "rsi":           return rsiStrategy(closes, params);
      case "macd":          return macdStrategy(closes, params);
      case "bollinger":     return bollingerStrategy(closes, params);
      default:              return { signal: "HOLD", reason: "Unknown strategy" };
    }
  } catch (err) {
    return { signal: "HOLD", reason: `Error: ${err.message}` };
  }
}

// ── EMA Crossover ─────────────────────────────────────────────────────────────
function emaCrossover(closes, { fast = 9, slow = 21 }) {
  if (closes.length < slow + 2) return { signal: "HOLD", reason: "Not enough data" };

  const fastVals = EMA.calculate({ period: fast, values: closes });
  const slowVals = EMA.calculate({ period: slow, values: closes });
  const [fNow, fPrev] = [fastVals.at(-1), fastVals.at(-2)];
  const [sNow, sPrev] = [slowVals.at(-1), slowVals.at(-2)];

  if (fPrev <= sPrev && fNow > sNow)
    return { signal: "BUY",  reason: `EMA${fast} crossed above EMA${slow}` };
  if (fPrev >= sPrev && fNow < sNow)
    return { signal: "SELL", reason: `EMA${fast} crossed below EMA${slow}` };
  return { signal: "HOLD", reason: `EMA${fast}=${fNow?.toFixed(2)}, EMA${slow}=${sNow?.toFixed(2)}` };
}

// ── RSI ───────────────────────────────────────────────────────────────────────
function rsiStrategy(closes, { rsiPeriod = 14, oversold = 30, overbought = 70 }) {
  if (closes.length < rsiPeriod + 2) return { signal: "HOLD", reason: "Not enough data" };

  const vals = RSI.calculate({ period: rsiPeriod, values: closes });
  const [rNow, rPrev] = [vals.at(-1), vals.at(-2)];

  if (rPrev <= oversold && rNow > oversold)
    return { signal: "BUY",  reason: `RSI(${rNow.toFixed(1)}) crossed out of oversold (${oversold})` };
  if (rPrev >= overbought && rNow < overbought)
    return { signal: "SELL", reason: `RSI(${rNow.toFixed(1)}) crossed out of overbought (${overbought})` };
  return { signal: "HOLD", reason: `RSI = ${rNow?.toFixed(1)}` };
}

// ── MACD ──────────────────────────────────────────────────────────────────────
function macdStrategy(closes, { macdFast = 12, macdSlow = 26, macdSignal = 9 }) {
  if (closes.length < macdSlow + macdSignal + 2)
    return { signal: "HOLD", reason: "Not enough data" };

  const vals = MACD.calculate({
    values: closes,
    fastPeriod: macdFast,
    slowPeriod: macdSlow,
    signalPeriod: macdSignal,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const curr = vals.at(-1), prev = vals.at(-2);
  if (!curr?.histogram || !prev?.histogram)
    return { signal: "HOLD", reason: "Calculating..." };

  if (prev.histogram <= 0 && curr.histogram > 0)
    return { signal: "BUY",  reason: `MACD histogram turned positive (${curr.histogram.toFixed(4)})` };
  if (prev.histogram >= 0 && curr.histogram < 0)
    return { signal: "SELL", reason: `MACD histogram turned negative (${curr.histogram.toFixed(4)})` };
  return { signal: "HOLD", reason: `Histogram = ${curr.histogram?.toFixed(4)}` };
}

// ── Bollinger Bands ───────────────────────────────────────────────────────────
function bollingerStrategy(closes, { bbPeriod = 20, bbStdDev = 2 }) {
  if (closes.length < bbPeriod + 2) return { signal: "HOLD", reason: "Not enough data" };

  const bb = BollingerBands.calculate({ period: bbPeriod, values: closes, stdDev: bbStdDev });
  const curr = bb.at(-1), prev = bb.at(-2);
  const [pNow, pPrev] = [closes.at(-1), closes.at(-2)];

  if (pPrev < prev.lower && pNow >= curr.lower)
    return { signal: "BUY",  reason: `Price re-entered above lower band ($${curr.lower.toFixed(2)})` };
  if (pPrev > prev.upper && pNow <= curr.upper)
    return { signal: "SELL", reason: `Price re-entered below upper band ($${curr.upper.toFixed(2)})` };
  return { signal: "HOLD", reason: `Band: $${curr.lower?.toFixed(2)} – $${curr.upper?.toFixed(2)}` };
}

module.exports = { evaluate };
