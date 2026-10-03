/** StatCards.jsx — top row of 5 live stat cards */

const FMT = (n) => n?.toLocaleString("en-US", { maximumFractionDigits: 2 }) ?? "—";

export default function StatCards({ status, price, totalPnl, winRate }) {
  const equity     = status?.totalEquity;
  const pnlColor   = totalPnl >= 0 ? "var(--green)" : "var(--red)";
  const equityDiff = equity && status?.capital ? ((equity - status.capital) / status.capital * 100).toFixed(2) : null;

  return (
    <div className="stats-row fade-up">
      <div className="stat">
        <div className="stat-label">Live Price</div>
        <div className="stat-value" style={{ fontSize: 18 }}>
          ${FMT(price?.price ?? status?.position?.currentPrice)}
        </div>
        <div className="stat-sub">{status?.config?.symbol ?? "BTC/USDT"}</div>
      </div>

      <div className="stat">
        <div className="stat-label">Balance (USDT)</div>
        <div className="stat-value" style={{ fontSize: 18 }}>${FMT(status?.balance)}</div>
        <div className="stat-sub">Free capital</div>
      </div>

      <div className="stat">
        <div className="stat-label">Total Equity</div>
        <div className="stat-value" style={{ fontSize: 18, color: equity >= status?.capital ? "var(--green)" : "var(--red)" }}>
          ${FMT(equity)}
        </div>
        <div className="stat-sub">{equityDiff !== null ? `${equityDiff >= 0 ? "+" : ""}${equityDiff}%` : ""}</div>
      </div>

      <div className="stat">
        <div className="stat-label">Realised P&L</div>
        <div className="stat-value" style={{ fontSize: 18, color: pnlColor }}>
          {totalPnl >= 0 ? "+" : ""}${FMT(totalPnl)}
        </div>
        <div className="stat-sub">All closed trades</div>
      </div>

      <div className="stat">
        <div className="stat-label">Win Rate</div>
        <div className="stat-value" style={{ fontSize: 18 }}>{winRate}%</div>
        <div className="stat-sub">{status?.totalTrades ?? 0} trades total</div>
      </div>
    </div>
  );
}
