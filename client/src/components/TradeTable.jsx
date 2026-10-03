/** TradeTable.jsx — completed paper trades */

import { format } from "../utils/fmt";

export default function TradeTable({ trades }) {
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);

  if (!trades?.length) return (
    <div className="card fade-up">
      <div className="card-title">Trade History</div>
      <div style={{ padding: "20px 0", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
        No closed trades yet
      </div>
    </div>
  );

  return (
    <div className="card fade-up">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div className="card-title" style={{ marginBottom: 0 }}>Trade History</div>
        <span style={{
          fontSize: 13, fontWeight: 700, fontFamily: "var(--mono)",
          color: totalPnl >= 0 ? "var(--green)" : "var(--red)"
        }}>
          Total: {totalPnl >= 0 ? "+" : ""}${format(totalPnl)}
        </span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Qty</th>
              <th>Entry</th>
              <th>Exit</th>
              <th>P&L</th>
              <th>Strategy</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t, i) => (
              <tr key={t._id || i}>
                <td style={{ fontWeight: 600 }}>{t.symbol}</td>
                <td>{t.qty?.toFixed(6)}</td>
                <td>${format(t.entryPrice)}</td>
                <td>${format(t.exitPrice)}</td>
                <td>
                  <span className={`badge badge-${t.pnl >= 0 ? "profit" : "loss"}`}>
                    {t.pnl >= 0 ? "+" : ""}${format(t.pnl)}
                  </span>
                </td>
                <td style={{ color: "var(--muted)" }}>{t.strategy}</td>
                <td style={{ color: "var(--muted)" }}>{new Date(t.ts).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
