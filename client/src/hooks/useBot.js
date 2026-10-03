/**
 * useBot.js
 * Single hook that owns all bot state.
 * Components just call { status, trades, signals, logs, start, stop, ... }
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";

const API = "/api/bot";

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  return res.json();
}

export function useBot() {
  const [status,    setStatus]    = useState(null);
  const [trades,    setTrades]    = useState([]);
  const [signals,   setSignals]   = useState([]);
  const [logs,      setLogs]      = useState([]);
  const [price,     setPrice]     = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    // Initial full data load
    const loadAll = () =>
      Promise.all([
        apiFetch("/status"),
        apiFetch("/trades?limit=20"),
        apiFetch("/signals?limit=15"),
        apiFetch("/logs?limit=30"),
      ])
        .then(([s, t, sig, l]) => {
          setStatus(s);
          setTrades(t.trades    || []);
          setSignals(sig.signals || []);
          setLogs(l.logs        || []);
        })
        .catch(() => {});      // silently ignore if server not yet up

    loadAll();

    // 5-second polling fallback — keeps UI fresh even if socket drops
    const poll = setInterval(() => {
      apiFetch("/status").then(setStatus).catch(() => {});
    }, 5000);

    // Socket.IO for instant live updates
    const socket = io({ transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect",       () => setConnected(true));
    socket.on("disconnect",    () => setConnected(false));
    // Clear stale UI state when a new bot session starts
    socket.on("session_start", () => {
      setSignals([]);
      setLogs([]);
      setTrades([]);
    });
    socket.on("price",  (d) => setPrice(d));
    socket.on("wallet", (d) => setStatus((prev) => prev ? { ...prev, ...d } : d));
    socket.on("trade",  (t) => setTrades((prev) => [t, ...prev].slice(0, 50)));
    socket.on("signal", (s) => setSignals((prev) => [s, ...prev].slice(0, 30)));
    socket.on("log",    (l) => setLogs((prev) => [l, ...prev].slice(0, 50)));

    return () => {
      clearInterval(poll);
      socket.disconnect();
    };
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────
  const start = useCallback(async (config) => {
    const data = await apiFetch("/start", { method: "POST", body: JSON.stringify(config) });
    if (!data.ok) throw new Error(data.message || "Failed to start");
    setStatus((prev) => ({ ...prev, ...data }));
    return data;
  }, []);

  const stop = useCallback(async () => {
    const data = await apiFetch("/stop", { method: "POST" });
    setStatus((prev) => ({ ...prev, ...data }));
  }, []);

  const toggleKillSwitch = useCallback(async (enabled) => {
    const data = await apiFetch("/kill-switch", {
      method: "POST",
      body: JSON.stringify({ enabled }),
    });
    setStatus((prev) => ({ ...prev, ...data }));
  }, []);

  const reset = useCallback(async () => {
    const data = await apiFetch("/reset", { method: "POST" });
    setStatus((prev) => ({ ...prev, ...data }));
    setTrades([]);
    setSignals([]);
    setLogs([]);
  }, []);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const winRate  = trades.length
    ? Math.round((trades.filter((t) => t.pnl > 0).length / trades.length) * 100)
    : 0;
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);

  return {
    status, price, trades, signals, logs, connected,
    winRate, totalPnl,
    start, stop, toggleKillSwitch, reset,
  };
}
