/**
 * BotControls.jsx
 * Left panel: capital input, strategy config, Start/Stop, Kill Switch.
 * Changing symbol or timeframe here instantly updates the chart on the right.
 */

import { useState } from "react";
import toast from "react-hot-toast";
import { VOLATILE_SYMBOLS } from "./PriceChart";

const STRATEGIES = [
  { value: "ema_crossover", label: "EMA Crossover", desc: "Golden/death cross" },
  { value: "rsi",           label: "RSI",            desc: "Overbought/oversold" },
  { value: "macd",          label: "MACD",           desc: "Histogram crossover" },
  { value: "bollinger",     label: "Bollinger Bands", desc: "Band breakout" },
];

const TIMEFRAMES = ["1m", "3m", "5m", "15m", "1h"];

const DEFAULTS = {
  ema_crossover: { fast: 9, slow: 21 },
  rsi:           { rsiPeriod: 14, oversold: 30, overbought: 70 },
  macd:          { macdFast: 12, macdSlow: 26, macdSignal: 9 },
  bollinger:     { bbPeriod: 20, bbStdDev: 2 },
};

// ── One-click presets ─────────────────────────────────────────────────────────
const PRESETS = [
  {
    id: "fast",
    label: "⚡ Fast Mode",
    desc: "RSI(5) 45/55 on PEPE — signals every few minutes",
    color: "var(--green)",
    config: {
      symbol: "PEPE/USDT", strategy: "rsi", timeframe: "1m", capital: 1000,
      params: { rsiPeriod: 5, oversold: 45, overbought: 55 },
    },
  },
  {
    id: "swing",
    label: "📈 Swing",
    desc: "EMA(5/13) crossover on DOGE 1m",
    color: "var(--accent)",
    config: {
      symbol: "DOGE/USDT", strategy: "ema_crossover", timeframe: "1m", capital: 5000,
      params: { fast: 5, slow: 13 },
    },
  },
  {
    id: "macd",
    label: "📊 MACD Scalp",
    desc: "Fast MACD on WIF 1m",
    color: "var(--yellow)",
    config: {
      symbol: "WIF/USDT", strategy: "macd", timeframe: "1m", capital: 2000,
      params: { macdFast: 6, macdSlow: 13, macdSignal: 5 },
    },
  },
];

