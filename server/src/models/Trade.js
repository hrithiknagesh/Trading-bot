const { Schema, model } = require("mongoose");

const tradeSchema = new Schema({
  symbol:     { type: String, required: true },
  side:       { type: String, enum: ["buy", "sell"], required: true },
  qty:        { type: Number, required: true },
  entryPrice: { type: Number, required: true },
  exitPrice:  { type: Number, required: true },
  pnl:        { type: Number, required: true },
  strategy:   { type: String, required: true },
  mode:       { type: String, default: "paper" },
  ts:         { type: Date,   default: Date.now },
});

tradeSchema.index({ ts: -1 });

module.exports = model("Trade", tradeSchema);
