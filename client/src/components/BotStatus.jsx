/**
 * BotStatus.jsx
 * "What is the bot doing right now?" panel.
 * Shows: running state, current strategy, last signal, open position, live P&L.
 */

import { format, fmtPrice } from "../utils/fmt";

const SIGNAL_STYLE = {
  BUY:  { bg: "rgba(0,208,132,0.1)",  border: "rgba(0,208,132,0.3)",  color: "var(--green)", icon: "📈" },
  SELL: { bg: "rgba(255,71,87,0.1)",   border: "rgba(255,71,87,0.3)",   color: "var(--red)",   icon: "📉" },
  HOLD: { bg: "rgba(100,116,139,0.1)", border: "rgba(100,116,139,0.2)", color: "var(--muted)", icon: "⏸" },
};

const STRATEGY_LABEL = {
  ema_crossover: "EMA Crossover",
  rsi:           "RSI",
  macd:          "MACD",
  bollinger:     "Bollinger Bands",
};

export default function BotStatus({ status }) {
  if (!status) return null;

  const { running, killSwitch, config, lastSignal, position, balance, capital, realisedPnl, totalEquity } = status;

  const sig = lastSignal?.signal || "HOLD";
  const ss  = SIGNAL_STYLE[sig] || SIGNAL_STYLE.HOLD;

  const returnPct = capital
    ? (((totalEquity - capital) / capital) * 100).toFixed(2)
    : null;

  return (
    <div className="card fade-up" style={{ marginTop: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>🤖 Bot Activity</span>
        <span style={{
          marginLeft: "auto", fontSize: 11, fontWeight: 700,
          padding: "2px 8px", borderRadius: 100,
          background: running ? "rgba(0,208,132,0.1)" : "rgba(100,116,139,0.1)",
          color: running ? "var(--green)" : "var(--muted)",
          border: `1px solid ${running ? "rgba(0,208,132,0.3)" : "rgba(100,116,139,0.2)"}`,
        }}>
          {killSwitch ? "🚨 HALTED" : running ? "● RUNNING" : "○ IDLE"}
        </span>
      </div>

      {/* Config summary */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        gap: 6, marginBottom: 12,
      }}>
        {[
          { label: "Symbol",    value: config?.symbol },
          { label: "Strategy",  value: STRATEGY_LABEL[config?.strategy] || config?.strategy },
          { label: "Timeframe", value: config?.timeframe },
        ].map((r) => (
          <div key={r.label} style={{
            background: "var(--card2)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "8px 10px",
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)" }}>
              {r.label}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--mono)", marginTop: 2 }}>
              {r.value || "—"}
            </div>
          </div>
        ))}
      </div>

      {/* Last signal */}
      <div style={{
        padding: "10px 12px", borderRadius: 8, marginBottom: 12,
        background: ss.bg, border: `1px solid ${ss.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{ss.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: ss.color }}>
              Last Signal: {sig}
              {lastSignal?.price && (
                <span style={{ fontFamily: "var(--mono)", fontWeight: 400, marginLeft: 8, color: "var(--muted)" }}>
                  @ ${fmtPrice(lastSignal.price)}
                </span>
              )}
            </div>
            {lastSignal?.reason && (
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                {lastSignal.reason}
              </div>
            )}
          </div>
          {lastSignal?.ts && (
            <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--mono)" }}>
              {new Date(lastSignal.ts).toLocaleTimeString()}
            </span>
          )}
        </div>
        {!lastSignal && (
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            {running ? "Waiting for first candle close…" : "Start the bot to see signals"}
          </div>
        )}
      </div>

      {/* Open position */}
      {position ? (
        <div style={{
          padding: "10px 12px", borderRadius: 8, marginBottom: 12,
          background: "rgba(99,130,255,0.06)", border: "1px solid rgba(99,130,255,0.2)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", marginBottom: 6 }}>
            📌 Open Position
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontFamily: "var(--mono)", fontSize: 12 }}>
            <div>Qty: <b>{position.qty?.toFixed(6)}</b></div>
            <div>Entry: <b>${format(position.entryPrice, position.entryPrice < 1 ? 8 : 2)}</b></div>
            <div>Now: <b>${format(position.currentPrice, position.currentPrice < 1 ? 8 : 2)}</b></div>
            <div style={{ color: position.unrealisedPnl >= 0 ? "var(--green)" : "var(--red)" }}>
              P&L: <b>{position.unrealisedPnl >= 0 ? "+" : ""}${format(position.unrealisedPnl)}</b>
            </div>
          </div>
        </div>
      ) : running ? (
        <div style={{
          padding: "8px 12px", borderRadius: 8, marginBottom: 12,
          background: "var(--card2)", border: "1px solid var(--border)",
          fontSize: 12, color: "var(--muted)",
        }}>
          📭 No open position — waiting for BUY signal
        </div>
      ) : null}

      {/* Wallet summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {[
          { label: "Starting Capital", value: `$${format(capital)}` },
          { label: "Free Balance",     value: `$${format(balance)}` },
          { label: "Total Equity",     value: `$${format(totalEquity)}`, colored: true, positive: (totalEquity >= capital) },
          { label: "Realised P&L",     value: `${realisedPnl >= 0 ? "+" : ""}$${format(realisedPnl)}`, colored: true, positive: (realisedPnl >= 0) },
        ].map((r) => (
          <div key={r.label} style={{
            background: "var(--card2)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "8px 10px",
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)" }}>
              {r.label}
            </div>
            <div style={{
              fontSize: 14, fontWeight: 700, fontFamily: "var(--mono)", marginTop: 2,
              color: r.colored ? (r.positive ? "var(--green)" : "var(--red)") : "var(--text)",
            }}>
              {r.value}
            </div>
          </div>
        ))}
      </div>

      {returnPct !== null && (
        <div style={{
          marginTop: 8, padding: "6px 10px", borderRadius: 6, textAlign: "center",
          fontSize: 12, fontFamily: "var(--mono)", fontWeight: 700,
          background: returnPct >= 0 ? "rgba(0,208,132,0.06)" : "rgba(255,71,87,0.06)",
          color: returnPct >= 0 ? "var(--green)" : "var(--red)",
          border: `1px solid ${returnPct >= 0 ? "rgba(0,208,132,0.2)" : "rgba(255,71,87,0.2)"}`,
        }}>
          Overall Return: {returnPct >= 0 ? "+" : ""}{returnPct}%
        </div>
      )}
    </div>
  );
}
