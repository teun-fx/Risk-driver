// Pure stat helpers — all work on a tradeList array
// Each trade: { profit, result, date, rMultiple, ... }

export function netPL(trades) {
  return trades.reduce((s, t) => s + (t.profit || 0), 0);
}

export function winRate(trades) {
  const dec = trades.filter(t => t.result === 'Win' || (t.profit || 0) > 0);
  const los = trades.filter(t => t.result === 'Loss' || (t.profit || 0) < 0);
  const tot = dec.length + los.length;
  return tot > 0 ? dec.length / tot : null;
}

export function avgWin(trades) {
  const w = trades.filter(t => (t.profit || 0) > 0);
  return w.length ? w.reduce((s, t) => s + t.profit, 0) / w.length : null;
}

export function avgLoss(trades) {
  const l = trades.filter(t => (t.profit || 0) < 0);
  return l.length ? Math.abs(l.reduce((s, t) => s + t.profit, 0) / l.length) : null;
}

export function profitFactor(trades) {
  const gw = trades.filter(t => (t.profit || 0) > 0).reduce((s, t) => s + t.profit, 0);
  const gl = Math.abs(trades.filter(t => (t.profit || 0) < 0).reduce((s, t) => s + t.profit, 0));
  return gl > 0 ? gw / gl : null;
}

export function sharpeRatio(trades) {
  const rs = trades.map(t => parseFloat(t.rMultiple) || 0).filter(r => r !== 0);
  if (rs.length < 2) return null;
  const mean = rs.reduce((s, r) => s + r, 0) / rs.length;
  const std = Math.sqrt(rs.reduce((s, r) => s + (r - mean) ** 2, 0) / rs.length);
  return std > 0 ? mean / std : null;
}

export function maxDrawdown(trades, startBal = 0) {
  let peak = startBal, running = startBal, maxDD = 0;
  trades.forEach(t => {
    running += t.profit || 0;
    if (running > peak) peak = running;
    const dd = peak !== 0 ? (running - peak) / Math.abs(peak) : 0;
    if (dd < maxDD) maxDD = dd;
  });
  return maxDD; // negative or 0
}

export function equityCurve(trades, startBal = 0) {
  let running = startBal;
  return [
    { trade: 0, equity: startBal, date: '' },
    ...trades.map((t, i) => {
      running += t.profit || 0;
      return { trade: i + 1, equity: Math.round(running), date: t.date || '' };
    }),
  ];
}

export function underwaterCurve(trades, startBal = 0) {
  let peak = startBal, running = startBal;
  return trades.map((t, i) => {
    running += t.profit || 0;
    if (running > peak) peak = running;
    const dd = peak !== 0 ? ((running - peak) / Math.abs(peak)) * 100 : 0;
    return { trade: i + 1, drawdown: parseFloat(dd.toFixed(3)), date: t.date || '' };
  });
}

export function monthlyReturns(trades, startBal = 0) {
  // returns map { 'YYYY-MM': { pnl, pct } }
  const byMonth = {};
  let running = startBal;
  let prevMonthEnd = startBal;
  let prevKey = null;

  trades.forEach(t => {
    const key = String(t.date || '').slice(0, 7);
    if (!key || key.length !== 7) { running += t.profit || 0; return; }
    if (key !== prevKey) {
      if (prevKey) byMonth[prevKey] = { ...(byMonth[prevKey] || { pnl: 0 }), endBal: running };
      prevMonthEnd = running;
      prevKey = key;
    }
    running += t.profit || 0;
    byMonth[key] = byMonth[key] || { pnl: 0, startBal: prevMonthEnd };
    byMonth[key].pnl = (byMonth[key].pnl || 0) + (t.profit || 0);
  });
  if (prevKey) byMonth[prevKey] = { ...(byMonth[prevKey] || { pnl: 0 }), endBal: running };

  return byMonth;
}

export function dailyReturns(trades) {
  const byDay = {};
  trades.forEach(t => {
    const key = String(t.date || '').slice(0, 10);
    if (!key || key.length < 8) return;
    byDay[key] = (byDay[key] || 0) + (t.profit || 0);
  });
  return Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([date, pnl]) => ({ date, pnl: Math.round(pnl) }));
}

export function rollingDrawdown(trades, startBal = 0) {
  let peak = startBal, running = startBal;
  return trades.map((t, i) => {
    running += t.profit || 0;
    if (running > peak) peak = running;
    const dd = peak !== 0 ? ((running - peak) / Math.abs(peak)) * 100 : 0;
    return { trade: i + 1, drawdown: parseFloat(dd.toFixed(3)), date: t.date || '' };
  });
}

