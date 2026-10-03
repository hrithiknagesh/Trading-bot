/**
 * paper.service.js
 * Simulates order fills in-memory (paper trading).
 * Keeps track of balance, open position, and computed PnL.
 */

const TAKER_FEE = 0.001; // 0.1% per fill

class PaperWallet {
  constructor(initialCapital = 10_000) {
    this.capital  = initialCapital;
    this.balance  = initialCapital; // USDT
    this.position = null;           // { qty, entryPrice, entryTime, symbol }
    this.realisedPnl = 0;
  }

  /** Place a market BUY — uses 95% of free balance */
  buy(price, symbol) {
    if (this.position) return null; // already in a trade

    const spend = this.balance * 0.95;
    const fee   = spend * TAKER_FEE;
    const qty   = (spend - fee) / price;

    this.balance -= spend;
    this.position = {
      symbol,
      qty,
      entryPrice:    price,
      entryTime:     new Date().toISOString(),
      currentPrice:  price,
      unrealisedPnl: 0,
    };

    return { qty, price, fee, cost: spend };
  }

  /** Place a market SELL — closes the full position */
  sell(price) {
    if (!this.position) return null;

    const gross = this.position.qty * price;
    const fee   = gross * TAKER_FEE;
    const net   = gross - fee;
    const pnl   = net - this.position.qty * this.position.entryPrice;

    this.balance     += net;
    this.realisedPnl += pnl;

    const filled = { ...this.position, exitPrice: price, pnl, fee };
    this.position = null;
    return filled;
  }

  /** Call on every price tick to keep unrealised PnL current */
  updatePrice(price) {
    if (!this.position) return;
    this.position.currentPrice  = price;
    this.position.unrealisedPnl = (price - this.position.entryPrice) * this.position.qty;
  }

  snapshot() {
    return {
      capital:      this.capital,
      balance:      this.balance,
      realisedPnl:  this.realisedPnl,
      position:     this.position ? { ...this.position } : null,
      totalEquity:  this.balance + (this.position
        ? this.position.qty * (this.position.currentPrice || this.position.entryPrice)
        : 0),
    };
  }

  reset(initialCapital) {
    this.capital      = initialCapital ?? this.capital;
    this.balance      = this.capital;
    this.position     = null;
    this.realisedPnl  = 0;
  }
}

module.exports = PaperWallet;
