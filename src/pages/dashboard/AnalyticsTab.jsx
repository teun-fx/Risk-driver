import { useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  equityCurve, underwaterCurve, rollingDrawdown, monteCarlo,
  dailyReturns, winRate, avgWin, avgLoss, riskOfRuin,
} from '../../utils/tradeStats';

const T = {
  bg: '#F5F5F7', card: '#FFFFFF', border: '#D2D2D7', shadow: '0 2px 8px rgba(0,0,0,0.06)',
  text: '#1D1D1F', textSec: '#6E6E73', textTer: '#AEAEB2',
  accent: '#A1D533', red: '#FF3B30', green: '#34C759',
};

function Card({ title, sub, children, style = {} }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: '20px 22px', boxShadow: T.shadow, ...style }}>
      {title && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{title}</div>
          {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{sub}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

function fmtK(n) {
  const v = Number(n);
  if (isNaN(v)) return '—';
  return Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${Math.round(v)}`;
}

// ─── Risk of Ruin gauge ───────────────────────────────────────────────────────
function RoRGauge({ value }) {
  const pctVal = value != null ? Math.min(100, value * 100) : 0;
  const color = pctVal < 5 ? T.green : pctVal < 20 ? '#FF9500' : T.red;
  const cx = 80, cy = 80, r = 60;
  const startAngle = 200, sweep = 140;
  const toRad = d => (d * Math.PI) / 180;
  const angle = startAngle + (pctVal / 100) * sweep;
  const needleX = cx + r * 0.75 * Math.cos(toRad(angle));
  const needleY = cy + r * 0.75 * Math.sin(toRad(angle));
  const arcPath = (a1, a2, ri) => {
    const x1 = cx + ri * Math.cos(toRad(a1)), y1 = cy + ri * Math.sin(toRad(a1));
    const x2 = cx + ri * Math.cos(toRad(a2)), y2 = cy + ri * Math.sin(toRad(a2));
    return `M ${x1} ${y1} A ${ri} ${ri} 0 0 1 ${x2} ${y2}`;
  };
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={160} height={110} viewBox="0 0 160 110">
        <path d={arcPath(startAngle, startAngle + sweep, r)} fill="none" stroke={T.bg} strokeWidth={12} strokeLinecap="round" />
        <path d={arcPath(startAngle, angle, r)} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={T.text} strokeWidth={2} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={4} fill={T.text} />
      </svg>
      <div style={{ fontSize: 28, fontWeight: 700, color, letterSpacing: '-0.5px', marginTop: -12 }}>
        {value != null ? `${(value * 100).toFixed(1)}%` : '—'}
      </div>
      <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>Probability of blow-up</div>
    </div>
  );
}

// ─── Monthly return matrix ────────────────────────────────────────────────────
function MonthlyMatrix({ trades }) {
  const data = useMemo(() => {
    const byM = {};
    trades.forEach(t => {
      const k = String(t.date || '').slice(0, 7);
      if (k && k.length === 7) byM[k] = (byM[k] || 0) + (t.profit || 0);
    });
    const years = {};
    Object.entries(byM).forEach(([k, v]) => {
      const [y, m] = k.split('-');
      if (!years[y]) years[y] = {};
      years[y][parseInt(m) - 1] = Math.round(v);
    });
    return years;
  }, [trades]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years  = Object.keys(data).sort();
  if (!years.length) return <div style={{ color: T.textTer, fontSize: 13 }}>No monthly data available</div>;

  function cellColor(v) {
    if (v == null) return 'transparent';
    const intensity = Math.min(1, Math.abs(v) / 1000);
    return v >= 0 ? `rgba(161,213,51,${0.15 + intensity * 0.6})` : `rgba(255,59,48,${0.15 + intensity * 0.6})`;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ padding: '6px 10px', textAlign: 'left', color: T.textSec, fontWeight: 500 }}>Year</th>
            {months.map(m => (
              <th key={m} style={{ padding: '6px 8px', textAlign: 'center', color: T.textSec, fontWeight: 500, minWidth: 52 }}>{m}</th>
            ))}
            <th style={{ padding: '6px 10px', textAlign: 'right', color: T.textSec, fontWeight: 500 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {years.map(year => {
            const yd = data[year];
            const total = Object.values(yd).reduce((s, v) => s + v, 0);
            return (
              <tr key={year}>
                <td style={{ padding: '6px 10px', fontWeight: 600, color: T.text }}>{year}</td>
                {months.map((_, mi) => {
                  const val = yd[mi];
                  return (
                    <td key={mi} style={{ padding: '4px', textAlign: 'center' }}>
                      <div style={{ background: cellColor(val), borderRadius: 6, padding: '5px 4px', color: T.text, fontWeight: val != null ? 500 : 400, minWidth: 44 }}>
                        {val != null ? (Math.abs(val) >= 1000 ? `${val >= 0 ? '+' : ''}${(val / 1000).toFixed(1)}k` : `${val >= 0 ? '+' : ''}${val}`) : '—'}
                      </div>
                    </td>
                  );
                })}
                <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: total >= 0 ? T.green : T.red }}>
                  {total >= 0 ? '+' : ''}${Math.round(Math.abs(total)).toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function AnalyticsTab({ trades, startBal }) {
  const eq     = useMemo(() => equityCurve(trades, startBal), [trades, startBal]);
  const uw     = useMemo(() => underwaterCurve(trades, startBal), [trades, startBal]);
  const rdraw  = useMemo(() => rollingDrawdown(trades, startBal), [trades, startBal]);
  const mc     = useMemo(() => monteCarlo(trades, startBal, 1000), [trades, startBal]);
  const daily  = useMemo(() => dailyReturns(trades), [trades]);
  const wr     = useMemo(() => winRate(trades), [trades]);
  const aw     = useMemo(() => avgWin(trades), [trades]);
  const al     = useMemo(() => avgLoss(trades), [trades]);

  const bandwidth = useMemo(() => {
    if (!daily.length) return [];
    const returns = daily.map(d => d.pnl);
    const mean = returns.reduce((s, v) => s + v, 0) / returns.length;
    const std  = Math.sqrt(returns.reduce((s, v) => s + (v - mean) ** 2, 0) / returns.length);
    return eq.map(p => ({ ...p, upper: p.equity + std, lower: p.equity - std }));
  }, [eq, daily]);

  const projection = useMemo(() => {
    const profits = trades.map(t => t.profit || 0);
    if (profits.length < 5) return [];
    const lastEq = eq[eq.length - 1]?.equity || startBal;
    const paths = [];
    for (let s = 0; s < 500; s++) {
      let bal = lastEq;
      paths.push(Array.from({ length: 51 }, (_, i) => {
        if (i === 0) return bal;
        bal += profits[Math.floor(Math.random() * profits.length)];
        return Math.round(bal);
      }));
    }
    return Array.from({ length: 51 }, (_, i) => {
      const vals = paths.map(p => p[i]).sort((a, b) => a - b);
      return { step: i, p10: vals[50], median: vals[250], p90: vals[450] };
    });
  }, [trades, eq, startBal]);

  const histogram = useMemo(() => {
    if (!daily.length) return [];
    const vals = daily.map(d => d.pnl);
    const min = Math.floor(Math.min(...vals) / 100) * 100;
    const max = Math.ceil(Math.max(...vals) / 100) * 100;
    const step = Math.max(100, Math.round((max - min) / 20 / 100) * 100);
    const bins = [];
    for (let b = min; b < max; b += step) {
      bins.push({ label: `${b >= 0 ? '+' : ''}${Math.round(b)}`, count: vals.filter(v => v >= b && v < b + step).length });
    }
    return bins;
  }, [daily]);

  const yearlyReturns = useMemo(() => {
    const byYear = {};
    trades.forEach(t => {
      const y = String(t.date || '').slice(0, 4);
      if (y && y.length === 4) byYear[y] = (byYear[y] || 0) + (t.profit || 0);
    });
    return Object.entries(byYear).sort(([a], [b]) => a.localeCompare(b)).map(([year, pnl]) => ({ year, pnl: Math.round(pnl) }));
  }, [trades]);

  const ror = useMemo(() => {
    if (!wr || !aw || !al) return null;
    return riskOfRuin(wr, aw, al, 0.01, 5000, 0.5);
  }, [wr, aw, al]);

  const ttStyle = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 12 };

  if (!trades.length) return (
    <div style={{ padding: 40, textAlign: 'center', color: T.textSec, fontSize: 14 }}>
      No trades available for this strategy.
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Equity curve + Risk of Ruin */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <Card title="Equity curve" sub="Full historical equity progression">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={eq} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={T.accent} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={T.accent} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="trade" tick={{ fontSize: 10, fill: T.textTer }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: T.textTer }} axisLine={false} tickLine={false} tickFormatter={v => fmtK(v)} width={52} />
              <Tooltip contentStyle={ttStyle} formatter={v => [fmtK(v), 'Equity']} labelFormatter={v => `Trade ${v}`} />
              <Area type="monotone" dataKey="equity" stroke={T.accent} strokeWidth={1.5} fill="url(#eqGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Risk of Ruin" sub="At 1% risk per trade">
          <RoRGauge value={ror} />
          <div style={{ fontSize: 12, color: T.textSec, textAlign: 'center', lineHeight: 1.5, marginTop: 8 }}>
            Win rate {wr != null ? `${(wr * 100).toFixed(1)}%` : '—'}, R:R {aw && al ? (aw / al).toFixed(2) : '—'}.
            Simulated over 5,000 paths.
          </div>
        </Card>
      </div>

      {/* Underwater + Drawdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="Underwater chart" sub="Distance from previous equity high (%)">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={uw} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="uwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={T.red} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={T.red} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="trade" tick={{ fontSize: 10, fill: T.textTer }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: T.textTer }} axisLine={false} tickLine={false} tickFormatter={v => `${Number(v).toFixed(0)}%`} width={36} />
              <Tooltip contentStyle={ttStyle} formatter={v => [`${Number(v).toFixed(2)}%`, 'Drawdown']} />
              <ReferenceLine y={0} stroke="rgba(0,0,0,0.1)" />
              <Area type="monotone" dataKey="drawdown" stroke={T.red} strokeWidth={1.5} fill="url(#uwGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Drawdown curve" sub="Rolling drawdown over time">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={rdraw} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rdGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={T.red} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={T.red} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="trade" tick={{ fontSize: 10, fill: T.textTer }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: T.textTer }} axisLine={false} tickLine={false} tickFormatter={v => `${Number(v).toFixed(0)}%`} width={36} />
              <Tooltip contentStyle={ttStyle} formatter={v => [`${Number(v).toFixed(2)}%`, 'Drawdown']} />
              <Area type="monotone" dataKey="drawdown" stroke={T.red} strokeWidth={1.5} fill="url(#rdGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Bandwidth chart */}
      <Card title="Equity bandwidth" sub="Equity curve ± 1 standard deviation of daily returns">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={bandwidth} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
            <XAxis dataKey="trade" tick={{ fontSize: 10, fill: T.textTer }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: T.textTer }} axisLine={false} tickLine={false} tickFormatter={v => fmtK(v)} width={52} />
            <Tooltip contentStyle={ttStyle} formatter={v => [fmtK(v)]} />
            <Area type="monotone" dataKey="upper" stroke="none" fill={T.accent} fillOpacity={0.08} />
            <Area type="monotone" dataKey="lower" stroke="none" fill={T.bg} fillOpacity={1} />
            <Line type="monotone" dataKey="equity" stroke={T.accent} strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Monte Carlo 1000× */}
      <Card title="Monte Carlo simulation — 1,000 paths" sub="P10 / median / P90">
        {mc.result.length > 1 ? (
          <>
            <div style={{ display: 'flex', gap: 20, marginBottom: 10, fontSize: 12, color: T.textSec }}>
              {[['P10 (worst 10%)', T.red], ['Median', T.text], ['P90 (best 10%)', T.accent]].map(([lbl, col]) => (
                <span key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 14, height: 2, background: col, display: 'inline-block', borderRadius: 1 }} />{lbl}
                </span>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={mc.result} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="trade" tick={{ fontSize: 10, fill: T.textTer }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: T.textTer }} axisLine={false} tickLine={false} tickFormatter={v => fmtK(v)} width={52} />
                <Tooltip contentStyle={ttStyle} formatter={(v, n) => [fmtK(v), n]} />
                {(mc.sampledPaths || []).slice(0, 40).map((path, i) => (
                  <Line key={`g${i}`} data={path} dataKey="v" stroke="rgba(0,0,0,0.03)" strokeWidth={1} dot={false} isAnimationActive={false} legendType="none" />
                ))}
                <Line dataKey="p10"    stroke={T.red}    strokeWidth={2} dot={false} name="P10" />
                <Line dataKey="median" stroke={T.text}   strokeWidth={2} dot={false} name="Median" />
                <Line dataKey="p90"    stroke={T.accent} strokeWidth={2} dot={false} name="P90" />
              </LineChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textTer }}>Insufficient trades</div>
        )}
      </Card>

      {/* Future projection */}
      <Card title="Future performance projection" sub="Next 50 trades — P10 / median / P90 based on historical data">
        {projection.length > 1 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={projection} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="step" tick={{ fontSize: 10, fill: T.textTer }} axisLine={false} tickLine={false}
                label={{ value: 'Future trades', position: 'insideBottomRight', offset: -8, fontSize: 11, fill: T.textTer }} />
              <YAxis tick={{ fontSize: 10, fill: T.textTer }} axisLine={false} tickLine={false} tickFormatter={v => fmtK(v)} width={52} />
              <Tooltip contentStyle={ttStyle} formatter={(v, n) => [fmtK(v), n]} />
              <Line dataKey="p10"    stroke={T.red}    strokeWidth={1.5} dot={false} name="P10"    strokeDasharray="4 2" />
              <Line dataKey="median" stroke={T.accent} strokeWidth={2}   dot={false} name="Median" />
              <Line dataKey="p90"    stroke={T.green}  strokeWidth={1.5} dot={false} name="P90"    strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textTer }}>Insufficient data</div>
        )}
      </Card>

      {/* Monthly return matrix */}
      <Card title="Monthly returns" sub="Year × month breakdown">
        <MonthlyMatrix trades={trades} />
      </Card>

      {/* Daily histogram + Yearly bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="Daily returns distribution" sub="Histogram of daily P&L">
          {histogram.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={histogram} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: T.textTer }} axisLine={false} tickLine={false}
                  interval={Math.max(1, Math.floor(histogram.length / 8))} />
                <YAxis tick={{ fontSize: 10, fill: T.textTer }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={ttStyle} formatter={v => [`${v} days`, 'Count']} />
                <Bar dataKey="count" fill={T.accent} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textTer }}>Insufficient daily data</div>
          )}
        </Card>

        <Card title="Yearly returns" sub="P&L per year">
          {yearlyReturns.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={yearlyReturns} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textTer }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: T.textTer }} axisLine={false} tickLine={false} tickFormatter={v => fmtK(v)} width={52} />
                <Tooltip contentStyle={ttStyle} formatter={(v, n, { payload }) => [fmtK(payload.pnl), 'P&L']} />
                <ReferenceLine y={0} stroke="rgba(0,0,0,0.15)" />
                <Bar dataKey="pnl" fill={T.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textTer }}>Insufficient data</div>
          )}
        </Card>
      </div>
    </div>
  );
}
