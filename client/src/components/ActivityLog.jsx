/** ActivityLog.jsx — live bot event log */

const TYPE_COLORS = {
  info:   "var(--muted)",
  buy:    "var(--green)",
  sell:   "var(--accent)",
  profit: "var(--green)",
  loss:   "var(--red)",
  error:  "var(--red)",
};

export default function ActivityLog({ logs }) {
  if (!logs?.length) return (
    <div className="card fade-up">
      <div className="card-title">Activity Log</div>
      <div style={{ padding: "20px 0", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
        Log is empty
      </div>
    </div>
  );

  return (
    <div className="card fade-up">
      <div className="card-title">Activity Log</div>
      <div className="log-list">
        {logs.map((l, i) => (
          <div key={l._id || i} className={`log-item ${l.type}`}>
            <span className="log-ts">{new Date(l.ts).toLocaleTimeString()}</span>
            <span className="log-msg" style={{ color: TYPE_COLORS[l.type] || "var(--text)" }}>
              {l.msg}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
