import React, { useState } from 'react';
import { costs as initialCosts, payouts as initialPayouts } from '../../data/mockData';

const fmtUsd = (v) => Number(v).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const rankBadgeClass = {
  1: 'bg-gray-900 text-white',
  2: 'bg-gray-200 text-gray-700',
  3: 'bg-gray-100 text-gray-500',
};
const rankLabel = { 1: '1st', 2: '2nd', 3: '3rd' };

const tabs = ['Subscriptions & Fees', 'Payouts', 'Monthly Overview'];

export default function Costs() {
  const [costs] = useState(initialCosts);
  const [payouts] = useState(initialPayouts);
  const [activeTab, setActiveTab] = useState('Subscriptions & Fees');

  const totalCosts = costs.reduce((sum, c) => sum + c.amount, 0);
  const monthlySubs = costs.filter((c) => c.recurring === 'monthly').reduce((sum, c) => sum + c.amount, 0);
  const totalEarned = payouts.reduce((sum, p) => sum + p.amount, 0);
  const netResult = totalEarned - totalCosts;

  const topPayouts = [...payouts].sort((a, b) => a.rank - b.rank).slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div />
        <div className="flex gap-2">
          <button className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
            + Add Cost
          </button>
          <button className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600">
            + Add Payout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Costs" value={fmtUsd(totalCosts)} negative />
        <StatCard label="Monthly Subscriptions" value={fmtUsd(monthlySubs)} />
        <StatCard label="Total Earned" value={fmtUsd(totalEarned)} positive />
        <StatCard label="Net Result" value={`${netResult >= 0 ? '+' : ''}${fmtUsd(netResult)}`} positive={netResult >= 0} negative={netResult < 0} />
      </div>

      <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-4">Top Payouts</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topPayouts.map((p) => (
            <div key={p.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${rankBadgeClass[p.rank] || rankBadgeClass[3]}`}>
                  {p.rank}
                </span>
                <span className="text-xs font-semibold text-gray-400">{rankLabel[p.rank] || `${p.rank}th`}</span>
              </div>
              <div className="font-semibold text-gray-900">{p.name}</div>
              <div className="text-xs text-gray-400">
                {p.firm} · {p.date}
              </div>
              <div className="text-lg font-bold text-brand-500 mt-2 break-words">{fmtUsd(p.amount)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex gap-1 border-b border-gray-100 px-5 pt-4">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                activeTab === t ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="p-5">
          {activeTab === 'Subscriptions & Fees' && <CostsTable costs={costs} />}
          {activeTab === 'Payouts' && <PayoutsTable payouts={payouts} />}
          {activeTab === 'Monthly Overview' && <MonthlyOverview costs={costs} payouts={payouts} />}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, positive, negative }) {
  return (
    <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5 min-w-0">
      <div className="text-xs text-gray-400 uppercase tracking-wide truncate">{label}</div>
      <div className={`mt-2 text-2xl font-bold tabular-nums break-words ${positive ? 'text-brand-500' : negative ? 'text-red-600' : 'text-gray-900'}`}>
        {value}
      </div>
    </div>
  );
}

function CostsTable({ costs }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-gray-400 text-xs uppercase tracking-wide border-b border-gray-100">
          <th className="py-2">Date</th>
          <th className="py-2">Name</th>
          <th className="py-2">Category</th>
          <th className="py-2">Recurring</th>
          <th className="py-2">Amount</th>
        </tr>
      </thead>
      <tbody>
        {costs.map((c) => (
          <tr key={c.id} className="border-b border-gray-50">
            <td className="py-2 text-gray-700">{c.date}</td>
            <td className="py-2 text-gray-700 font-medium">{c.name}</td>
            <td className="py-2 text-gray-500">{c.category}</td>
            <td className="py-2">
              {c.recurring ? (
                <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.recurring}</span>
              ) : (
                <span className="text-gray-300">—</span>
              )}
            </td>
            <td className="py-2 font-medium text-red-600">-{fmtUsd(c.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PayoutsTable({ payouts }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-gray-400 text-xs uppercase tracking-wide border-b border-gray-100">
          <th className="py-2">Date</th>
          <th className="py-2">Name</th>
          <th className="py-2">Firm</th>
          <th className="py-2">Amount</th>
        </tr>
      </thead>
      <tbody>
        {payouts.map((p) => (
          <tr key={p.id} className="border-b border-gray-50">
            <td className="py-2 text-gray-700">{p.date}</td>
            <td className="py-2 text-gray-700 font-medium">{p.name}</td>
            <td className="py-2 text-gray-500">{p.firm}</td>
            <td className="py-2 font-medium text-brand-500">+{fmtUsd(p.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MonthlyOverview({ costs, payouts }) {
  const months = {};
  costs.forEach((c) => {
    const m = c.date.slice(0, 7);
    months[m] = months[m] || { cost: 0, earned: 0 };
    months[m].cost += c.amount;
  });
  payouts.forEach((p) => {
    const m = p.date.slice(0, 7);
    months[m] = months[m] || { cost: 0, earned: 0 };
    months[m].earned += p.amount;
  });
  const sortedMonths = Object.keys(months).sort();

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-gray-400 text-xs uppercase tracking-wide border-b border-gray-100">
          <th className="py-2">Month</th>
          <th className="py-2">Costs</th>
          <th className="py-2">Earned</th>
          <th className="py-2">Net</th>
        </tr>
      </thead>
      <tbody>
        {sortedMonths.map((m) => {
          const net = months[m].earned - months[m].cost;
          return (
            <tr key={m} className="border-b border-gray-50">
              <td className="py-2 text-gray-700">{m}</td>
              <td className="py-2 text-red-600">-{fmtUsd(months[m].cost)}</td>
              <td className="py-2 text-brand-500">+{fmtUsd(months[m].earned)}</td>
              <td className={`py-2 font-medium ${net >= 0 ? 'text-brand-500' : 'text-red-600'}`}>
                {net >= 0 ? '+' : ''}
                {fmtUsd(net)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
