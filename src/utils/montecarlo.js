// Pure JS Monte Carlo / statistics helpers used by the Strategies tab's Monte Carlo analysis.

export function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function stdDev(arr) {
  const m = mean(arr);
  const variance = arr.reduce((a, b) => a + (b - m) ** 2, 0) / (arr.length - 1 || 1);
  return Math.sqrt(variance);
}

// One-sample KS test against a normal distribution with sample mean/std.
export function ksTestNormal(returns) {
  const n = returns.length;
  const m = mean(returns);
  const s = stdDev(returns) || 1;
  const sorted = [...returns].sort((a, b) => a - b);

  const cdfNormal = (x) => {
    // Abramowitz-Stegun approximation of the standard normal CDF
    const z = (x - m) / s;
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp((-z * z) / 2);
    let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    if (z > 0) p = 1 - p;
    return p;
  };

  let dMax = 0;
  for (let i = 0; i < n; i++) {
    const empirical = (i + 1) / n;
    const theoretical = cdfNormal(sorted[i]);
    dMax = Math.max(dMax, Math.abs(empirical - theoretical));
  }

  // Approximate p-value via Kolmogorov distribution asymptotic formula.
  const lambda = (Math.sqrt(n) + 0.12 + 0.11 / Math.sqrt(n)) * dMax;
  let pValue = 0;
  for (let k = 1; k <= 100; k++) {
    pValue += 2 * (-1) ** (k - 1) * Math.exp(-2 * k * k * lambda * lambda);
  }
  pValue = Math.min(Math.max(pValue, 0), 1);

  return { d: dMax, pValue };
}

