import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { equityCurve, generalMetrics, monthlyReturns, monthlyTradeCounts, monthlyWinRates, trades as demoTrades } from '../../data/mockData';
import { buildStrategyCorrelation } from '../../utils/correlation';

const fmtUsd = (v) => v.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const fmtPct = (v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;

const ranges = ['1D', '1W', '1M', '6M', '1Y', 'MAX'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function correlationColor(v) {
  if (v === null) return 'bg-gray-50 text-gray-300';
  if (v >= 0.7) return 'bg-red-100 text-red-700';
  if (v >= 0.3) return 'bg-gray-200 text-gray-700';
  if (v >= -0.3) return 'bg-gray-50 text-gray-600';
  return 'bg-brand-100 text-brand-700';
}

function StatCard({ label, value, positive }) {
  return (
    <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5 min-w-0">
      <div className="text-xs text-gray-400 uppercase tracking-wide truncate">{label}</div>
      <div className={`mt-2 text-2xl font-bold tabular-nums break-words ${positive === undefined ? 'text-gray-900' : positive ? 'text-brand-500' : 'text-red-600'}`}>
        {value}
      </div>
    </div>
  );
}

function sliceForRange(range) {
  const n = equityCurve.length;
  let count = n;
  if (range === '1D') count = 2;
  else if (range === '1W') count = 2;
  else if (range === '1M') count = 5;
  else if (range === '6M') count = 26;
  else if (range === '1Y') count = 52;
  return equityCurve.slice(Math.max(0, n - count));
}

export default function Dashboard() {
  const { strategies } = useOutletContext();
  const [range, setRange] = useState('MAX');
  const data = useMemo(() => sliceForRange(range), [range]);

  const first = equityCurve[0].equity;
  const last = equityCurve[equityCurve.length - 1].equity;
  const overallReturn = ((last - first) / first) * 100;
  const totalProfit = last - first;

  const years = Object.keys(monthlyReturns).sort();

  // The seed "Demo Strategy" predates per-strategy trade uploads, so it has
  // no `.trades` of its own — fall back to the shared demo trade log for it,
  // same as the Strategies tab does, so correlation always has real data.
  const correlation = useMemo(() => {
    const withTrades = strategies.map((s) => ({
      ...s,
      trades: s.trades?.length ? s.trades : s.id === 'strat-demo' ? demoTrades : [],
    }));
    return buildStrategyCorrelation(withTrades);
  }, [strategies]);

  const yearTotal = (year) => {
    const vals = monthlyReturns[year].filter((v) => v !== null);
    // compound
    const compounded = vals.reduce((acc, v) => acc * (1 + v / 100), 1);
    return (compounded - 1) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Overall Return" value={fmtPct(overallReturn)} positive={overallReturn >= 0} />
        <StatCard label="Total Profit" value={fmtUsd(totalProfit)} positive={totalProfit >= 0} />
        <StatCard label="Max Drawdown" value="-1.47%" positive={false} />
        <StatCard label="Win Rate" value="66.6%" positive />
      </div>

      {/* Equity chart */}
      <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-1">
            EQUITY / BALANCE <span className="text-gray-300">ⓘ</span>
          </div>
          <div className="flex items-center gap-1">
            {ranges.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${
                  range === r ? 'border-brand-500 text-brand-600 bg-brand-50' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(d) => d.slice(0, 7)} minTickGap={40} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v) => fmtUsd(v)} labelFormatter={(l) => l} />
                <Area type="monotone" dataKey="equity" stroke="#16a34a" strokeWidth={2} fill="url(#equityFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="lg:w-64 grid grid-cols-2 gap-4">
            <MiniStat label="Overall Return" value={fmtPct(overallReturn)} positive />
            <MiniStat label="YTD Return" value={fmtUsd(96130)} positive />
            <MiniStat label="Max Drawdown" value="-1.47%" />
            <MiniStat label="Balance" value={fmtUsd(last)} />
            <MiniStat label="All-time Sharpe" value="0.74" />
            <MiniStat label="Win Rate" value="66.6%" positive />
            <MiniStat label="Total Profit" value={fmtUsd(totalProfit)} positive />
            <MiniStat label="Avg Monthly Return" value={fmtUsd(16348)} positive />
          </div>
        </div>
      </div>

      {/* General Metrics + Portfolio Correlation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 bg-white border border-gray-200/80 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-4">GENERAL METRICS ⓘ</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-y-5 gap-x-4">
            <Metric label="Total Trades" value={generalMetrics.totalTrades} />
            <Metric label="Total Volume" value={generalMetrics.totalVolume} />
            <Metric label="Avg Hold Period" value={generalMetrics.avgHoldPeriod} />
            <Metric label="Trading Days" value={generalMetrics.tradingDays} />
            <Metric label="Avg Loss / Profit" value={generalMetrics.avgLossProfit} />
            <Metric label="Profit Factor" value={generalMetrics.profitFactor} positive />
            <Metric label="Sortino" value={generalMetrics.sortino} positive />
            <Metric label="Calmar" value={generalMetrics.calmar} positive />
            <Metric label="Ann. Volatility" value={generalMetrics.annVolatility} />
            <Metric label="VaR" value={generalMetrics.var} />
            <Metric label="cVaR" value={generalMetrics.cVar} />
            <Metric label="Avg Drawdown" value={generalMetrics.avgDrawdown} negative />
            <Metric label="Avg DD Length" value={generalMetrics.avgDDLength} />
            <Metric label="Smart Sharpe" value={generalMetrics.smartSharpe} />
            <Metric label="Smart Sortino" value={generalMetrics.smartSortino} />
            <Metric label="Treynor" value={generalMetrics.treynor} />
            <Metric label="R-squared" value={generalMetrics.rSquared} />
            <Metric label="Skew" value={generalMetrics.skew} negative />
            <Metric label="Kurtosis" value={generalMetrics.kurtosis} negative />
            <Metric label="Expectancy" value={fmtUsd(generalMetrics.expectancy)} positive />
          </div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5 overflow-x-auto">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-4">PORTFOLIO CORRELATION</div>
          {correlation.names.length < 2 ? (
            <p className="text-sm text-gray-400">
              Add {correlation.names.length === 0 ? 'strategies' : 'another strategy'} to see how they correlate with each other.
            </p>
          ) : (
            <table className="text-sm">
              <thead>
                <tr>
                  <th className="w-16"></th>
                  {correlation.names.map((n) => (
                    <th key={n} className="px-2 py-2 text-gray-500 font-medium max-w-[72px] truncate" title={n}>
                      {n}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {correlation.names.map((row, ri) => (
                  <tr key={row}>
                    <td className="px-2 py-2 text-gray-500 font-medium max-w-[72px] truncate" title={row}>
                      {row}
                    </td>
                    {correlation.values[ri].map((v, ci) => (
                      <td key={ci} className="p-1">
                        <div
                          className={`w-14 h-11 rounded-md flex items-center justify-center font-semibold text-xs ${correlationColor(v)}`}
                          title={v === null ? 'Not enough shared trading history' : undefined}
                        >
                          {v === null ? '—' : v.toFixed(2)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Monthly Calendar */}
      <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5 overflow-x-auto">
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-4">MONTHLY CALENDAR ⓘ</div>
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left text-gray-400 font-normal pb-2"></th>
              {months.map((m) => (
                <th key={m} className="text-gray-400 font-normal pb-2">{m}</th>
              ))}
              <th className="text-gray-400 font-normal pb-2">Year</th>
            </tr>
          </thead>
          <tbody>
            {years.map((year) => (
              <tr key={year}>
                <td className="text-gray-500 font-medium pr-2">{year}</td>
                {monthlyReturns[year].map((v, i) => (
                  <td key={i} className="p-1">
                    {v === null ? (
                      <div className="rounded-md bg-gray-50 text-gray-300 text-center py-2">—</div>
                    ) : (
                      <div className={`rounded-md text-center py-1.5 ${v >= 0 ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-700'}`}>
                        <div className="font-semibold">{fmtPct(v)}</div>
                        <div className="text-[10px] opacity-70">
                          {monthlyTradeCounts[year][i]} tr <br /> {monthlyWinRates[year][i]}%
                        </div>
                      </div>
                    )}
                  </td>
                ))}
                <td className="p-1">
                  <div className={`rounded-md text-center py-2 font-semibold ${yearTotal(year) >= 0 ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-700'}`}>
                    {fmtPct(yearTotal(year))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MiniStat({ label, value, positive }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] text-gray-400 truncate">{label}</div>
      <div className={`text-sm font-semibold break-words ${positive ? 'text-brand-500' : 'text-gray-900'}`}>{value}</div>
    </div>
  );
}

function Metric({ label, value, positive, negative }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] text-gray-400 truncate">{label}</div>
      <div className={`text-sm font-semibold tabular-nums break-words ${positive ? 'text-brand-500' : negative ? 'text-red-600' : 'text-gray-900'}`}>
        {value}
      </div>
    </div>
  );
}
