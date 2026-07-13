import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const fmtUsd = (v) => Number(v).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const scenarios = [
  { key: 'worst', label: 'Worst Case', monthlyReturn: 0.02, costPerAccount: 540, accounts: 1, color: 'text-red-600' },
  { key: 'average', label: 'Average Case', monthlyReturn: 0.05, costPerAccount: 540, accounts: 2, color: 'text-gray-900' },
  { key: 'best', label: 'Best Case', monthlyReturn: 0.09, costPerAccount: 540, accounts: 3, color: 'text-brand-500' },
];

export default function Roadmap() {
  const { strategies } = useOutletContext();
  const [targetPayout, setTargetPayout] = useState(5000);
  const [timeline, setTimeline] = useState(12);

  const strategy = strategies[0];
  const readyConditions = useMemo(() => {
    const minTrades = 100;
    const sampleOk = strategy.totalTrades >= minTrades;
    const ddOk = true;
    const consistencyOk = strategy.winrate >= 50;
    return { sampleOk, ddOk, consistencyOk, minTrades };
  }, [strategy]);

  const isReady = readyConditions.sampleOk && readyConditions.ddOk && readyConditions.consistencyOk;

  const scenarioStats = scenarios.map((s) => {
    const monthsToFirstPayout = Math.max(1, Math.ceil(Math.log(1 + targetPayout / 10000) / Math.log(1 + s.monthlyReturn)));
    const totalInvestment = s.costPerAccount * s.accounts;
    return { ...s, monthsToFirstPayout, totalInvestment };
  });

  const projection = useMemo(() => {
    const rows = [];
    let cumulative = 0;
    const avgScenario = scenarios[1];
    for (let m = 1; m <= 12; m++) {
      const accountsActive = Math.min(avgScenario.accounts, Math.ceil(m / 3));
      const expectedPnl = 10000 * avgScenario.monthlyReturn * accountsActive;
      cumulative += expectedPnl;
      const costs = m === 1 ? avgScenario.costPerAccount * accountsActive : accountsActive * 0;
      const net = cumulative - costs;
      rows.push({
        month: `M${m}`,
        accountsActive,
        expectedPnl: Math.round(expectedPnl),
        cumulativeProfit: Math.round(cumulative),
        totalCosts: Math.round(costs),
        netPosition: Math.round(net),
      });
    }
    return rows;
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Funding Planner</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Target monthly payout ($)</label>
            <input
              type="number"
              value={targetPayout}
              onChange={(e) => setTargetPayout(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Timeline (months)</label>
            <input
              type="number"
              value={timeline}
              onChange={(e) => setTimeline(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:border-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarioStats.map((s) => (
          <div key={s.key} className="bg-white border border-gray-200/80 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5 min-w-0">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-3 truncate">{s.label}</div>
            <div className={`text-2xl font-bold tabular-nums break-words ${s.color}`}>{s.monthsToFirstPayout} mo</div>
            <p className="text-xs text-gray-400 mb-3">to first payout</p>
            <div className="text-sm text-gray-700 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Investment</span>
                <span className="font-medium">{fmtUsd(s.totalInvestment)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Accounts</span>
                <span className="font-medium">{s.accounts}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-4">Cumulative profit projection</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projection} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v) => fmtUsd(v)} />
              <Line type="monotone" dataKey="cumulativeProfit" stroke="#16a34a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5 overflow-x-auto">
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-4">Monthly projection</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 text-xs uppercase tracking-wide border-b border-gray-100">
              <th className="py-2">Month</th>
              <th className="py-2">Accounts Active</th>
              <th className="py-2">Expected P&L</th>
              <th className="py-2">Cumulative Profit</th>
              <th className="py-2">Total Costs</th>
              <th className="py-2">Net Position</th>
            </tr>
          </thead>
          <tbody>
            {projection.map((row) => (
              <tr key={row.month} className="border-b border-gray-50">
                <td className="py-2 text-gray-700">{row.month}</td>
                <td className="py-2 text-gray-700">{row.accountsActive}</td>
                <td className="py-2 text-brand-500">{fmtUsd(row.expectedPnl)}</td>
                <td className="py-2 font-medium text-gray-900">{fmtUsd(row.cumulativeProfit)}</td>
                <td className="py-2 text-red-600">{row.totalCosts ? `-${fmtUsd(row.totalCosts)}` : '—'}</td>
                <td className="py-2 font-medium text-gray-900">{fmtUsd(row.netPosition)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Challenge Purchase Advisor</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
          <Stat label="Winrate" value={`${strategy.winrate}%`} />
          <Stat label="Sample size" value={`${strategy.totalTrades} trades`} />
          <Stat label="Current drawdown" value="-1.47%" />
          <Stat label="Consistency score" value="82/100" />
        </div>
        {isReady ? (
          <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 text-sm text-brand-700">
            ✓ You meet all conditions. A 100k challenge is recommended.
          </div>
        ) : (
          <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
            Not quite ready yet. Only {strategy.totalTrades} trades — at least {readyConditions.minTrades} required.
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-gray-400 truncate">{label}</div>
      <div className="font-semibold text-gray-900 break-words">{value}</div>
    </div>
  );
}
