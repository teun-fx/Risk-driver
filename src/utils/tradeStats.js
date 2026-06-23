// Pure stat helpers — all operate on a tradeList array.
// Each trade: { profit, result, date, closeDate, rMultiple, instrument, lots, ... }

// ─── Basic metrics ────────────────────────────────────────────────────────────

export function netPL(trades) {
  return trades.reduce((s, t) => s + (t.profit || 0), 0);
}

export function winRate(trades) {
  const wins   = trades.filter(t => (t.profit || 0) > 0).length;
  const losses = trades.filter(t => (t.profit || 0) < 0).length;
  const total  = wins + losses;
  return total > 0 ? wins / total : null;
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
  const std  = Math.sqrt(rs.reduce((s, r) => s + (r - mean) ** 2, 0) / rs.length);
  return std > 0 ? mean / std : null;
}

// ─── Drawdown ─────────────────────────────────────────────────────────────────

export function maxDrawdown(trades, startBal = 0) {
  let peak = startBal, running = startBal, maxDD = 0;
  trades.forEach(t => {
    running += t.profit || 0;
    if (running > peak) peak = running;
    const dd = peak !== 0 ? (running - peak) / Math.abs(peak) : 0;
    if (dd < maxDD) maxDD = dd;
  });
  return maxDD;
}

export function avgDrawdownPct(trades, startBal = 0) {
  const curve = underwaterCurve(trades, startBal);
  const dds = curve.map(p => p.drawdown).filter(d => d < 0);
  if (!dds.length) return 0;
  return dds.reduce((s, d) => s + d, 0) / dds.length;
}

export function avgDrawdownLength(trades, startBal = 0) {
  const curve = underwaterCurve(trades, startBal);
  let inDD = false, len = 0;
  const lengths = [];
  curve.forEach(p => {
    if (p.drawdown < 0) { inDD = true; len++; }
    else if (inDD) { lengths.push(len); inDD = false; len = 0; }
  });
  if (inDD && len) lengths.push(len);
  return lengths.length ? Math.round(lengths.reduce((s, l) => s + l, 0) / lengths.length) : 0;
}

// ─── Curves ───────────────────────────────────────────────────────────────────

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

export function rollingDrawdown(trades, startBal = 0) {
  return underwaterCurve(trades, startBal);
}

// ─── Return series ────────────────────────────────────────────────────────────

export function dailyReturns(trades) {
  const byDay = {};
  trades.forEach(t => {
    const key = String(t.date || '').slice(0, 10);
    if (!key || key.length < 8) return;
    byDay[key] = (byDay[key] || 0) + (t.profit || 0);
  });
  return Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, pnl]) => ({ date, pnl: Math.round(pnl) }));
}

export function monthlyReturns(trades, startBal = 0) {
  const byMonth = {};
  let running = startBal, prevKey = null;
  trades.forEach(t => {
    const key = String(t.date || '').slice(0, 7);
    if (!key || key.length !== 7) { running += t.profit || 0; return; }
    if (key !== prevKey) {
      if (prevKey) byMonth[prevKey].endBal = running;
      byMonth[key] = byMonth[key] || { pnl: 0, startBal: running };
      prevKey = key;
    }
    running += t.profit || 0;
    byMonth[key].pnl = (byMonth[key].pnl || 0) + (t.profit || 0);
  });
  if (prevKey) byMonth[prevKey].endBal = running;
  return byMonth;
}

// Per-month stats for the calendar view
export function monthlyStats(trades, startBal = 0) {
  const byMonth = {};
  trades.forEach(t => {
    const key = String(t.date || '').slice(0, 7);
    if (!key || key.length !== 7) return;
    if (!byMonth[key]) byMonth[key] = { pnl: 0, count: 0, wins: 0 };
    byMonth[key].pnl   += t.profit || 0;
    byMonth[key].count += 1;
    if ((t.profit || 0) > 0) byMonth[key].wins += 1;
  });
  let bal = startBal;
  Object.keys(byMonth).sort().forEach(key => {
    const m   = byMonth[key];
    m.pct     = bal > 0 ? (m.pnl / bal) * 100 : 0;
    m.winRate = m.count > 0 ? Math.round((m.wins / m.count) * 100) : 0;
    bal += m.pnl;
  });
  return byMonth;
}

// ─── Advanced return metrics ──────────────────────────────────────────────────

export function annualizedReturn(trades, startBal = 0) {
  if (!trades.length || !startBal) return null;
  const profit = netPL(trades);
  const endBal = startBal + profit;
  const dates  = trades.map(t => t.date).filter(d => d && d !== '—' && d.length >= 10).sort();
  if (dates.length < 2) return profit / startBal;
  const years = (new Date(dates[dates.length - 1]) - new Date(dates[0])) / (365.25 * 86400000);
  if (years < 0.01) return profit / startBal;
  return Math.pow(Math.max(endBal / startBal, 0.0001), 1 / years) - 1;
}

