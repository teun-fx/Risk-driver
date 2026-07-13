// Central mock data store for Risk Driver. No backend, no localStorage.

export const accounts = [
  {
    id: 'acc-demo',
    name: 'Demo Account',
    type: 'Demo Account',
    firm: 'Demo Account',
    size: 100000,
    currency: 'USD',
    startDate: '2024-01-08',
    notes: 'Auto-generated demo account with realistic random trades.',
    profitSplit: 100,
    activationCost: 0,
    monthlyFee: 0,
    tradesLoaded: 571,
    status: 'Active',
    dailyDrawdown: 5,
    drawdownType: 'Balance',
    maxTotalDrawdown: 10,
    profitTarget: 10,
    minTradingDays: 5,
    maxTradingDays: null,
    leverage: '1:100',
  },
  {
    id: 'acc-ftmo',
    name: 'FTMO',
    type: 'Prop Firm Challenge',
    firm: 'FTMO',
    size: 100000,
    currency: 'USD',
    startDate: '2025-11-02',
    notes: '',
    profitSplit: 80,
    activationCost: 540,
    monthlyFee: 0,
    tradesLoaded: 96,
    status: 'Active',
    dailyDrawdown: 5,
    drawdownType: 'Balance',
    maxTotalDrawdown: 10,
    profitTarget: 10,
    minTradingDays: 5,
    maxTradingDays: null,
    leverage: '1:100',
  },
  {
    id: 'acc-topstep',
    name: 'Topstep',
    type: 'Futures Funded',
    firm: 'Topstep',
    size: 50000,
    currency: 'USD',
    startDate: '2025-08-15',
    notes: '',
    profitSplit: 90,
    activationCost: 165,
    monthlyFee: 49,
    tradesLoaded: 212,
    status: 'Active',
    dailyDrawdown: 3,
    drawdownType: 'Trailing',
    maxTotalDrawdown: 6,
    profitTarget: 6,
    minTradingDays: 2,
    maxTradingDays: null,
    leverage: '1:50',
  },
  {
    id: 'acc-icmarkets',
    name: 'IC Markets',
    type: 'Private Broker Account',
    firm: 'IC Markets',
    size: 25000,
    currency: 'USD',
    startDate: '2024-06-01',
    notes: 'Personal live account.',
    profitSplit: 100,
    activationCost: 0,
    monthlyFee: 0,
    tradesLoaded: 138,
    status: 'Active',
    dailyDrawdown: null,
    drawdownType: 'Balance',
    maxTotalDrawdown: null,
    profitTarget: null,
    minTradingDays: null,
    maxTradingDays: null,
    leverage: '1:500',
  },
];

const instruments = ['NQ', 'ES', 'CL', 'EURUSD', 'GC', 'GBPUSD'];
const setups = ['Breakout', 'Pullback', 'Reversal', 'Trend Continuation', 'Range Fade', 'News Spike'];

function seedRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const rand = seedRandom(42);

// 200 trades spaced 3 days apart gives ~10 trades/month of history, ending
// just before "today" — enough volume for the rolling consistency check
// (which compares the most recent 50 trades against everything before them).
const TOTAL_TRADES = 200;
const STEP_DAYS = 3;
const tradesStart = new Date(2026, 6, 4).getTime() - (TOTAL_TRADES - 1) * STEP_DAYS * 86400000;

export const trades = Array.from({ length: TOTAL_TRADES }, (_, i) => {
  const win = rand() < 0.666;
  const instrument = instruments[Math.floor(rand() * instruments.length)];
  const setup = setups[Math.floor(rand() * setups.length)];
  const rr = win ? (1 + rand() * 2).toFixed(2) : (-(0.5 + rand() * 1)).toFixed(2);
  const result = win ? Math.round(150 + rand() * 1800) : -Math.round(100 + rand() * 900);
  const pips = win ? Math.round(10 + rand() * 80) : -Math.round(10 + rand() * 60);
  const date = new Date(tradesStart + i * STEP_DAYS * 86400000);
  return {
    id: `trade-${i + 1}`,
    date: date.toISOString().slice(0, 10),
    instrument,
    setup,
    result,
    rr: `${rr}R`,
    pips,
    notes: win ? 'Followed plan, clean exit.' : 'Stopped out, no edge violation.',
  };
});

function buildEquityCurve() {
  const points = [];
  const start = new Date('2024-02-01');
  const end = new Date('2026-06-25');
  let equity = 100000;
  const target = 590430;
  const totalDays = Math.round((end - start) / 86400000);
  const r = seedRandom(7);
  let day = 0;
  let cur = new Date(start);
  while (cur <= end) {
    const progress = day / totalDays;
    const trend = 100000 + (target - 100000) * progress;
    const noise = Math.sin(day / 9) * 4000 + (r() - 0.5) * 3000;
    equity = trend + noise;
    if (day % 7 === 0) {
      points.push({ date: cur.toISOString().slice(0, 10), equity: Math.round(equity) });
    }
    cur.setDate(cur.getDate() + 1);
    day++;
  }
  points[points.length - 1] = { date: end.toISOString().slice(0, 10), equity: target };
  points[0] = { date: start.toISOString().slice(0, 10), equity: 100000 };
  return points;
}

