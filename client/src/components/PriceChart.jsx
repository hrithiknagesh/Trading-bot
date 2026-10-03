/**
 * PriceChart.jsx
 * - Loads candles from our backend /api/bot/candles (works for all symbols)
 * - Refreshes the full candle set every 30 seconds
 * - Updates the current (last) candle in real-time on every 5-second price tick
 * - Auto-recreates chart when symbol changes
 */

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CrosshairMode } from "lightweight-charts";

// Highly volatile symbols the chart supports
export const VOLATILE_SYMBOLS = [
  "PEPE/USDT",    // 🐸 meme coin — extremely volatile
  "WIF/USDT",     // 🐕 dogwifhat  — meme coin
  "DOGE/USDT",    // 🐶 classic meme
  "SHIB/USDT",    // 🐕 shiba inu
  "FLOKI/USDT",   // ⚡ floki
  "BONK/USDT",    // 🐾 bonk
  "SOL/USDT",     // ☀️ solana — high vol
  "AVAX/USDT",    // 🏔️ avalanche
  "ETH/USDT",     // Ξ ethereum
  "BTC/USDT",     // ₿ bitcoin
];

async function fetchCandles(symbol, timeframe = "1m", limit = 150) {
  const enc = encodeURIComponent(symbol);
  const res  = await fetch(`/api/bot/candles?symbol=${enc}&timeframe=${timeframe}&limit=${limit}`);
  const data = await res.json();
  return (data.candles || []).map(([ts, o, h, l, c]) => ({
    time:  Math.floor(ts / 1000),
    open:  o, high: h, low: l, close: c,
  }));
}

async function fetchTicker(symbol) {
  const enc = encodeURIComponent(symbol);
  const res  = await fetch(`/api/bot/ticker?symbol=${enc}`);
  return res.json();
}

export default function PriceChart({ symbol, timeframe = "1m" }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const seriesRef    = useRef(null);
  const lastBarRef   = useRef(null);   // stores the current open candle
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [ticker,  setTicker]  = useState(null);

  // ── Build chart ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    setLoading(true);
    setError(null);

    // Create chart instance
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#64748b",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.07)",
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.07)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
      },
      height: 320,
    });

    const series = chart.addCandlestickSeries({
      upColor:         "#00d084",
      downColor:       "#ff4757",
      borderUpColor:   "#00d084",
      borderDownColor: "#ff4757",
      wickUpColor:     "#00d084",
      wickDownColor:   "#ff4757",
    });

    chartRef.current  = chart;
    seriesRef.current = series;

    // Resize handler
    const onResize = () => {
      if (containerRef.current)
        chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener("resize", onResize);

    // Initial candle load
    fetchCandles(symbol, timeframe)
      .then((bars) => {
        if (!bars.length) { setError("No candles yet"); setLoading(false); return; }
        series.setData(bars);
        lastBarRef.current = { ...bars.at(-1) };
        chart.timeScale().fitContent();
        setLoading(false);
      })
      .catch((e) => { setError(e.message); setLoading(false); });

    return () => {
      window.removeEventListener("resize", onResize);
      chart.remove();
      chartRef.current  = null;
      seriesRef.current = null;
      lastBarRef.current = null;
    };
  }, [symbol, timeframe]);

  // ── Real-time price updates (every 5 s from backend ticker) ───────────────
  useEffect(() => {
    if (!symbol) return;

    const updateTick = async () => {
      try {
        const t = await fetchTicker(symbol);
        if (!t?.last) return;
        setTicker(t);

        const series = seriesRef.current;
        const last   = lastBarRef.current;
        if (!series || !last) return;

        // Calculate the current 1m candle's open timestamp
        const nowSec  = Math.floor(Date.now() / 1000);
        const barTime = nowSec - (nowSec % 60);   // floor to minute

        if (barTime === last.time) {
          // Same candle — update high/low/close in place
          const updated = {
            time:  last.time,
            open:  last.open,
            high:  Math.max(last.high, t.last),
            low:   Math.min(last.low,  t.last),
            close: t.last,
          };
          series.update(updated);
          lastBarRef.current = updated;
        } else {
          // New candle opened
          const newBar = { time: barTime, open: t.last, high: t.last, low: t.last, close: t.last };
          series.update(newBar);
          lastBarRef.current = newBar;
        }
      } catch { /* ignore */ }
    };

    updateTick(); // run immediately
    const t = setInterval(updateTick, 5000);
    return () => clearInterval(t);
  }, [symbol, timeframe]);

  // ── Full candle refresh every 30 s ────────────────────────────────────────
  useEffect(() => {
    if (!symbol) return;
    const t = setInterval(async () => {
      try {
        const bars = await fetchCandles(symbol, timeframe);
        if (!bars.length || !seriesRef.current) return;
        seriesRef.current.setData(bars);
        lastBarRef.current = { ...bars.at(-1) };
      } catch { /* ignore */ }
    }, 30_000);
    return () => clearInterval(t);
  }, [symbol, timeframe]);

  const changeColor = ticker?.percentage >= 0 ? "#00d084" : "#ff4757";

  return (
    <div className="card fade-up" style={{ position: "relative" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="card-title" style={{ marginBottom: 0 }}>
            {symbol} — {timeframe} Live
          </span>
          <span
            style={{
              width: 6, height: 6, borderRadius: "50%", background: "#00d084",
              animation: "pulse 1.5s infinite", display: "inline-block",
            }}
          />
        </div>
        {ticker && (
          <div style={{ fontFamily: "var(--mono)", textAlign: "right" }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: changeColor }}>
              ${ticker.last?.toLocaleString("en-US", { maximumFractionDigits: ticker.last < 1 ? 8 : 2 })}
            </span>
            <span style={{ fontSize: 12, color: changeColor, marginLeft: 8 }}>
              {ticker.percentage >= 0 ? "+" : ""}{ticker.percentage?.toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ position: "relative" }}>
        <div ref={containerRef} style={{ width: "100%", height: 320 }} />
        {loading && (
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center",
            background: "var(--card)", borderRadius: 8,
          }}>
            <div style={{ textAlign: "center", color: "var(--muted)" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>📡</div>
              <div style={{ fontSize: 13 }}>Loading candles…</div>
            </div>
          </div>
        )}
        {error && !loading && (
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center",
            color: "var(--red)", fontSize: 13,
          }}>
            ⚠ {error}
          </div>
        )}
      </div>

      {/* Update note */}
      <div style={{ marginTop: 6, fontSize: 10, color: "var(--muted)", textAlign: "right" }}>
        Updates every 5s · Full refresh every 30s
      </div>
    </div>
  );
}
