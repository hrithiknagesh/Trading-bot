const { Schema, model } = require("mongoose");

const signalSchema = new Schema({
  signal:   { type: String, enum: ["BUY", "SELL", "HOLD"], required: true },
  symbol:   { type: String, required: true },
  price:    { type: Number, required: true },
  strategy: { type: String, required: true },
  reason:   { type: String },
  ts:       { type: Date, default: Date.now },
});

signalSchema.index({ ts: -1 });

module.exports = model("Signal", signalSchema);
