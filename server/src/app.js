const express = require("express");
const cors    = require("cors");
const botRouter = require("./routes/bot.routes");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

// All bot API under /api/bot
app.use("/api/bot", botRouter);

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

module.exports = app;