// Props:
//   status         — bot status from server
//   onStart        — (config) => Promise
//   onStop         — () => void
//   onKillSwitch   — (enabled) => void
//   onReset        — (capital) => void
//   onChartChange  — ({ symbol, timeframe }) => void  ← controls the chart
export default function BotControls({
  status, onStart, onStop, onKillSwitch, onReset, onChartChange,
}) {
  const running    = status?.running;
  const killActive = status?.killSwitch;

  const [symbol,    setSymbol]    = useState("PEPE/USDT");
  const [strategy,  setStrategy]  = useState("rsi");
  const [timeframe, setTimeframe] = useState("1m");
  const [params,    setParams]    = useState({ rsiPeriod: 5, oversold: 45, overbought: 55 });
  const [capital,   setCapital]   = useState(1000);
  const [activePreset, setActivePreset] = useState("fast");

  // Apply a preset in one click
  const applyPreset = (preset) => {
    if (running) return;
    const { symbol: s, strategy: st, timeframe: tf, capital: cap, params: p } = preset.config;
    setSymbol(s); setStrategy(st); setTimeframe(tf); setCapital(cap); setParams(p);
    setActivePreset(preset.id);
    onChartChange?.({ symbol: s, timeframe: tf });
    toast(`${preset.label} applied!`, { icon: "✅" });
  };

  // Helper: change symbol AND update chart
  const changeSymbol = (s) => {
    setSymbol(s);
    onChartChange?.({ symbol: s, timeframe });
  };

  // Helper: change timeframe AND update chart
  const changeTimeframe = (tf) => {
    setTimeframe(tf);
    onChartChange?.({ symbol, timeframe: tf });
  };

  const handleStrategyChange = (s) => {
    setStrategy(s);
    setParams(DEFAULTS[s]);
  };

  const handleParamChange = (key, val) => {
    setParams((p) => ({ ...p, [key]: parseFloat(val) }));
  };

  const handleStart = async () => {
    try {
      await onStart({ symbol, strategy, timeframe, params, capital });
      toast.success(`Bot started on ${symbol}! 🚀`);
    } catch (e) {
      toast.error(e.message || "Failed to start");
    }
  };

  const handleStop = async () => {
    await onStop();
    toast("Bot stopped ⏹");
  };

  const handleReset = async () => {
    if (!confirm(`Reset bot and restore $${capital.toLocaleString()} capital?`)) return;
    await onReset(capital);
    toast("Bot reset 🔄");
  };

  return (
    <div className="card fade-up">

      {/* ── Status bar ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span className={`status-dot ${running ? "running" : "stopped"}`} />
        <span style={{ fontWeight: 700, fontSize: 14 }}>
          {killActive ? "🚨 Halted" : running ? "Running" : "Configure Bot"}
        </span>
      </div>

      {/* ── Presets ────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 14 }}>
        <div className="form-label" style={{ marginBottom: 6 }}>⚡ Quick Presets</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              disabled={running}
              onClick={() => applyPreset(preset)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 12px", borderRadius: 8, border: "1px solid",
                cursor: running ? "not-allowed" : "pointer",
                background: activePreset === preset.id ? `${preset.color}18` : "var(--card2)",
                borderColor: activePreset === preset.id ? preset.color : "var(--border)",
                transition: "all .15s", textAlign: "left", width: "100%", fontFamily: "inherit",
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: activePreset === preset.id ? preset.color : "var(--text)" }}>
                  {preset.label}
                </div>
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>
                  {preset.desc}
                </div>
              </div>
              {activePreset === preset.id && (
                <span style={{ fontSize: 10, fontWeight: 700, color: preset.color }}>ACTIVE</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: "var(--border)", marginBottom: 14 }} />


      {/* ── Capital ────────────────────────────────────────────────────────── */}
      <div className="form-row">
        <label className="form-label">💰 Starting Capital (USDT)</label>
        <div style={{ position: "relative" }}>
          <span style={{
            position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
            color: "var(--muted)", fontSize: 13, fontWeight: 600,
          }}>$</span>
          <input
            type="number"
            className="form-input"
            style={{ paddingLeft: 22 }}
            value={capital}
            min={100}
            step={100}
            disabled={running}
            onChange={(e) => setCapital(parseFloat(e.target.value) || 10000)}
          />
        </div>
        {running && (
          <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 3 }}>
            Stop bot to change capital
          </div>
        )}
      </div>

      <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />

      {/* ── Config (locked while running) ─────────────────────────────────── */}
      <fieldset disabled={running} style={{ border: "none", padding: 0, opacity: running ? 0.55 : 1 }}>

        {/* Symbol */}
        <div className="form-row">
          <label className="form-label">Symbol</label>
          <select
            className="form-select"
            value={symbol}
            onChange={(e) => changeSymbol(e.target.value)}
          >
            {VOLATILE_SYMBOLS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Timeframe */}
        <div className="form-row">
          <label className="form-label">Timeframe</label>
          <div style={{ display: "flex", gap: 5 }}>
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => changeTimeframe(tf)}
                style={{
                  flex: 1, padding: "6px 0", borderRadius: 6,
                  fontSize: 12, fontWeight: 700, fontFamily: "var(--mono)",
                  border: "1px solid",
                  cursor: running ? "not-allowed" : "pointer",
                  background: timeframe === tf ? "var(--accent)" : "var(--card2)",
                  borderColor: timeframe === tf ? "var(--accent)" : "var(--border)",
                  color: timeframe === tf ? "#fff" : "var(--muted)",
                  transition: "all .15s",
                }}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Strategy */}
        <div className="form-row">
          <label className="form-label">Strategy</label>
          <select
            className="form-select"
            value={strategy}
            onChange={(e) => handleStrategyChange(e.target.value)}
          >
            {STRATEGIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label} — {s.desc}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic params */}
        <div className="form-row">
          <label className="form-label">Parameters</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {Object.entries(params).map(([key, val]) => (
              <div key={key}>
                <label className="form-label" style={{ fontSize: 9 }}>{key}</label>
                <input
                  type="number"
                  className="form-input"
                  value={val}
                  onChange={(e) => handleParamChange(key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      </fieldset>

      {/* ── Start / Stop ───────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
        {!running ? (
          <button
            id="start-bot"
            className="btn btn-start"
            onClick={handleStart}
            disabled={killActive}
            title={killActive ? "Deactivate kill switch first" : "Start bot"}
          >
            ▶ Start Bot {capital ? `($${capital.toLocaleString()})` : ""}
          </button>
        ) : (
          <button id="stop-bot" className="btn btn-stop" onClick={handleStop}>
            ⏹ Stop Bot
          </button>
        )}

        <button
          className="btn btn-ghost btn-sm"
          style={{ alignSelf: "center" }}
          onClick={handleReset}
        >
          🔄 Reset
        </button>
      </div>

      {/* ── Kill Switch ────────────────────────────────────────────────────── */}
      <div className={`kill-bar ${killActive ? "active" : ""}`} style={{ marginTop: 12 }}>
        <div>
          <div className="kill-label" style={{ color: killActive ? "var(--red)" : "var(--yellow)" }}>
            {killActive ? "🚨 Kill Switch ON" : "🛡 Kill Switch"}
          </div>
          <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>
            {killActive ? "All orders blocked" : "Emergency stop"}
          </div>
        </div>
        <button
          id="kill-switch"
          className={`btn btn-sm ${killActive ? "btn-ghost" : "btn-stop"}`}
          onClick={() => onKillSwitch(!killActive)}
        >
          {killActive ? "Deactivate" : "Activate"}
        </button>
      </div>
    </div>
  );
}
