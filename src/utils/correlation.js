// Builds a strategy-by-strategy correlation matrix directly from each
// strategy's own trade history, so it updates automatically as strategies
// are added/removed instead of showing a fixed set of instruments.

export function pearsonCorrelation(a, b) {
  const n = a.length;
  if (n < 2) return null;
  const meanA = a.reduce((s, v) => s + v, 0) / n;
  const meanB = b.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let denA = 0;
  let denB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  const den = Math.sqrt(denA * denB);
  return den === 0 ? 0 : num / den;
}

function monthlyReturnMap(trades) {
  const map = {};
  for (const t of trades) {
    if (!t.date) continue;
    const month = t.date.slice(0, 7);
    map[month] = (map[month] || 0) + (Number(t.result) || 0);
  }
  return map;
}

// Correlates monthly P&L rather than raw trades, so strategies that trade at
// different frequencies/times can still be compared on a common footing.
// Pairs with fewer than 2 overlapping months return `null` (not enough
// shared history) instead of a fabricated number.
export function buildStrategyCorrelation(strategies) {
  const names = strategies.map((s) => s.name);
  const monthly = strategies.map((s) => monthlyReturnMap(s.trades || []));

  const values = strategies.map((_, i) =>
    strategies.map((_, j) => {
      if (i === j) return 1;
      const monthsA = monthly[i];
      const monthsB = monthly[j];
      const shared = Object.keys(monthsA).filter((m) => m in monthsB);
      if (shared.length < 2) return null;
      const a = shared.map((m) => monthsA[m]);
      const b = shared.map((m) => monthsB[m]);
      return pearsonCorrelation(a, b);
    })
  );

  return { names, values };
}
