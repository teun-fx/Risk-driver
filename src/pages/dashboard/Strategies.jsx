import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  ComposedChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { trades as demoTrades } from '../../data/mockData';
import AddStrategyModal from '../../components/modals/AddStrategyModal';
import LinkStrategyModal from '../../components/modals/LinkStrategyModal';
import CircularScore from '../../components/CircularScore';
import { computeStrategyRadar } from '../../utils/strategyScore';
import {
  ksTestNormal,
  lag1Autocorrelation,
  classifyMethod,
  runMonteCarlo,
  buildMonteCarloCharts,
  consistencyCheck,
  verdictLabels,
  breakevenWinRate,
  parseRMultiple,
} from '../../utils/montecarlo';

const fmtUsd = (v) => Number(v).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export default function Strategies() {
  const { strategies, setStrategies, accounts } = useOutletContext();
  const [selectedId, setSelectedId] = useState(strategies[0]?.id || null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const selected = strategies.find((s) => s.id === selectedId);
  const activeTrades = selected?.trades?.length ? selected.trades : demoTrades;
  const linkedAccount = selected ? accounts.find((a) => a.id === selected.linkedAccountId) : null;

  const handleCreate = (strategy) => {
    setStrategies((prev) => [...prev, strategy]);
    setSelectedId(strategy.id);
    setShowAddModal(false);
  };

  const handleLink = (accountId) => {
    setStrategies((prev) => prev.map((s) => (s.id === selectedId ? { ...s, linkedAccountId: accountId } : s)));
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Left panel */}
      <div className="w-full md:w-72 shrink-0">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          Strategies {strategies.length > 0 && <span className="text-gray-400 text-sm font-normal">{strategies.length}</span>}
        </h2>
        <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm p-3">
          {strategies.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-[11px] uppercase tracking-wide border-b border-gray-100">
                  <th className="py-1.5">Name</th>
                  <th className="py-1.5 text-right">Trades</th>
                </tr>
              </thead>
              <tbody>
                {strategies.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className={`cursor-pointer border-b border-gray-50 last:border-0 ${
                      selectedId === s.id ? 'bg-brand-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-2">
                      <div className={`font-medium ${selectedId === s.id ? 'text-brand-700' : 'text-gray-900'}`}>{s.name}</div>
                      <div className="text-xs text-gray-400">{s.type}</div>
                    </td>
                    <td className="py-2 text-right text-gray-500">{s.totalTrades}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full mt-3 border border-dashed border-gray-300 rounded-lg p-2 text-sm text-gray-500 hover:bg-gray-50"
          >
            + Add strategy
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {!selected ? (
          <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col items-center justify-center text-center py-24">
            <div className="text-4xl mb-3">📈</div>
            <div className="font-semibold text-gray-900">No strategy found</div>
            <p className="text-sm text-gray-400 mt-1">Add your strategy to get started.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 bg-brand-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-600"
            >
              + Add strategy
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selected.name}</h2>
                  <div className="text-sm text-gray-400">{selected.type}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {linkedAccount ? (
                      <>
                        Linked to <span className="font-medium text-gray-700">{linkedAccount.name}</span>
                      </>
                    ) : (
                      'Not linked to an account'
                    )}
                  </span>
                  <button
                    onClick={() => setShowLinkModal(true)}
                    className="border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50"
                  >
                    {linkedAccount ? 'Change' : 'Link account'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <CompactMetric label="Winrate" value={`${selected.winrate}%`} positive />
                <CompactMetric label="R:R" value={selected.rr} />
                <CompactMetric label="Profit Factor" value={selected.profitFactor} positive />
                <CompactMetric label="Expectancy" value={fmtUsd(selected.expectancy)} positive={selected.expectancy >= 0} />
                <CompactMetric label="Max Losing Streak" value={`${selected.maxLosingStreak} trades`} />
                <CompactMetric label="Sharpe" value={selected.sharpe} />
                <CompactMetric label="Sortino" value={selected.sortino} />
                <CompactMetric label="Total Trades" value={selected.totalTrades} />
                <CompactMetric label="Total P&L" value={fmtUsd(selected.totalPnl)} positive={selected.totalPnl >= 0} negative={selected.totalPnl < 0} />
              </div>
            </div>

            <ReadinessCard strategy={selected} />

            <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
              <MonteCarloSection strategy={selected} trades={activeTrades} />
            </div>
          </div>
        )}
      </div>

      {showAddModal && <AddStrategyModal onClose={() => setShowAddModal(false)} onCreate={handleCreate} />}
      {showLinkModal && selected && (
        <LinkStrategyModal strategy={selected} accounts={accounts} onClose={() => setShowLinkModal(false)} onLink={handleLink} />
      )}
    </div>
  );
}

function CompactMetric({ label, value, positive, negative }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] text-gray-400 uppercase tracking-wide truncate">{label}</div>
      <div className={`text-base font-bold tabular-nums break-words ${positive ? 'text-brand-500' : negative ? 'text-red-600' : 'text-gray-900'}`}>
        {value}
      </div>
    </div>
  );
}

function ReadinessCard({ strategy }) {
  const radar = useMemo(() => computeStrategyRadar(strategy), [strategy]);

  return (
    <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Strategy Readiness</div>
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_1fr] gap-6 items-center">
        <div className="flex justify-center">
          <CircularScore score={radar.overall} label="Readiness score" size={128} />
        </div>
        <div className="space-y-3 w-full">
          {radar.components.map((c) => (
            <div key={c.name} className="min-w-0">
              <div className="flex justify-between text-sm mb-1 gap-2">
                <span className="text-gray-700 truncate">{c.name}</span>
                <span className="font-medium text-gray-900 shrink-0">{c.score}</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100">
                <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${c.score}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radar.components} outerRadius="75%">
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="score" stroke="#16a34a" fill="#16a34a" fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

const yearsOptions = [1, 2, 3];
const simOptions = [1000, 5000, 10000];

function ToggleGroup({ options, value, onChange, suffix = '' }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`px-4 py-2 rounded-lg border text-sm font-medium ${
            value === o ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {o}
          {suffix}
        </button>
      ))}
    </div>
  );
}

function monthsBetween(trades_) {
  const first = new Date(trades_[0].date);
  const last = new Date(trades_[trades_.length - 1].date);
  const days = Math.max(1, (last - first) / 86400000);
  return days / 30.44;
}

const verdictBadgeClass = {
  under: 'bg-red-50 text-red-700',
  expected: 'bg-brand-50 text-brand-700',
  over: 'bg-gray-100 text-gray-700',
};

function ConsistencyCheckCard({ data }) {
  const rows = [
    { key: 'winRate', label: 'Win rate', fmt: (v) => `${v.toFixed(1)}%` },
    { key: 'profitFactor', label: 'Profit factor', fmt: (v) => v.toFixed(2) },
    { key: 'volatility', label: 'Volatility', fmt: (v) => v.toFixed(2) },
  ];

  return (
    <div>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Phase 1 — Consistency check (last {data.windowSize} trades vs. history)
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rows.map(({ key, label, fmt }) => {
          const m = data[key];
          return (
            <div key={key} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400 uppercase tracking-wide">{label}</div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${verdictBadgeClass[m.verdict]}`}>
                  {verdictLabels[m.verdict]}
                </span>
              </div>
              <div className="mt-1 text-xl font-bold tabular-nums text-gray-900">{fmt(m.value)}</div>
              <div className="text-xs text-gray-400 mt-1">
                Usual range: {fmt(m.min)} – {fmt(m.max)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MethodVerdictCard({ verdict, tradesPerMonth }) {
  const borderColor = verdict.color === 'green' ? 'border-brand-500' : verdict.color === 'gray' ? 'border-gray-400' : 'border-red-500';
  const tagClass = verdict.color === 'green' ? 'bg-brand-50 text-brand-700' : verdict.color === 'gray' ? 'bg-gray-100 text-gray-700' : 'bg-red-50 text-red-700';

  return (
    <div className={`border-l-4 ${borderColor} border border-gray-200 rounded-lg p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">How we'll simulate this</div>
          <div className="text-lg font-bold text-gray-900">{verdict.name}</div>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${tagClass}`}>Method {verdict.method}</span>
      </div>
      <p className="text-sm text-gray-600 mt-2">{verdict.desc}</p>
      <p className="text-xs text-gray-400 mt-3">
        Update cadence: {verdict.updateCycle} · {tradesPerMonth.toFixed(1)} trades/month
      </p>
    </div>
  );
}

function SettingReadout({ label, value, hint }) {
  return (
    <div className="min-w-0">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 truncate">{label}</div>
      <div className="text-xl font-bold tabular-nums text-gray-900 break-words">{value}</div>
      <div className="text-xs text-gray-400 mt-1">{hint}</div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</div>
      <div className="h-60">{children}</div>
    </div>
  );
}

const axisTick = { fontSize: 11, fill: '#9ca3af' };
const pctFmt = (v) => `${v}%`;

function MonteCarloSection({ strategy, trades }) {
  const [riskPerTrade, setRiskPerTrade] = useState(1);
  const [years, setYears] = useState(1);
  const [simCount, setSimCount] = useState(5000);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const rMultiples = useMemo(() => trades.map((t) => parseRMultiple(t.rr)), [trades]);
  const tradesPerMonth = useMemo(() => trades.length / monthsBetween(trades), [trades]);
  const ks = useMemo(() => ksTestNormal(rMultiples), [rMultiples]);
  const autocorr = useMemo(() => lag1Autocorrelation(rMultiples), [rMultiples]);
  const verdict = classifyMethod({ tradesPerMonth, ksPValue: ks.pValue, autocorr });
  const consistency = useMemo(() => consistencyCheck(trades, 50), [trades]);

  const rr = strategy.rr || 0;
  const breakeven = breakevenWinRate(rr);
  const returns = useMemo(() => rMultiples.map((r) => r * riskPerTrade), [rMultiples, riskPerTrade]);
  const horizonTrades = Math.max(1, Math.round(years * 12 * tradesPerMonth));

  const charts = useMemo(() => (result ? buildMonteCarloCharts(result.samplePaths) : null), [result]);

  const handleRun = () => {
    setRunning(true);
    setResult(null);
    setTimeout(() => {
      const r = runMonteCarlo({
        returns,
        horizonTrades,
        simCount,
        maxDrawdownPct: 10,
        method: verdict.method,
      });
      setResult(r);
      setRunning(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <CompactMetric label="Winrate" value={`${strategy.winrate}%`} positive />
        <CompactMetric label="R:R" value={`${Number(rr).toFixed(2)}R`} />
        <CompactMetric label="Profit Factor" value={strategy.profitFactor} positive />
        <CompactMetric label="Sharpe" value={strategy.sharpe} />
      </div>

      {consistency && <ConsistencyCheckCard data={consistency} />}

      <MethodVerdictCard verdict={verdict} tradesPerMonth={tradesPerMonth} />

      <div className="border border-gray-200 rounded-lg p-5">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Simulation settings</div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <SettingReadout label="Trades / month" value={tradesPerMonth.toFixed(1)} hint="From your trade history" />
          <SettingReadout label="Risk : Reward" value={`${Number(rr).toFixed(2)}R`} hint="From your trade history" />
          <SettingReadout label="Breakeven win rate" value={`${breakeven.toFixed(1)}%`} hint="= 100 ÷ (1 + R:R)" />
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Risk per trade</div>
            <div className="relative">
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={riskPerTrade}
                onChange={(e) => setRiskPerTrade(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-7 focus:outline-none focus:border-gray-400"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">Set manually — not in your trade export</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Years to simulate</div>
            <ToggleGroup options={yearsOptions} value={years} onChange={setYears} suffix="y" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Number of simulations</div>
            <ToggleGroup options={simOptions} value={simCount} onChange={setSimCount} />
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-4">
          {simCount.toLocaleString()} simulations over {years} year{years > 1 ? 's' : ''} (~{horizonTrades} trades), risking {riskPerTrade}% per trade.
        </p>
      </div>

      <button
        onClick={handleRun}
        disabled={running}
        className="bg-brand-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-brand-600 disabled:opacity-50"
      >
        {running ? 'Simulating…' : '▶ Run Monte Carlo'}
      </button>

      {result && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <CompactMetric label="Chance of breaching drawdown" value={`${result.breachProbability.toFixed(1)}%`} negative={result.breachProbability > 50} />
            <CompactMetric label="Chance of a clean run" value={`${result.zeroFailsProbability.toFixed(1)}%`} positive={result.zeroFailsProbability > 50} />
          </div>

          {charts && (
            <div className="space-y-6">
              <ChartCard title="Equity curve — best / average / worst scenario">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.equityCurve} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="trade" tick={axisTick} />
                    <YAxis tick={axisTick} tickFormatter={pctFmt} width={44} />
                    <Tooltip formatter={(v) => `${v}%`} labelFormatter={(l) => `Trade ${l}`} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="best" name="Best case" stroke="#16a34a" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="average" name="Average case" stroke="#111827" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="worst" name="Worst case" stroke="#dc2626" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Drawdown — best / average / worst scenario">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.drawdownCurve} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="trade" tick={axisTick} />
                    <YAxis tick={axisTick} tickFormatter={pctFmt} width={44} />
                    <Tooltip formatter={(v) => `${v}%`} labelFormatter={(l) => `Trade ${l}`} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="best" name="Best case" stroke="#16a34a" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="average" name="Average case" stroke="#111827" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="worst" name="Worst case" stroke="#dc2626" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title={`Forecast — likely range for the next ${charts.forecastBand.length - 1} trades`}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={charts.forecastBand} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="trade" tick={axisTick} />
                    <YAxis tick={axisTick} tickFormatter={pctFmt} width={44} />
                    <Tooltip formatter={(v) => `${v}%`} labelFormatter={(l) => `Trade ${l}`} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area dataKey="p10" stackId="band" stroke="none" fill="transparent" name="P10" legendType="none" />
                    <Area dataKey="band" stackId="band" stroke="none" fill="#16a34a" fillOpacity={0.15} name="Likely range (P10–P90)" />
                    <Line dataKey="p50" name="Median path" stroke="#111827" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}
        </>
      )}
    </div>
  );
}
