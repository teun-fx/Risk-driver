// Derives a 0-100 readiness score and radar-chart components directly from
// a strategy's own metrics, so each strategy gets its own score.
const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));

export function computeStrategyRadar(strategy) {
  const components = [
    { name: 'Win Rate', score: clamp(strategy.winrate) },
    { name: 'Profit Factor', score: clamp(((strategy.profitFactor || 0) / 3) * 100) },
    { name: 'Sharpe', score: clamp(((strategy.sharpe || 0) / 2) * 100) },
    { name: 'Sortino', score: clamp(((strategy.sortino || 0) / 3) * 100) },
    { name: 'Sample Size', score: clamp(((strategy.totalTrades || 0) / 300) * 100) },
    { name: 'Consistency', score: clamp(100 - (strategy.maxLosingStreak || 0) * 10) },
  ];

  const overall = clamp(components.reduce((a, c) => a + c.score, 0) / components.length);
  return { overall, components };
}
