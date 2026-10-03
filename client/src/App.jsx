/**
 * App.jsx  ← THE ENTIRE FRONTEND IS THIS ONE PAGE
 * No routing. No login. Open http://localhost:5173 → configure → click Start.
 */

import { useState }    from "react";
import { Toaster }     from "react-hot-toast";
import { useBot }      from "./hooks/useBot";
import StatCards       from "./components/StatCards";
import BotControls     from "./components/BotControls";
import BotStatus       from "./components/BotStatus";
import PriceChart      from "./components/PriceChart";
import SignalsTable    from "./components/SignalsTable";
import TradeTable      from "./components/TradeTable";
import ActivityLog     from "./components/ActivityLog";

export default function App() {
  const {
    status, price, trades, signals, logs, connected,
    winRate, totalPnl,
    start, stop, toggleKillSwitch, reset,
  } = useBot();

  // Chart symbol & timeframe — controlled by BotControls dropdowns
  const [chartSymbol,    setChartSymbol]    = useState("PEPE/USDT");
  const [chartTimeframe, setChartTimeframe] = useState("1m");

  const handleChartChange = ({ symbol, timeframe }) => {
    if (symbol)    setChartSymbol(symbol);
    if (timeframe) setChartTimeframe(timeframe);
  };

  return (
    <div className="app">
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--card)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            fontSize: 13,
          },
        }}
      />

      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <div className="topbar">
        <div className="logo">
          <div className="logo-icon">⚡</div>
          <span className="logo-text">CryptoBot</span>
          <span style={{
            marginLeft: 8, fontSize: 11, padding: "2px 8px",
            background: "rgba(245,166,35,0.12)", color: "var(--yellow)",
            borderRadius: 100, fontWeight: 600,
          }}>
            PAPER MODE
          </span>
        </div>

        <div style={{ display: "flex", gap: 20, alignItems: "center", fontSize: 13, color: "var(--muted)" }}>
          <span>
            <span className="status-dot" style={{
              background: connected ? "var(--green)" : "var(--red)",
              boxShadow: connected ? "0 0 8px var(--green)" : "none",
            }} />
            {connected ? "Connected" : "Connecting…"}
          </span>
          <span>
            <span className={`status-dot ${status?.running ? "running" : "stopped"}`} />
            {status?.running
              ? `Live · ${status.config?.symbol} · ${status.config?.strategy}`
              : "Idle"}
          </span>
          <span style={{ fontFamily: "var(--mono)" }}>
            Trades: <b style={{ color: "var(--text)" }}>{trades.length}</b>
          </span>
          <span style={{ fontFamily: "var(--mono)" }}>
            Win: <b style={{ color: winRate >= 50 ? "var(--green)" : "var(--red)" }}>{winRate}%</b>
          </span>
          {status?.realisedPnl !== undefined && (
            <span style={{ fontFamily: "var(--mono)" }}>
              P&L:{" "}
              <b style={{ color: status.realisedPnl >= 0 ? "var(--green)" : "var(--red)" }}>
                {status.realisedPnl >= 0 ? "+" : ""}${status.realisedPnl?.toFixed(2)}
              </b>
            </span>
          )}
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <StatCards status={status} price={price} totalPnl={totalPnl} winRate={winRate} />

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <div className="grid-main">

        {/* Left: controls + activity panel stacked */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <BotControls
            status={status}
            onStart={start}
            onStop={stop}
            onKillSwitch={toggleKillSwitch}
            onReset={reset}
            onChartChange={handleChartChange}
          />
          {/* "What is the bot doing" — below controls */}
          <BotStatus status={status} />
        </div>

        {/* Right: chart + tables */}
        <div className="grid-right">
          {/* Chart — driven by left panel dropdowns */}
          <PriceChart symbol={chartSymbol} timeframe={chartTimeframe} />
          <SignalsTable signals={signals} />
          <TradeTable  trades={trades} />
          <ActivityLog logs={logs} />
        </div>

      </div>
    </div>
  );
}