export function lag1Autocorrelation(returns) {
  const n = returns.length;
  const m = mean(returns);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n - 1; i++) {
    num += (returns[i] - m) * (returns[i + 1] - m);
  }
  for (let i = 0; i < n; i++) {
    den += (returns[i] - m) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

// Plain-language verdicts. `method` (1-4) still drives the simulation math in
// runMonteCarlo; the name/desc/updateCycle strings are what a non-technical
// trader actually reads, so keep them free of stats jargon (no "stationary",
// "autocorrelation", "bootstrap", "regime", etc).
export function classifyMethod({ tradesPerMonth, ksPValue, autocorr }) {
  const enoughVolume = tradesPerMonth >= 30;
  const stationary = ksPValue > 0.05;
  const lowAutocorr = Math.abs(autocorr) <= 0.4;

  if (enoughVolume && stationary && lowAutocorr) {
    return {
      method: 1,
      name: 'Full Simulation',
      color: 'green',
      desc: 'You have enough trades and they behave consistently over time, so the simulation can draw randomly from your full trade history.',
      updateCycle: 'Refresh every few months, or after ~50 new trades.',
    };
  }
  if (enoughVolume && stationary && !lowAutocorr) {
    return {
      method: 2,
      name: 'Streak-Aware Simulation',
      color: 'green',
      desc: 'You have enough trades, but wins and losses tend to cluster together (streaks). The simulation keeps trades grouped in short runs so those streaks are preserved.',
      updateCycle: 'Refresh every few months, or after ~50 new trades.',
    };
  }
  if (enoughVolume && !stationary) {
    return {
      method: 3,
      name: 'Segmented Simulation',
      color: 'gray',
      desc: 'Your results have shifted noticeably over time (e.g. performance in one period looks different from another). The simulation splits your history into segments and treats each one separately.',
      updateCycle: 'Rebuild every period — your edge appears to be changing.',
    };
  }
  return {
    method: 4,
    name: 'Limited-Data Check',
    color: 'red',
    desc: "You don't have enough trades per month yet for a statistically reliable Monte Carlo simulation. What follows below is directional, not a guarantee — treat it as an early read, not a forecast.",
    updateCycle: 'Rebuild each period as more trades come in.',
  };
}

// Parses a per-trade R-multiple string like "1.83R" or "-0.73R" into a number.
export function parseRMultiple(rrString) {
  const n = parseFloat(String(rrString).replace(/R$/i, ''));
  return isNaN(n) ? 0 : n;
}

// Win-rate (%) a strategy needs just to break even, given its average R:R.
export function breakevenWinRate(rr) {
  const r = Number(rr) || 0;
  if (r <= 0) return 100;
  return 100 / (1 + r);
}

function metricsForTrades(tradeSlice) {
  const n = tradeSlice.length;
  if (n === 0) return { winRate: 0, profitFactor: 0, volatility: 0 };

  const wins = tradeSlice.filter((t) => t.result >= 0);
  const losses = tradeSlice.filter((t) => t.result < 0);
  const winRate = (wins.length / n) * 100;

  const grossWin = wins.reduce((a, t) => a + t.result, 0);
  const grossLoss = Math.abs(losses.reduce((a, t) => a + t.result, 0));
  const profitFactor = grossLoss === 0 ? grossWin : grossWin / grossLoss;

  const rMultiples = tradeSlice.map((t) => parseRMultiple(t.rr));
  const volatility = stdDev(rMultiples);

  return { winRate, profitFactor, volatility };
}

// Compares the most recent `windowSize` trades against a "typical" range
// built from every prior rolling window of the same size. Returns, per
// metric, the current value, the [min, max] typical range, and a verdict
// that describes *direction* rather than pass/fail — a metric can land
// outside the historical range by being better than usual, not just worse.
export function consistencyCheck(trades, windowSize = 50) {
  if (trades.length <= windowSize) return null;

  const current = trades.slice(-windowSize);
  const history = trades.slice(0, -windowSize);

  const windowStats = [];
  for (let i = 0; i <= history.length - windowSize; i++) {
    windowStats.push(metricsForTrades(history.slice(i, i + windowSize)));
  }
  if (windowStats.length === 0) return null;

  const currentStats = metricsForTrades(current);

  const buildMetric = (key) => {
    const values = windowStats.map((w) => w[key]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const value = currentStats[key];
    let verdict = 'expected';
    if (value < min) verdict = 'under';
    else if (value > max) verdict = 'over';
    return { value, min, max, verdict };
  };

  return {
    windowSize,
    winRate: buildMetric('winRate'),
    profitFactor: buildMetric('profitFactor'),
    volatility: buildMetric('volatility'),
  };
}

export const verdictLabels = {
  under: 'Underperforming',
  expected: 'As expected',
  over: 'Overperforming',
};

function sampleBlock(returns, blockSize, rng) {
  const start = Math.floor(rng() * (returns.length - blockSize + 1));
  return returns.slice(start, start + blockSize);
}

export function runMonteCarlo({ returns, horizonTrades, simCount, maxDrawdownPct, method, rng = Math.random, sampleSize = 200 }) {
  let breaches = 0;
  let zeroFails = 0;
  const finalDrawdowns = [];
  const samplePaths = [];

  const useBlocks = method === 2 || method === 3;
  const blockSize = Math.max(3, Math.round(returns.length / 20));
  const keepSample = Math.min(sampleSize, simCount);

  for (let s = 0; s < simCount; s++) {
    let equity = 1;
    let peak = 1;
    let maxDD = 0;
    let fails = 0;
    let tradesDone = 0;
    const trackPath = s < keepSample;
    const path = trackPath ? [1] : null;

    while (tradesDone < horizonTrades) {
      let chunk;
      if (useBlocks) {
        chunk = sampleBlock(returns, blockSize, rng);
      } else {
        chunk = [returns[Math.floor(rng() * returns.length)]];
      }
      for (const r of chunk) {
        if (tradesDone >= horizonTrades) break;
        equity *= 1 + r / 100;
        peak = Math.max(peak, equity);
        const dd = (peak - equity) / peak * 100;
        maxDD = Math.max(maxDD, dd);
        if (dd >= maxDrawdownPct) fails++;
        tradesDone++;
        if (trackPath) path.push(equity);
      }
    }

    finalDrawdowns.push(maxDD);
    if (maxDD >= maxDrawdownPct) breaches++;
    if (fails === 0) zeroFails++;
    if (trackPath) samplePaths.push(path);
  }

  finalDrawdowns.sort((a, b) => a - b);
  const p95 = finalDrawdowns[Math.floor(finalDrawdowns.length * 0.95)];
  const medianDD = finalDrawdowns[Math.floor(finalDrawdowns.length * 0.5)];

  return {
    breachProbability: (breaches / simCount) * 100,
    zeroFailsProbability: (zeroFails / simCount) * 100,
    meanDrawdown: mean(finalDrawdowns),
    medianDrawdown: medianDD,
    p95Drawdown: p95,
    samplePaths,
  };
}

function percentile(sortedArr, p) {
  const idx = Math.min(sortedArr.length - 1, Math.max(0, Math.floor(p * sortedArr.length)));
  return sortedArr[idx];
}

// Turns the raw sample equity paths from runMonteCarlo into ready-to-chart
// series: a best/average/worst equity curve, their drawdown curves, and a
// p10-p90 forecast band for the next `forecastSteps` trades.
export function buildMonteCarloCharts(samplePaths, forecastSteps = 50) {
  if (!samplePaths || samplePaths.length === 0) return null;

  const ranked = samplePaths.map((path, i) => ({ i, final: path[path.length - 1] })).sort((a, b) => a.final - b.final);
  const worstPath = samplePaths[ranked[0].i];
  const bestPath = samplePaths[ranked[ranked.length - 1].i];
  const averagePath = samplePaths[ranked[Math.floor(ranked.length / 2)].i];

  const toPct = (v) => (v - 1) * 100;

  const equityCurve = bestPath.map((_, step) => ({
    trade: step,
    best: Number(toPct(bestPath[step]).toFixed(2)),
    average: Number(toPct(averagePath[step]).toFixed(2)),
    worst: Number(toPct(worstPath[step]).toFixed(2)),
  }));

  // Negative values so the drawdown chart naturally dips below a zero
  // baseline instead of reading as "higher is worse".
  const drawdownSeries = (path) => {
    let peak = 1;
    return path.map((eq) => {
      peak = Math.max(peak, eq);
      return Number((-((peak - eq) / peak) * 100).toFixed(2));
    });
  };
  const bestDD = drawdownSeries(bestPath);
  const avgDD = drawdownSeries(averagePath);
  const worstDD = drawdownSeries(worstPath);
  const drawdownCurve = bestPath.map((_, step) => ({
    trade: step,
    best: bestDD[step],
    average: avgDD[step],
    worst: worstDD[step],
  }));

  const steps = Math.min(forecastSteps, samplePaths[0].length - 1);
  const forecastBand = [];
  for (let step = 0; step <= steps; step++) {
    const values = samplePaths.map((p) => p[step]).sort((a, b) => a - b);
    const p10 = toPct(percentile(values, 0.1));
    const p50 = toPct(percentile(values, 0.5));
    const p90 = toPct(percentile(values, 0.9));
    forecastBand.push({
      trade: step,
      p10: Number(p10.toFixed(2)),
      p50: Number(p50.toFixed(2)),
      band: Number((p90 - p10).toFixed(2)),
    });
  }

  return { equityCurve, drawdownCurve, forecastBand };
}