export function ytdReturn(trades) {
  const year = new Date().getFullYear();
  return trades
    .filter(t => String(t.date || '').startsWith(String(year)))
    .reduce((s, t) => s + (t.profit || 0), 0);
}

export function avgMonthlyReturnAmt(trades, startBal = 0) {
  const monthly = monthlyReturns(trades, startBal);
  const vals    = Object.values(monthly).map(m => m.pnl);
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
}

export function sortinoRatio(trades) {
  const profits = trades.map(t => t.profit || 0).filter(p => p !== 0);
  if (profits.length < 2) return null;
  const mean    = profits.reduce((s, p) => s + p, 0) / profits.length;
  const neg     = profits.filter(p => p < 0);
  if (!neg.length) return null;
  const downStd = Math.sqrt(neg.reduce((s, p) => s + p * p, 0) / neg.length);
  return downStd > 0 ? mean / downStd : null;
}

export function calmarRatio(trades, startBal = 0) {
  const ann   = annualizedReturn(trades, startBal);
  const maxDD = maxDrawdown(trades, startBal);
  if (ann == null || !maxDD || maxDD === 0) return null;
  return ann / Math.abs(maxDD);
}

export function annVolatility(trades) {
  const daily = dailyReturns(trades);
  if (daily.length < 5) return null;
  const returns  = daily.map(d => d.pnl);
  const mean     = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(252);
}

export function skewnessOf(trades) {
  const p = trades.map(t => t.profit || 0).filter(v => v !== 0);
  if (p.length < 3) return null;
  const mean = p.reduce((s, v) => s + v, 0) / p.length;
  const std  = Math.sqrt(p.reduce((s, v) => s + (v - mean) ** 2, 0) / p.length);
  if (!std) return null;
  return p.reduce((s, v) => s + Math.pow((v - mean) / std, 3), 0) / p.length;
}

export function kurtosisOf(trades) {
  const p = trades.map(t => t.profit || 0).filter(v => v !== 0);
  if (p.length < 4) return null;
  const mean = p.reduce((s, v) => s + v, 0) / p.length;
  const std  = Math.sqrt(p.reduce((s, v) => s + (v - mean) ** 2, 0) / p.length);
  if (!std) return null;
  return (p.reduce((s, v) => s + Math.pow((v - mean) / std, 4), 0) / p.length) - 3;
}

export function expectancyDollar(trades) {
  const wins   = trades.filter(t => (t.profit || 0) > 0);
  const losses = trades.filter(t => (t.profit || 0) < 0);
  const total  = wins.length + losses.length;
  if (!total) return null;
  const wr   = wins.length / total;
  const avgW = wins.length   ? wins.reduce((s, t) => s + t.profit, 0) / wins.length                        : 0;
  const avgL = losses.length ? Math.abs(losses.reduce((s, t) => s + t.profit, 0) / losses.length) : 0;
  return wr * avgW - (1 - wr) * avgL;
}

export function assetAllocation(trades) {
  const counts = {};
  trades.forEach(t => {
    const inst = t.instrument || 'Unknown';
    counts[inst] = (counts[inst] || 0) + 1;
  });
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 12)
    .map(([instrument, count]) => ({ instrument, count }));
}

export function tradingDaysCount(trades) {
  return new Set(
    trades.map(t => String(t.date || '').slice(0, 10)).filter(d => d.length === 10)
  ).size;
}

export function totalLots(trades) {
  const total = trades.reduce((s, t) => s + (parseFloat(t.lots) || 0), 0);
  return total > 0 ? parseFloat(total.toFixed(2)) : null;
}

// ─── Rolling chart data ───────────────────────────────────────────────────────

export function rollingReturnsData(trades, windowDays = 30) {
  const daily = dailyReturns(trades);
  if (daily.length <= windowDays) return [];
  return daily.slice(windowDays).map((d, i) => {
    const slice = daily.slice(i, i + windowDays);
    return { date: d.date, value: parseFloat(slice.reduce((s, x) => s + x.pnl, 0).toFixed(2)) };
  });
}

export function rollingSharpeData(trades, windowDays = 30) {
  const daily = dailyReturns(trades);
  if (daily.length <= windowDays) return [];
  return daily.slice(windowDays).map((d, i) => {
    const slice = daily.slice(i, i + windowDays).map(x => x.pnl);
    const mean  = slice.reduce((s, v) => s + v, 0) / slice.length;
    const std   = Math.sqrt(slice.reduce((s, v) => s + (v - mean) ** 2, 0) / slice.length);
    const val   = std > 0 ? (mean / std) * Math.sqrt(252) : 0;
    return { date: d.date, value: parseFloat(val.toFixed(2)) };
  });
}