// Monte Carlo: returns { sampledPaths (40 ghost paths), result (p10/median/p90) }
export function monteCarlo(trades, startBal = 0, n = 1000) {
  const profits = trades.map(t => t.profit || 0);
  if (profits.length < 2) return { sampledPaths: [], result: [] };

  const allPaths = [];
  for (let s = 0; s < n; s++) {
    const arr = [...profits].sort(() => Math.random() - 0.5);
    let bal = startBal;
    allPaths.push(arr.map(p => { bal += p; return Math.round(bal); }));
  }

  const len = profits.length;
  const step = Math.max(1, Math.floor(len / 100));
  const result = [];
  for (let i = 0; i < len; i += step) {
    const vals = allPaths.map(path => path[i] ?? path[path.length - 1]).sort((a, b) => a - b);
    result.push({
      trade: i,
      p10:    vals[Math.floor(n * 0.10)],
      median: vals[Math.floor(n * 0.50)],
      p90:    vals[Math.floor(n * 0.90)],
    });
  }

  const sampledPaths = allPaths.filter((_, i) => i % Math.floor(n / 40) === 0).map(path =>
    path.filter((_, i) => i % step === 0).map((v, i) => ({ trade: i * step, v }))
  );

  return { sampledPaths, result, allPaths };
}

// Risk of Ruin — Kelly-based simulation
export function riskOfRuin(wr, avgWinR, avgLossR, riskPct, simCount = 10000, ruinThreshold = 0.5) {
  if (!wr || !avgWinR || !avgLossR || !riskPct) return null;
  let ruined = 0;
  for (let s = 0; s < simCount; s++) {
    let bal = 1;
    for (let t = 0; t < 200; t++) {
      const win = Math.random() < wr;
      bal += win ? bal * riskPct * (avgWinR / avgLossR) : -bal * riskPct;
      if (bal <= ruinThreshold) { ruined++; break; }
    }
  }
  return ruined / simCount;
}

// Losing streak probability
export function pLosingStreak(wr, n) {
  const lossRate = 1 - wr;
  return Math.pow(lossRate, n);
}

// Chance of drawdown > X% within next N trades (MC-based)
export function pDrawdownWithinN(trades, startBal, drawdownPct, nTrades, simCount = 5000) {
  const profits = trades.map(t => t.profit || 0);
  if (profits.length < 10) return null;
  let triggered = 0;
  for (let s = 0; s < simCount; s++) {
    let peak = startBal, bal = startBal;
    for (let i = 0; i < nTrades; i++) {
      const p = profits[Math.floor(Math.random() * profits.length)];
      bal += p;
      if (bal > peak) peak = bal;
      if (peak !== 0 && (peak - bal) / Math.abs(peak) >= drawdownPct / 100) { triggered++; break; }
    }
  }
  return triggered / simCount;
}

// Expected trades to reach target return
export function tradesForTarget(trades, startBal, targetPct, simCount = 5000) {
  const profits = trades.map(t => t.profit || 0);
  if (profits.length < 10 || !startBal) return null;
  const targetBal = startBal * (1 + targetPct / 100);
  const results = [];
  for (let s = 0; s < simCount; s++) {
    let bal = startBal;
    let t = 0;
    while (bal < targetBal && t < 2000) {
      bal += profits[Math.floor(Math.random() * profits.length)];
      t++;
    }
    if (bal >= targetBal) results.push(t);
  }
  if (!results.length) return null;
  results.sort((a, b) => a - b);
  return {
    p25:    results[Math.floor(results.length * 0.25)],
    median: results[Math.floor(results.length * 0.50)],
    p75:    results[Math.floor(results.length * 0.75)],
    pSuccess: results.length / simCount,
  };
}

export function recommendedRiskPct(wr, avgWinR, avgLossR, maxDDPct) {
  // Kelly fraction adjusted for prop firm max DD
  if (!wr || !avgWinR || !avgLossR) return null;
  const b = avgWinR / avgLossR;
  const kelly = (wr * (b + 1) - 1) / b;
  // Cap at half-kelly and at a level where losing streak won't breach maxDD
  const halfKelly = Math.max(0, kelly / 2);
  // Safe streak of 6 losses should not exceed maxDDPct
  const streakSafe = maxDDPct / 100 / 6;
  return Math.min(halfKelly, streakSafe, 0.03); // never more than 3%
}
