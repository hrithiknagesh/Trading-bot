# ⚡ CryptoBot — MERN Paper Trading Bot

> A **fully modular** MERN crypto trading bot with a single-page live dashboard.
> No login. No routing. Open → configure → **click Start**.

---

## 📋 Table of Contents

1. [What This Bot Does](#what-this-bot-does)
2. [Bot Capabilities](#bot-capabilities)
3. [Strategies Explained](#strategies-explained)
4. [Quick Presets (Recommended Settings)](#quick-presets-recommended-settings)
5. [Project Structure](#project-structure)
6. [Quick Start](#quick-start)
7. [Dashboard Guide](#dashboard-guide)
8. [API Endpoints](#api-endpoints)
9. [Configuration Reference](#configuration-reference)
10. [How Paper Trading Works](#how-paper-trading-works)
11. [Symbols & Volatility Guide](#symbols--volatility-guide)
12. [Troubleshooting](#troubleshooting)

---

## What This Bot Does

CryptoBot is a **paper trading bot** — it trades with simulated money using real live prices from Binance.
Every minute (or on your chosen timeframe), it:

1. Fetches live candles from Binance via CCXT
2. Runs a strategy (EMA / RSI / MACD / Bollinger) on the candle data
3. Generates a **BUY**, **SELL**, or **HOLD** signal
4. If BUY → buys with 95% of free balance (paper money)
5. If SELL → closes position, calculates P&L, saves trade to MongoDB
6. Pushes all updates to the UI in real time via Socket.IO
7. Repeats on the next candle close

> **No real money is ever used.** This is simulation only.

---

## Bot Capabilities

| Feature | Details |
|---------|---------|
| 📡 **Live prices** | Real Binance market data via CCXT (public API, no key needed) |
| 📊 **4 strategies** | EMA Crossover, RSI, MACD, Bollinger Bands |
| 📈 **BUY execution** | Buys with 95% of free balance, 0.1% fee deducted |
| 📉 **SELL execution** | Closes full position, calculates net P&L |
| 💰 **Custom capital** | Set any starting amount before each run |
| 🔴 **Kill switch** | Emergency halt — stops all trading instantly |
| 🔄 **Reset** | Wipes trades, restores balance to starting capital |
| 🗄️ **MongoDB storage** | Every trade, signal, and log is persisted |
| 📡 **Socket.IO** | Real-time UI updates without polling |
| 📉 **Live chart** | TradingView Lightweight Charts with 5s candle updates |
| 🎛️ **Preset configs** | One-click Fast / Swing / MACD Scalp mode |
| 🪙 **10 symbols** | PEPE, WIF, DOGE, SHIB, FLOKI, BONK, SOL, AVAX, ETH, BTC |
| ⏱️ **5 timeframes** | 1m, 3m, 5m, 15m, 1h |

---

## Strategies Explained

### 1. EMA Crossover
Uses two Exponential Moving Averages — a fast one and a slow one.

| Signal | Condition |
|--------|-----------|
| **BUY** | Fast EMA crosses **above** slow EMA (uptrend starting) |
| **SELL** | Fast EMA crosses **below** slow EMA (downtrend starting) |
| **HOLD** | No crossover detected |

**Parameters:**
- `fast` — Period of fast EMA (default: 9)
- `slow` — Period of slow EMA (default: 21)

**Best for:** Trending markets, medium timeframes (5m–15m)

---

### 2. RSI (Relative Strength Index)
Measures how overbought or oversold the price is on a 0–100 scale.

| Signal | Condition |
|--------|-----------|
| **BUY** | RSI was below `oversold` threshold and crosses back above it |
| **SELL** | RSI was above `overbought` threshold and crosses back below it |
| **HOLD** | RSI is in the neutral zone |

**Parameters:**
- `rsiPeriod` — Lookback period (default: 14, use 5–7 for fast signals)
- `oversold` — Lower threshold (default: 30, use 40–45 for more signals)
- `overbought` — Upper threshold (default: 70, use 55–60 for more signals)

**Best for:** Volatile meme coins (PEPE, DOGE), short timeframes (1m–3m)

---

### 3. MACD (Moving Average Convergence Divergence)
Measures momentum by comparing two EMAs and a signal line.

| Signal | Condition |
|--------|-----------|
| **BUY** | MACD histogram crosses from negative to positive |
| **SELL** | MACD histogram crosses from positive to negative |
| **HOLD** | No histogram crossover |

**Parameters:**
- `macdFast` — Fast EMA period (default: 12)
- `macdSlow` — Slow EMA period (default: 26)
- `macdSignal` — Signal line period (default: 9)

**Best for:** Trending coins with momentum, 3m–15m timeframes

---

### 4. Bollinger Bands
Uses a price channel based on standard deviation.

| Signal | Condition |
|--------|-----------|
| **BUY** | Price was below the lower band and re-enters it (oversold bounce) |
| **SELL** | Price touches or exceeds the upper band (overbought) |
| **HOLD** | Price inside the bands |

**Parameters:**
- `bbPeriod` — Lookback period (default: 20)
- `bbStdDev` — Standard deviation multiplier for band width (default: 2)

**Best for:** Range-bound markets, all timeframes

---

## Quick Presets (Recommended Settings)

These presets are built into the UI — one click applies everything.

### ⚡ Fast Mode — *See trades within minutes*
```
Symbol:     PEPE/USDT
Strategy:   RSI
Timeframe:  1m
RSI Period: 5
Oversold:   45    ← triggers BUY more often (normally 30)
Overbought: 55    ← triggers SELL more often (normally 70)
Capital:    $1,000
```
> Expect a **BUY or SELL signal every 5–15 minutes** on PEPE.

---

### 📈 Swing Mode — *EMA trend following*
```
Symbol:    DOGE/USDT
Strategy:  EMA Crossover
Timeframe: 1m
Fast EMA:  5
Slow EMA:  13
Capital:   $5,000
```

---

### 📊 MACD Scalp — *Momentum trading*
```
Symbol:      WIF/USDT
Strategy:    MACD
Timeframe:   1m
MACD Fast:   6
MACD Slow:   13
MACD Signal: 5
Capital:     $2,000
```

---

## Project Structure

```
Trading bot/
├── README.md
├── server/
│   ├── .env
│   ├── package.json
│   └── src/
│       ├── index.js                   ← entry point
│       ├── app.js                     ← Express + CORS setup
│       ├── config/db.js               ← MongoDB connection
│       ├── models/
│       │   ├── Trade.js               ← closed trade records
│       │   ├── Signal.js              ← strategy signals
│       │   └── BotLog.js              ← activity log
│       ├── services/
│       │   ├── strategies.service.js  ← EMA / RSI / MACD / Bollinger logic
│       │   ├── exchange.service.js    ← CCXT wrapper (fetchCandles, fetchTicker)
│       │   ├── paper.service.js       ← simulated wallet
│       │   └── bot.service.js         ← trading loop orchestrator
│       ├── controllers/
│       │   └── bot.controller.js      ← HTTP handlers
│       └── routes/
│           └── bot.routes.js          ← all /api/bot/* routes
│
└── client/
    ├── index.html
    ├── vite.config.js                 ← proxy /api → :5000
    └── src/
        ├── App.jsx                    ← single page (no router)
        ├── main.jsx
        ├── index.css                  ← dark design system
        ├── hooks/useBot.js            ← all state + Socket.IO
        ├── utils/fmt.js               ← price formatter (tiny coins)
        └── components/
            ├── StatCards.jsx          ← top 5 live metrics
            ├── BotControls.jsx        ← config + Start/Stop + Kill Switch
            ├── BotStatus.jsx          ← what bot is doing right now
            ├── PriceChart.jsx         ← live candlestick chart
            ├── SignalsTable.jsx       ← BUY/SELL/HOLD feed
            ├── TradeTable.jsx         ← closed trades + P&L
            └── ActivityLog.jsx        ← event log
```

---

## Quick Start

### Step 1 — Start MongoDB

**Docker (recommended):**
```bash
docker run -d --name cryptobot_mongo -p 27017:27017 mongo:7
```

**Linux local install:**
```bash
sudo apt install mongodb-org
sudo systemctl start mongod
```

### Step 2 — Start the server
```bash
cd server
npm install
node src/index.js
# ✅ MongoDB connected
# ✅ Server running → http://localhost:5000
```

### Step 3 — Start the client
```bash
cd client
npm install
npm run dev
# → http://localhost:5173
```

### Step 4 — Open & trade
1. Go to **http://localhost:5173**
2. Click **⚡ Fast Mode** preset
3. Click **▶ Start Bot ($1,000)**
4. Watch the Signals table — BUY/SELL appears within minutes

---

## Dashboard Guide

### Top Bar
| Element | Meaning |
|---------|---------|
| Green dot | Socket.IO connected |
| Bot Live/Idle | Current running state |
| Trades count | Total trades this session |
| Win % | Percentage of profitable trades |
| P&L | Realised profit/loss so far |

### Stat Cards (top row)
| Card | Shows |
|------|-------|
| Live Price | Real-time current price |
| Balance | Free USDT (not in a trade) |
| Total Equity | Balance + open position value |
| Realised P&L | Profit from all closed trades |
| Win Rate | % of trades in profit |

### Left Panel — Controls
- **Presets** — Fast Mode / Swing / MACD Scalp
- **Capital** — set starting amount (locked while running)
- **Symbol** — coin to trade (also changes the chart)
- **Timeframe pills** — how often bot evaluates
- **Strategy + Parameters** — algorithm config
- **▶ Start** / **⏹ Stop** / **🔄 Reset** / **🛡 Kill Switch**

### Left Panel — Bot Activity
- Last signal with reason (e.g. *"RSI(49.6) crossed out of oversold"*)
- Open position: qty, entry price, current price, unrealised P&L
- Wallet: capital / balance / equity / return %

### Right Panel
- **Chart** — live 5s candle updates, symbol follows left controls
- **Signals** — every BUY/SELL/HOLD with age timer
- **Trades** — closed trades, entry/exit/P&L
- **Log** — timestamped event stream

---

## API Endpoints

### Control

| Method | Endpoint | Body | Returns |
|--------|----------|------|---------|
| `GET` | `/api/bot/status` | — | Full state: running, config, wallet, lastSignal |
| `POST` | `/api/bot/start` | `{ symbol, strategy, timeframe, params, capital }` | Updated state |
| `POST` | `/api/bot/stop` | — | Updated state |
| `POST` | `/api/bot/kill-switch` | `{ enabled: true/false }` | Updated state |
| `POST` | `/api/bot/reset` | `{ capital? }` | Updated state |

### Data

| Method | Endpoint | Query params | Returns |
|--------|----------|--------------|---------|
| `GET` | `/api/bot/trades` | `?limit=20` | Closed trades array |
| `GET` | `/api/bot/signals` | `?limit=15` | Signal records array |
| `GET` | `/api/bot/logs` | `?limit=30` | Log entries array |
| `GET` | `/api/bot/candles` | `?symbol=PEPE/USDT&timeframe=1m&limit=100` | OHLCV candle array |
| `GET` | `/api/bot/ticker` | `?symbol=PEPE/USDT` | Live price + 24h stats |
| `GET` | `/api/health` | — | `{ status: "ok" }` |

### Socket.IO Events (server → client)

| Event | Payload | When |
|-------|---------|------|
| `session_start` | `{ symbol, strategy, timeframe }` | Bot starts → clears old UI data |
| `price` | `{ symbol, price, ts }` | Every 5 seconds |
| `wallet` | `{ balance, totalEquity, position }` | Every 5 seconds |
| `signal` | Signal document | Every strategy tick |
| `trade` | Trade document | On BUY or SELL |
| `log` | Log document | On any bot event |

---

## Configuration Reference

### Full start payload example
```json
{
  "symbol":    "PEPE/USDT",
  "strategy":  "rsi",
  "timeframe": "1m",
  "capital":   1000,
  "params": {
    "rsiPeriod":  5,
    "oversold":   45,
    "overbought": 55
  }
}
```

### All strategy params

| Strategy | Params |
|----------|--------|
| `ema_crossover` | `{ "fast": 9, "slow": 21 }` |
| `rsi` | `{ "rsiPeriod": 14, "oversold": 30, "overbought": 70 }` |
| `macd` | `{ "macdFast": 12, "macdSlow": 26, "macdSignal": 9 }` |
| `bollinger` | `{ "bbPeriod": 20, "bbStdDev": 2 }` |

---

## How Paper Trading Works

```
Start with $capital
      │
      ▼
  Fetch candles (Binance)
      │
      ▼
  Run strategy → BUY / SELL / HOLD
      │
   ┌──┴──────────────────────┐
   │                         │
  BUY                       SELL
  (no open position?)   (has open position?)
   │                         │
  Buy qty = 0.95×balance / price
  Fee = qty × price × 0.001  │
  Save signal to MongoDB      │
                        Exit qty at price
                        P&L = (exit - entry) × qty - fees
                        Save Trade to MongoDB
      │
      ▼
  Emit updates via Socket.IO
      │
      ▼
  Wait for next candle → repeat
```

---

## Symbols & Volatility Guide

| Symbol | Type | Volatility | Best Strategy |
|--------|------|------------|---------------|
| `PEPE/USDT` 🐸 | Meme | 🔴 Extreme | RSI Fast Mode |
| `WIF/USDT` 🐕 | Meme | 🔴 Extreme | MACD Scalp |
| `BONK/USDT` 🐾 | Meme | 🔴 Very High | RSI Fast Mode |
| `SHIB/USDT` | Meme | 🟠 Very High | Bollinger |
| `FLOKI/USDT` | Meme | 🟠 Very High | RSI |
| `DOGE/USDT` 🐶 | Meme | 🟠 High | EMA Crossover |
| `SOL/USDT` ☀️ | L1 | 🟡 High | MACD |
| `AVAX/USDT` | L1 | 🟡 Medium | EMA Crossover |
| `ETH/USDT` | L1 | 🟢 Medium | MACD |
| `BTC/USDT` | Store of value | 🟢 Low | EMA / Bollinger |

> **Fastest signals:** PEPE/WIF/BONK on 1m with RSI(5) oversold=45 overbought=55

---

## Troubleshooting

### Only seeing HOLD signals
- Thresholds are too wide. Use `rsiPeriod=5, oversold=45, overbought=55`
- Switch to a more volatile symbol: PEPE, WIF, or BONK

### Price shows `$0.00` for meme coins
- Update to the latest `client/src/utils/fmt.js` — it uses auto-decimal detection

### Old signals from previous sessions still showing
- Click **▶ Start** on a new session — a `session_start` event auto-clears the UI
- Or click **🔄 Reset** manually

### Server not reachable
```bash
# Check MongoDB
docker ps | grep mongo

# Check server
curl http://localhost:5000/api/health
# Expected: {"status":"ok"}
```

### Kill switch blocking start
- Click **🛡 Kill Switch → Deactivate** then try **▶ Start Bot** again

### Chart not loading
- Server must be running — chart fetches through `/api/bot/candles`
- Requires internet access to reach Binance

---

> ⚠️ **Paper mode only.** No real money is ever used.
> Always backtest thoroughly before risking real capital.