export const equityCurve = buildEquityCurve();

export const monthlyReturns = {
  2024: [11.2, 21.9, 7.9, 13.6, 10.6, 2.6, 14.1, 8.1, 6.7, 4.7, 7.9, 12.6],
  2025: [2.1, 1.6, 7.2, 6.0, 4.3, 3.1, 5.1, 4.1, 3.3, 4.1, 3.4, 2.2],
  2026: [7.1, 1.3, 2.4, 2.4, 1.7, 3.2, null, null, null, null, null, null],
};

export const monthlyTradeCounts = {
  2024: [9, 26, 17, 27, 22, 13, 22, 12, 17, 16, 23, 31],
  2025: [16, 16, 20, 22, 21, 22, 30, 16, 19, 25, 19, 20],
  2026: [27, 6, 15, 12, 15, 15, null, null, null, null, null, null],
};

export const monthlyWinRates = {
  2024: [78, 62, 47, 63, 59, 46, 68, 75, 65, 56, 65, 77],
  2025: [50, 31, 75, 55, 52, 58, 63, 69, 58, 58, 50, 50],
  2026: [85, 67, 73, 83, 47, 73, null, null, null, null, null, null],
};

export const generalMetrics = {
  totalTrades: 571,
  totalVolume: '1129.97 lots',
  avgHoldPeriod: '—',
  tradingDays: 284,
  avgLossProfit: '36%',
  profitFactor: 5.51,
  sortino: 1.41,
  calmar: 73.29,
  annVolatility: '5.9%',
  var: '—',
  cVar: '—',
  avgDrawdown: '-0.34%',
  avgDDLength: '2 trades',
  smartSharpe: '—',
  smartSortino: '—',
  treynor: '—',
  rSquared: '—',
  skew: -0.06,
  kurtosis: -1.31,
  expectancy: 914.98,
};

export const strategies = [
  {
    id: 'strat-demo',
    name: 'Demo Strategy',
    type: 'Trend Following',
    description: 'Multi-timeframe trend following system on futures indices.',
    totalTrades: 571,
    winrate: 66.6,
    rr: 1.8,
    profitFactor: 5.51,
    expectancy: 914.98,
    maxLosingStreak: 4,
    sharpe: 1.62,
    sortino: 1.41,
    totalPnl: 490430,
    linkedAccountId: 'acc-demo',
  },
];

export const costs = [
  { id: 'c1', date: '2026-06-01', name: 'TradingView Pro', category: 'Subscription', recurring: 'monthly', amount: 14.99 },
  { id: 'c2', date: '2026-05-15', name: 'Trading Journal License', category: 'Software', recurring: null, amount: 49 },
  { id: 'c3', date: '2026-05-02', name: 'Apex Trader Funding', category: 'Challenge', recurring: null, amount: 167 },
  { id: 'c4', date: '2026-04-20', name: 'FTMO Challenge', category: 'Challenge', recurring: null, amount: 540 },
  { id: 'c5', date: '2026-04-01', name: 'TradingView Pro', category: 'Subscription', recurring: 'monthly', amount: 14.99 },
  { id: 'c6', date: '2026-03-10', name: 'VPS Hosting', category: 'Infrastructure', recurring: 'monthly', amount: 19.99 },
  { id: 'c7', date: '2026-02-28', name: 'Discord Pro Community', category: 'Education', recurring: 'monthly', amount: 24.99 },
  { id: 'c8', date: '2026-02-05', name: 'Data Feed Subscription', category: 'Data', recurring: 'monthly', amount: 14.99 },
];

export const payouts = [
  { id: 'p1', name: 'FTMO Funded #1', firm: 'FTMO', date: '2026-05-10', amount: 3200.0, rank: 1 },
  { id: 'p2', name: 'FTMO Funded #1', firm: 'FTMO', date: '2026-03-20', amount: 2400.0, rank: 2 },
  { id: 'p3', name: 'Apex Funded', firm: 'Apex Trader Funding', date: '2026-04-15', amount: 1500.0, rank: 3 },
  { id: 'p4', name: 'Topstep Funded', firm: 'Topstep', date: '2026-02-01', amount: 980.0, rank: 4 },
];

export const propFirms = [
  'FTMO', 'Funding Pips', 'The Funded Trader', 'E8 Funding', 'True Forex Funds',
  'MyForexFunds', 'Alpha Capital', 'Instant Funding', 'The5ers', 'FundedNext',
];
