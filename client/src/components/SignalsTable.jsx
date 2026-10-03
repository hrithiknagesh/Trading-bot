/** SignalsTable.jsx — live strategy signals feed */

import { fmtPrice } from "../utils/fmt";

const SIG_COLOR = {
  BUY:  "var(--green)",
  SELL: "var(--red)",
  HOLD: "var(--muted)",
};

const SIG_BG = {
  BUY:  "rgba(0,208,132,0.08)",
  SELL: "rgba(255,71,87,0.08)",
  HOLD: "transparent",
};

// How many seconds ago was this signal?
function ageLabel(ts) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return new Date(ts).toLocaleTimeString();
}

export default function SignalsTable({ signals }) {
  if (!signals?.length) return (
    <div className="card fade-up">
      <div className="card-title">Recent Signals</div>
      <div style={{ padding: "20px 0", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
        Start the bot to see signals
      </div>
    </div>
  );

  return (
    <div className="card fade-up">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span className="card-title" style={{ marginBottom: 0 }}>Recent Signals</span>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>
          {signals.filter(s => s.signal !== "HOLD").length} action signals
        </span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Signal</th>
              <th>Price</th>
              <th>RSI / Reason</th>
              <th>Age</th>
            </tr>
          </thead>
          <tbody>
            {signals.map((s, i) => (
              <tr key={s._id || i} style={{ background: SIG_BG[s.signal] }}>
                <td>
                  <span
                    className={`badge badge-${s.signal.toLowerCase()}`}
                    style={{ fontSize: 12, padding: "3px 10px" }}
                  >
                    {s.signal === "BUY" ? "📈 " : s.signal === "SELL" ? "📉 " : "⏸ "}
                    {s.signal}
                  </span>
                </td>
                <td style={{ color: SIG_COLOR[s.signal], fontWeight: 600 }}>
                  ${fmtPrice(s.price)}
                </td>
                <td style={{ color: "var(--muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.reason}
                </td>
                <td style={{ color: "var(--muted)", whiteSpace: "nowrap", fontSize: 11 }}>
                  {ageLabel(s.ts)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
