// ─── Trade normalization ───────────────────────────────────────────────────────

export function normalizeTrades(trades, baseSize = 100_000) {
  const results = [];
  for (const tr of trades) {
    const net = Number(tr.netProfit ?? tr.profit ?? tr.pnl ?? 0);
    const comm = Number(tr.commission ?? 0);
    const swap = Number(tr.swap ?? 0);
    const balAfter = Number(tr.balanceAfter ?? tr.balance ?? 0);
    if (balAfter === 0) {
      // fallback: just use net as % of base
      results.push((net / baseSize) * baseSize);
      continue;
    }
    const balBefore = balAfter - (net + comm + swap);
    if (balBefore <= 0) continue;
    const riskPct = net / balBefore;
    results.push(riskPct * baseSize);
  }
  return results;
}

// ─── Check A: Trades per month ────────────────────────────────────────────────

export function tradesPerMonth(trades) {
  if (trades.length < 2) return 0;
  const dates = trades
    .map(t => new Date(t.openDate || t.closeDate || t.date))
    .filter(d => !isNaN(d))
    .sort((a, b) => a - b);
  if (dates.length < 2) return 0;
  const months = (dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24 * 30.44);
  return months < 0.1 ? trades.length : trades.length / months;
}

// ─── Check B: KS test (two-sample) ───────────────────────────────────────────

function ecdf(sorted, x) {
  let lo = 0, hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] <= x) lo = mid + 1; else hi = mid;
  }
  return lo / sorted.length;
}

function kolmogorovProb(lambda) {
  if (lambda < 0.2) return 1;
  if (lambda > 4) return 0;
  let sum = 0;
  for (let k = 1; k <= 100; k++) {
    sum += Math.pow(-1, k - 1) * Math.exp(-2 * k * k * lambda * lambda);
  }
  return Math.max(0, Math.min(1, 2 * sum));
}

export function ksTwoSample(a, b) {
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  const allVals = [...sa, ...sb].sort((x, y) => x - y);
  let dMax = 0;
  for (const v of allVals) {
    const d = Math.abs(ecdf(sa, v) - ecdf(sb, v));
    if (d > dMax) dMax = d;
  }
  const n = (sa.length * sb.length) / (sa.length + sb.length);
  const lambda = (Math.sqrt(n) + 0.12 + 0.11 / Math.sqrt(n)) * dMax;
  const pValue = kolmogorovProb(lambda);
  return { statistic: dMax, pValue };
}

// ─── Check C: Lag-1 autocorrelation ──────────────────────────────────────────

export function lag1Autocorr(values) {
  if (values.length < 3) return 0;
  const n = values.length - 1;
  const x = values.slice(0, n);
  const y = values.slice(1);
  const mx = x.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const ex = x[i] - mx, ey = y[i] - my;
    num += ex * ey; dx2 += ex * ex; dy2 += ey * ey;
  }
  const denom = Math.sqrt(dx2 * dy2);
  return denom === 0 ? 0 : num / denom;
}

// ─── Method verdict ───────────────────────────────────────────────────────────

export function determineMethod(tpm, autocorr, ksPValue) {
  if (tpm >= 30) {
    if (autocorr > 0.4) return {
      id: 1, name: 'Particle Filter',
      desc: 'Path-dependent simulation that updates beliefs trade-by-trade using a sequential filter.',
      update: 'Update every trade',
    };
    return {
      id: 2, name: 'Hidden Markov Model',
      desc: 'Regime-switching model that detects latent market states (trending / mean-reverting) in your trade sequence.',
      update: 'Update weekly',
    };
  }
  if (ksPValue > 0.05) return {
    id: 3, name: 'Conditional Monte Carlo',
    desc: 'Standard Monte Carlo conditioned on the stationary historical distribution of your normalized returns.',
    update: 'Update monthly',
  };
  return {
    id: 4, name: 'Walk-Forward Only',
    desc: 'Non-stationary data — simulations use rolling windows; historical averages are not reliable priors.',
    update: 'Rebuild each period',
  };
}

// ─── Simulation engine ────────────────────────────────────────────────────────

function sampleWithReplacement(pool, rng) {
  return pool[Math.floor(rng() * pool.length)];
}

// Simple seeded PRNG (mulberry32)
function makePRNG(seed) {
  let s = seed >>> 0;
  return () => {
    s += 0x6D2B79F5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function simulateAccount(pool, ddLimitPct, startEquityPct, rng) {
  // startEquityPct: 1.0 = full, 0.95 = already 5% down
  const ddLimit = ddLimitPct / 100;
  let equity = startEquityPct;
  let peak = equity;
  for (let i = 0; i < 1000; i++) {
    const trade = sampleWithReplacement(pool, rng);
    equity += trade / 100_000; // trade is in $, base is 1.0 = 100%
    if (equity > peak) peak = equity;
    if ((peak - equity) / peak >= ddLimit) return true; // breached
  }
  return false;
}

export function runSimulation({
  normalizedTrades,
  ddLimitPct = 10,
  repurchaseMonths = 2,
  horizonMonths = 24,
  simCount = 5000,
  startEquityPct = 1.0,
}) {
  if (!normalizedTrades.length) return null;
  const accountsPerSim = Math.floor(horizonMonths / repurchaseMonths);
  const rng = makePRNG(42);
  const breachCounts = [];

  for (let s = 0; s < simCount; s++) {
    let breaches = 0;
    for (let a = 0; a < accountsPerSim; a++) {
      const start = a === 0 ? startEquityPct : 1.0;
      if (simulateAccount(normalizedTrades, ddLimitPct, start, rng)) breaches++;
    }
    breachCounts.push(breaches);
  }

  breachCounts.sort((a, b) => a - b);
  const mean = breachCounts.reduce((s, v) => s + v, 0) / simCount;
  const median = breachCounts[Math.floor(simCount / 2)];
  const p95 = breachCounts[Math.floor(simCount * 0.95)];
  const zeroBreachCount = breachCounts.filter(c => c === 0).length;
  const pZero = (zeroBreachCount / simCount) * 100;

  // Build distribution histogram (0,1,2,3,4+)
  const dist = [0, 0, 0, 0, 0];
  for (const c of breachCounts) {
    dist[Math.min(c, 4)]++;
  }
  const histogram = dist.map((count, i) => ({
    label: i === 4 ? '4+' : String(i),
    pct: (count / simCount) * 100,
  }));

  return { mean, median, p95, pZero, histogram, accountsPerSim };
}