export function rollingSortinoData(trades, windowDays = 30) {
  const daily = dailyReturns(trades);
  if (daily.length <= windowDays) return [];
  return daily.slice(windowDays).map((d, i) => {
    const slice   = daily.slice(i, i + windowDays).map(x => x.pnl);
    const mean    = slice.reduce((s, v) => s + v, 0) / slice.length;
    const neg     = slice.filter(v => v < 0);
    if (!neg.length) return { date: d.date, value: 0 };
    const downStd = Math.sqrt(neg.reduce((s, v) => s + v * v, 0) / neg.length);
    const val     = downStd > 0 ? (mean / downStd) * Math.sqrt(252) : 0;
    return { date: d.date, value: parseFloat(val.toFixed(2)) };
  });
}

// ─── Monte Carlo ──────────────────────────────────────────────────────────────

export function monteCarlo(trades, startBal = 0, n = 1000) {
  const profits = trades.map(t => t.profit || 0);
  if (profits.length < 2) return { sampledPaths: [], result: [] };
  const allPaths = [];
  for (let s = 0; s < n; s++) {
    const arr = [...profits].sort(() => Math.random() - 0.5);
    let bal = startBal;
    allPaths.push(arr.map(p => { bal += p; return Math.round(bal); }));
  }
  const len  = profits.length;
  const step = Math.max(1, Math.floor(len / 100));
  const result = [];
  for (let i = 0; i < len; i += step) {
    const vals = allPaths.map(path => path[i] ?? path[path.length - 1]).sort((a, b) => a - b);
    result.push({ trade: i, p10: vals[Math.floor(n * 0.10)], median: vals[Math.floor(n * 0.50)], p90: vals[Math.floor(n * 0.90)] });
  }
  const sampledPaths = allPaths
    .filter((_, i) => i % Math.floor(n / 40) === 0)
    .map(path => path.filter((_, i) => i % step === 0).map((v, i) => ({ trade: i * step, v })));
  return { sampledPaths, result, allPaths };
}

// ─── Risk helpers ─────────────────────────────────────────────────────────────

export function riskOfRuin(wr, avgWinR, avgLossR, riskPct, simCount = 10000, ruinThreshold = 0.5) {
  if (!wr || !avgWinR || !avgLossR || !riskPct) return null;
  let ruined = 0;
  for (let s = 0; s < simCount; s++) {
    let bal = 1;
    for (let t = 0; t < 200; t++) {
      bal += Math.random() < wr ? bal * riskPct * (avgWinR / avgLossR) : -bal * riskPct;
      if (bal <= ruinThreshold) { ruined++; break; }
    }
  }
  return ruined / simCount;
}

export function pLosingStreak(wr, n) {
  return Math.pow(1 - wr, n);
}

export function pDrawdownWithinN(trades, startBal, drawdownPct, nTrades, simCount = 5000) {
  const profits = trades.map(t => t.profit || 0);
  if (profits.length < 10) return null;
  let triggered = 0;
  for (let s = 0; s < simCount; s++) {
    let peak = startBal, bal = startBal;
    for (let i = 0; i < nTrades; i++) {
      bal += profits[Math.floor(Math.random() * profits.length)];
      if (bal > peak) peak = bal;
      if (peak !== 0 && (peak - bal) / Math.abs(peak) >= drawdownPct / 100) { triggered++; break; }
    }
  }
  return triggered / simCount;
}

export function tradesForTarget(trades, startBal, targetPct, simCount = 5000) {
  const profits = trades.map(t => t.profit || 0);
  if (profits.length < 10 || !startBal) return null;
  const targetBal = startBal * (1 + targetPct / 100);
  const results   = [];
  for (let s = 0; s < simCount; s++) {
    let bal = startBal, t = 0;
    while (bal < targetBal && t < 2000) { bal += profits[Math.floor(Math.random() * profits.length)]; t++; }
    if (bal >= targetBal) results.push(t);
  }
  if (!results.length) return null;
  results.sort((a, b) => a - b);
  return { p25: results[Math.floor(results.length * 0.25)], median: results[Math.floor(results.length * 0.50)], p75: results[Math.floor(results.length * 0.75)], pSuccess: results.length / simCount };
}

export function recommendedRiskPct(wr, avgWinR, avgLossR, maxDDPct) {
  if (!wr || !avgWinR || !avgLossR) return null;
  const b          = avgWinR / avgLossR;
  const kelly      = (wr * (b + 1) - 1) / b;
  const halfKelly  = Math.max(0, kelly / 2);
  const streakSafe = maxDDPct / 100 / 6;
  return Math.min(halfKelly, streakSafe, 0.03);
}
