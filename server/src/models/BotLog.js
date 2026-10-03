const { Schema, model } = require("mongoose");

const logSchema = new Schema({
  msg:  { type: String, required: true },
  type: { type: String, enum: ["info", "buy", "sell", "profit", "loss", "error"], default: "info" },
  ts:   { type: Date, default: Date.now },
});

logSchema.index({ ts: -1 });

module.exports = model("BotLog", logSchema);
