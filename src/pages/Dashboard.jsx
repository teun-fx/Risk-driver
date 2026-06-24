import { useState, useMemo } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  ReferenceLine, ComposedChart,
} from 'recharts';
import { DARK as t } from '../theme';
import {
  netPL, winRate, avgWin, avgLoss, profitFactor, sharpeRatio,
  maxDrawdown, equityCurve, dailyReturns, monthlyStats,
  annualizedReturn, ytdReturn, avgMonthlyReturnAmt,
  sortinoRatio, calmarRatio, annVolatility, skewnessOf, kurtosisOf,
  expectancyDollar, assetAllocation, avgDrawdownPct, avgDrawdownLength,
  tradingDaysCount, totalLots,
  rollingReturnsData, rollingSharpeData, rollingSortinoData,
  underwaterCurve, monteCarlo, riskOfRuin, pLosingStreak,
} from '../utils/tradeStats.js';

// ─── Formatting helpers ───────────────────────────────────────────────────────

const fmtUSD = (v, dec = 2) =>
  v == null ? '—' : `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })}`;
const fmtPct = (v, dec = 2) =>
  v == null ? '—' : `${v >= 0 ? '+' : ''}${Number(v).toFixed(dec)}%`;
const fmtNum = (v, dec = 2) =>
  v == null ? '—' : Number(v).toFixed(dec);
const fmtK  = (v) =>
  v == null ? '—' : v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v);
const shortDate = (d) => {
  if (!d || d.length < 7) return '';
  const [y, m] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m, 10) - 1]} '${y.slice(2)}`;
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CHART_COLORS = [
  '#30D158','#64D2FF','#FF9F0A','#FF453A','#BF5AF2','#FFD60A',
  '#32ADE6','#FF6961','#5AC8FA','#34C759','#AF52DE','#FF9500',
];

// ─── Time filter logic ────────────────────────────────────────────────────────

const TIME_FILTERS = ['1D','1W','1M','6M','1Y','MAX'];

function filterByPeriod(trades, period) {
  if (period === 'MAX') return trades;
  const days = { '1D': 1, '1W': 7, '1M': 30, '6M': 180, '1Y': 365 }[period];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return trades.filter(t => t.date >= cutoffStr);
}

// ─── Small reusable components ────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: t.textTer, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 14 }}>
      {children}
    </div>
  );
}

function InfoTip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{
          width: 16, height: 16, borderRadius: '50%',
          background: t.cardInner, border: `1px solid ${t.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'default', fontSize: 9, fontWeight: 700, color: t.textSec,
          flexShrink: 0, userSelect: 'none',
        }}
      >i</div>
      {show && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%',
          transform: 'translateX(-50%)',
          background: t.text, color: t.card,
          fontSize: 11, lineHeight: 1.5, padding: '7px 10px',
          borderRadius: 8, whiteSpace: 'normal', width: 220,
          zIndex: 100, pointerEvents: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        }}>{text}</div>
      )}
    </div>
  );
}

function SectionHeader({ label, info }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: t.textTer, letterSpacing: '0.09em', textTransform: 'uppercase' }}>
        {label}
      </div>
      {info && <InfoTip text={info} />}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: t.card, borderRadius: 16, padding: '18px 20px', boxShadow: t.cardShadow, border: `1px solid ${t.border}`, ...style }}>
      {children}
    </div>
  );
}

function MetricVal({ label, value, color, size = 28, sub }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: t.textTer, marginBottom: 8, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: size, fontWeight: 700, color: color || t.text, letterSpacing: '-0.5px', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: t.textTer, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function EmptyState({ onNav }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
      <div style={{ fontSize: 15, color: t.textSec, fontWeight: 500 }}>No trade data available</div>
      <div style={{ fontSize: 13, color: t.textTer }}>Add an account with a CSV to see your analytics</div>
      <button onClick={() => onNav?.('accounts')} style={{
        marginTop: 8, padding: '10px 22px', borderRadius: 10, border: 'none',
        background: t.accent, color: '#000', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer',
      }}>Go to Accounts</button>
    </div>
  );
}

// Custom tooltip for charts
function ChartTooltip({ active, payload, label, prefix = '', suffix = '', color }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 8, padding: '8px 12px', boxShadow: t.cardShadow }}>
      <div style={{ fontSize: 11, color: t.textTer, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: color || t.accent }}>
        {prefix}{Number(payload[0].value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{suffix}
      </div>
    </div>
  );
}

// ─── Section: KPI cards ───────────────────────────────────────────────────────

function KpiCards({ trades, startBal }) {
  const totalPL  = netPL(trades);
  const wr       = winRate(trades);
  const annRet   = annualizedReturn(trades, startBal);
  const maxDD    = maxDrawdown(trades, startBal);

  const kpis = [
    {
      label: 'Overall Return',
      value: startBal > 0 ? fmtPct((totalPL / startBal) * 100, 2) : fmtUSD(totalPL, 0),
      color: totalPL >= 0 ? t.accent : t.red,
    },
    {
      label: 'Total Profit',
      value: fmtUSD(totalPL, 2),
      color: totalPL >= 0 ? t.accent : t.red,
    },
    {
      label: 'Max Drawdown',
      value: maxDD ? `${(maxDD * 100).toFixed(2)}%` : '—',
      color: t.red,
    },
    {
      label: 'Win Rate',
      value: wr != null ? `${(wr * 100).toFixed(1)}%` : '—',
      color: wr != null && wr >= 0.5 ? t.accent : t.red,
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
      {kpis.map(k => (
        <Card key={k.label} style={{ minWidth: 0 }}>
          <MetricVal label={k.label} value={k.value} color={k.color} size={24} />
        </Card>
      ))}
    </div>
  );
}

// ─── Section: Equity chart ────────────────────────────────────────────────────

function EquitySection({ trades, startBal }) {
  const [timeFilter, setTimeFilter] = useState('MAX');

  const filtered = useMemo(() => filterByPeriod(trades, timeFilter), [trades, timeFilter]);

  const equityData = useMemo(() => {
    const curve = equityCurve(filtered, startBal);
    return curve.map(p => ({
      ...p,
      returnPct: startBal > 0 ? parseFloat(((p.equity - startBal) / startBal * 100).toFixed(2)) : 0,
    }));
  }, [filtered, startBal]);

  const totalPL       = netPL(trades);
  const wr            = winRate(trades);
  const maxDD         = maxDrawdown(trades, startBal);
  const sharpe        = sharpeRatio(trades);
  const ytd           = ytdReturn(trades);
  const avgMo         = avgMonthlyReturnAmt(trades, startBal);
  const annRet        = annualizedReturn(trades, startBal);
  const endBal        = startBal + totalPL;

  const generalMetrics = [
    { label: 'Overall Return',    value: startBal > 0 ? fmtPct((totalPL / startBal) * 100) : fmtUSD(totalPL, 0), color: totalPL >= 0 ? t.accent : t.red },
    { label: 'YTD Return',        value: fmtUSD(ytd, 2),                                                          color: ytd >= 0 ? t.accent : t.red },
    { label: 'Max Drawdown',      value: maxDD ? `${(maxDD * 100).toFixed(2)}%` : '—',                            color: t.red },
    { label: 'Balance',           value: fmtUSD(endBal, 0),                                                       color: t.text },
    { label: 'All-time Sharpe',   value: fmtNum(sharpe),                                                          color: t.text },
    { label: 'Win Rate',          value: wr != null ? `${(wr * 100).toFixed(1)}%` : '—',                          color: wr != null && wr >= 0.5 ? t.accent : t.red },
    { label: 'Total Profit',      value: fmtUSD(totalPL, 2),                                                      color: totalPL >= 0 ? t.accent : t.red },
    { label: 'Avg Monthly Return',value: fmtUSD(avgMo, 0),                                                        color: avgMo != null && avgMo >= 0 ? t.accent : t.red },
  ];

  const gradientId = 'equityGrad';

  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <SectionHeader label="Equity / Balance" info="Cumulative return over time as a percentage of your starting balance. Each point reflects your account equity after a trade." />
        <div style={{ display: 'flex', gap: 4 }}>
          {TIME_FILTERS.map(f => (
            <button key={f} onClick={() => setTimeFilter(f)} style={{
              padding: '4px 10px', borderRadius: 6, border: `1px solid ${timeFilter === f ? t.accent : t.border}`,
              background: timeFilter === f ? 'rgba(161,213,51,0.1)' : 'transparent',
              color: timeFilter === f ? t.brand : t.textTer,
              fontFamily: 'inherit', fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}>{f}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 24 }}>
        {/* Chart */}
        <div style={{ height: 240 }}>
          {equityData.length <= 1 ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${t.border}`, borderRadius: 12 }}>
              <span style={{ fontSize: 13, color: t.textTer }}>Select an account with trade data to see the equity curve</span>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={t.accent} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={t.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: t.textTer }} tickLine={false} axisLine={false}
                tickFormatter={d => shortDate(d)} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: t.textTer }} tickLine={false} axisLine={false}
                tickFormatter={v => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`} width={48} />
              <Tooltip content={<ChartTooltip suffix="%" color={t.accent} />} />
              <Area type="monotone" dataKey="returnPct" stroke={t.accent} strokeWidth={1.5}
                fill={`url(#${gradientId})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>

        {/* General metrics sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignContent: 'start' }}>
          {generalMetrics.map(m => (
            <div key={m.label}>
              <div style={{ fontSize: 10, color: t.textTer, marginBottom: 2, fontWeight: 500, letterSpacing: '0.03em' }}>{m.label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ─── Section: Extended metrics grid ──────────────────────────────────────────

function ExtendedMetrics({ trades, startBal }) {
  const wr      = winRate(trades);
  const aw      = avgWin(trades);
  const al      = avgLoss(trades);
  const pf      = profitFactor(trades);
  const sortino = sortinoRatio(trades);
  const calmar  = calmarRatio(trades, startBal);
  const vol     = annVolatility(trades);
  const skew    = skewnessOf(trades);
  const kurt    = kurtosisOf(trades);
  const exp$    = expectancyDollar(trades);
  const avgDD   = avgDrawdownPct(trades, startBal);
  const avgDDL  = avgDrawdownLength(trades, startBal);
  const lots    = totalLots(trades);
  const days    = tradingDaysCount(trades);
  const maxDD   = maxDrawdown(trades, startBal);
  const annRet  = annualizedReturn(trades, startBal);

  const metrics = [
    { label: 'Total Trades',      value: trades.length > 0 ? String(trades.length) : '—' },
    { label: 'Total Volume',      value: lots ? `${lots} lots` : '—' },
    { label: 'Avg Hold Period',   value: '—',          hint: 'needs timestamps' },
    { label: 'Trading Days',      value: days > 0 ? String(days) : '—' },
    { label: 'Avg Loss / Profit', value: aw && al ? `${(al / aw * 100).toFixed(0)}%` : '—' },
    { label: 'Profit Factor',     value: fmtNum(pf),   color: pf != null && pf >= 1 ? t.accent : t.red },
    { label: 'Sortino',           value: fmtNum(sortino), color: sortino != null && sortino > 0 ? t.accent : t.red },
    { label: 'Calmar',            value: fmtNum(calmar), color: calmar != null && calmar > 0 ? t.accent : t.red },
    { label: 'Ann. Volatility',   value: vol != null ? `${(vol / Math.abs(netPL(trades) || 1) * 100).toFixed(1)}%` : '—' },
    { label: 'VaR',               value: '—', hint: 'requires daily series' },
    { label: 'cVaR',              value: '—', hint: 'requires daily series' },
    { label: 'Avg Drawdown',      value: avgDD ? `${avgDD.toFixed(2)}%` : '—', color: t.red },
    { label: 'Avg DD Length',     value: avgDDL > 0 ? `${avgDDL} trades` : '—' },
    { label: 'Smart Sharpe',      value: '—' },
    { label: 'Smart Sortino',     value: '—' },
    { label: 'Treynor',           value: '—' },
    { label: 'R-squared',         value: '—' },
    { label: 'Skew',              value: fmtNum(skew), color: skew != null && skew > 0 ? t.accent : skew != null ? t.red : t.textSec },
    { label: 'Kurtosis',          value: fmtNum(kurt) },
    { label: 'Expectancy',        value: fmtUSD(exp$), color: exp$ != null && exp$ > 0 ? t.accent : t.red },
  ];

  return (
    <Card style={{ marginBottom: 20 }}>
      <SectionHeader label="General Metrics" info="Advanced risk-adjusted performance statistics calculated from your full trade history." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 20 }}>
        {metrics.map(m => (
          <div key={m.label} style={{ borderBottom: `1px solid ${t.border}`, paddingBottom: 12 }}>
            <div style={{ fontSize: 10, color: t.textTer, marginBottom: 4, fontWeight: 500, letterSpacing: '0.03em' }}>
              {m.label}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: m.color || t.text }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Section: Monthly calendar ────────────────────────────────────────────────

function MonthlyCalendar({ trades, startBal }) {
  const stats = useMemo(() => monthlyStats(trades, startBal), [trades, startBal]);

  const years = [...new Set(Object.keys(stats).map(k => k.slice(0, 4)))].sort((a, b) => b - a);

  if (!years.length) {
    return (
      <Card>
        <SectionHeader label="Monthly Calendar" info="Monthly P&L breakdown. Each cell shows the return %, trade count, and win rate for that month. Green = profit, red = loss." />
        <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 13, color: t.textTer }}>No trade data — select an account with a CSV to see monthly returns</div>
      </Card>
    );
  }

  function cellColor(pct) {
    if (pct == null) return 'transparent';
    if (pct >  5)  return 'rgba(45,189,110,0.20)';
    if (pct >  2)  return 'rgba(45,189,110,0.13)';
    if (pct >  0)  return 'rgba(45,189,110,0.08)';
    if (pct > -2)  return 'rgba(240,61,61,0.08)';
    if (pct > -5)  return 'rgba(240,61,61,0.14)';
    return 'rgba(240,61,61,0.22)';
  }

  return (
    <Card>
      <SectionHeader label="Monthly Calendar" info="Monthly P&L breakdown. Each cell shows the return %, trade count, and win rate for that month. Green = profit, red = loss." />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '3px 3px', minWidth: 600, tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ fontSize: 10, color: t.textTer, fontWeight: 600, textAlign: 'left', padding: '0 4px 8px', width: 40 }}></th>
              {MONTH_NAMES.map(m => (
                <th key={m} style={{ fontSize: 10, color: t.textTer, fontWeight: 600, textAlign: 'center', padding: '0 2px 8px' }}>{m}</th>
              ))}
              <th style={{ fontSize: 10, color: t.textTer, fontWeight: 600, textAlign: 'right', padding: '0 4px 8px', width: 64 }}>Year</th>
            </tr>
          </thead>
          <tbody>
            {years.map(year => {
              const yearPnl = Array.from({ length: 12 }, (_, i) => {
                const key = `${year}-${String(i + 1).padStart(2, '0')}`;
                return stats[key]?.pnl || 0;
              }).reduce((s, v) => s + v, 0);
              const yearPct = startBal > 0 ? (yearPnl / startBal) * 100 : 0;

              return (
                <tr key={year}>
                  <td style={{ fontSize: 11, color: t.textSec, fontWeight: 600, padding: '2px 4px', verticalAlign: 'middle' }}>{year}</td>
                  {Array.from({ length: 12 }, (_, i) => {
                    const key  = `${year}-${String(i + 1).padStart(2, '0')}`;
                    const cell = stats[key];
                    return (
                      <td key={i} style={{ padding: '1px' }}>
                        {cell ? (
                          <div style={{
                            background: cellColor(cell.pct),
                            borderRadius: 6, padding: '4px 2px',
                            textAlign: 'center', overflow: 'hidden',
                          }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: cell.pct >= 0 ? t.accent : t.red, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {cell.pct >= 0 ? '+' : ''}{cell.pct.toFixed(1)}%
                            </div>
                            <div style={{ fontSize: 8, color: t.textTer, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fmtK(cell.count)} tr</div>
                            <div style={{ fontSize: 8, color: t.textTer, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cell.winRate}%</div>
                          </div>
                        ) : (
                          <div style={{ background: t.cardInner, borderRadius: 6, padding: '4px 2px', textAlign: 'center', overflow: 'hidden' }}>
                            <div style={{ fontSize: 11, color: t.textTer }}>—</div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td style={{ textAlign: 'right', padding: '2px 4px', fontSize: 12, fontWeight: 600, color: yearPct >= 0 ? t.accent : t.red, verticalAlign: 'middle' }}>
                    {yearPct >= 0 ? '+' : ''}{yearPct.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── Section: Asset allocation ────────────────────────────────────────────────

function AssetAllocation({ trades }) {
  const alloc = useMemo(() => assetAllocation(trades), [trades]);
  if (!alloc.length) {
    return (
      <Card>
        <SectionHeader label="Asset Allocation" info="Distribution of trades by instrument. Shows what percentage of your total trades were placed on each asset." />
        <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 13, color: t.textTer }}>No data</div>
      </Card>
    );
  }
  const max = alloc[0].count;

  return (
    <Card>
      <SectionHeader label="Asset Allocation" info="Distribution of trades by instrument. Shows what percentage of your total trades were placed on each asset." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {alloc.map((item, i) => {
          const pct = ((item.count / trades.length) * 100).toFixed(1);
          return (
            <div key={item.instrument}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: t.text, fontWeight: 500 }}>{item.instrument}</span>
                <span style={{ fontSize: 12, color: t.textSec }}>{pct}%</span>
              </div>
              <div style={{ height: 4, background: t.cardInner, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(item.count / max) * 100}%`, background: CHART_COLORS[i % CHART_COLORS.length], borderRadius: 2 }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Section: Rolling charts ──────────────────────────────────────────────────

function RollingChart({ title, info, data, color, valueLabel, suffix = '' }) {
  if (!data.length) {
    return (
      <Card>
        <SectionHeader label={title} info={info} />
        <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 12, color: t.textTer }}>Not enough data (need 30+ trading days)</span>
        </div>
      </Card>
    );
  }

  const gradId = `grad${title.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <Card>
      <SectionHeader label={title} info={info} />
      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: t.textTer }} tickLine={false} axisLine={false}
              tickFormatter={d => shortDate(d)} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9, fill: t.textTer }} tickLine={false} axisLine={false} width={36} />
            <Tooltip content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 8, padding: '6px 10px' }}>
                  <div style={{ fontSize: 10, color: t.textSec }}>{label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color }}>{payload[0].value}{suffix}</div>
                </div>
              );
            }} />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} fill={`url(#${gradId})`} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function RollingCharts({ trades }) {
  const retData     = useMemo(() => rollingReturnsData(trades, 30), [trades]);
  const sharpeData  = useMemo(() => rollingSharpeData(trades, 30), [trades]);
  const sortinoData = useMemo(() => rollingSortinoData(trades, 30), [trades]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 20 }}>
      <RollingChart title="Rolling Returns (30d)"  info="30-day rolling sum of P&L. Shows how your profitability has evolved over rolling 30-day windows. Rising = consistently profitable phase."  data={retData}     color={t.accent}   suffix="" />
      <RollingChart title="Rolling Sharpe (30d)"   info="30-day rolling Sharpe ratio. Measures return per unit of risk. Above 1.0 is good, above 2.0 is excellent. Negative means losing phase."   data={sharpeData}  color="#4A90D9"    suffix="" />
      <RollingChart title="Rolling Sortino (30d)"  info="30-day rolling Sortino ratio. Like Sharpe but only penalises downside volatility — gives a better picture of how you manage losing trades." data={sortinoData} color="#9B6FD4"    suffix="" />
    </div>
  );
}

// ─── Section: Underwater plot ────────────────────────────────────────────────

function UnderwaterPlot({ trades, startBal }) {
  const data = useMemo(() => underwaterCurve(trades, startBal), [trades, startBal]);
  const currentDD = data.length ? data[data.length - 1].drawdown : 0;
  const maxDD     = data.length ? Math.min(...data.map(d => d.drawdown)) : 0;

  if (!data.length) {
    return (
      <Card style={{ marginBottom: 20 }}>
        <SectionHeader label="Underwater Plot" info="Shows how far your account is below its all-time high at each trade. The deeper the red, the bigger the drawdown at that moment." />
        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 12, color: t.textTer }}>No trade data</span>
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <SectionHeader label="Underwater Plot" info="Shows how far your account is below its all-time high at each trade. The deeper the red, the bigger the drawdown at that moment." />
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: t.textTer, marginBottom: 2 }}>MAX DRAWDOWN</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: t.red }}>{maxDD.toFixed(2)}%</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: t.textTer, marginBottom: 2 }}>CURRENT</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: currentDD < 0 ? t.red : t.accent }}>{currentDD.toFixed(2)}%</div>
          </div>
        </div>
      </div>
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="underwaterGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={t.red} stopOpacity={0.3} />
                <stop offset="95%" stopColor={t.red} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: t.textTer }} tickLine={false} axisLine={false}
              tickFormatter={d => shortDate(d)} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9, fill: t.textTer }} tickLine={false} axisLine={false} width={42}
              tickFormatter={v => `${v.toFixed(0)}%`} />
            <ReferenceLine y={0} stroke={t.border} strokeWidth={1} />
            <Tooltip content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 8, padding: '6px 10px', boxShadow: t.cardShadow }}>
                  <div style={{ fontSize: 10, color: t.textSec }}>{label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: t.red }}>{Number(payload[0].value).toFixed(2)}%</div>
                </div>
              );
            }} />
            <Area type="monotone" dataKey="drawdown" stroke={t.red} strokeWidth={1.5} fill="url(#underwaterGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ─── Section: Monte Carlo ─────────────────────────────────────────────────────

function MonteCarloSection({ trades, startBal }) {
  const mcData = useMemo(() => {
    if (trades.length < 10) return null;
    return monteCarlo(trades, startBal, 200);
  }, [trades, startBal]);

  if (!mcData) {
    return (
      <Card style={{ marginBottom: 20 }}>
        <SectionHeader label="Monte Carlo Simulation" info="Randomly reshuffles your historical trades 200 times to simulate a range of possible outcomes. Shows the 10th percentile (pessimistic), median, and 90th percentile (optimistic) final balances." />
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 12, color: t.textTer }}>Need at least 10 trades</span>
        </div>
      </Card>
    );
  }

  const { result } = mcData;
  const last   = result[result.length - 1] || {};
  const fmtB   = (v) => v == null ? '—' : `$${Math.round(v).toLocaleString('en-US')}`;
  const pct    = (v) => v == null || !startBal ? '—' : `${((v - startBal) / startBal * 100).toFixed(1)}%`;

  const chartData = result.map(r => ({ ...r, band: r.p90 - r.p10 }));

  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <SectionHeader label="Monte Carlo Simulation" info="Randomly reshuffles your historical trades 200 times to simulate a range of possible outcomes. Shows the 10th percentile (pessimistic), median, and 90th percentile (optimistic) final balances." />
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: t.textTer, marginBottom: 2 }}>PESSIMISTIC (P10)</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.red }}>{fmtB(last.p10)} <span style={{ fontSize: 10, fontWeight: 400, color: t.textTer }}>({pct(last.p10)})</span></div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: t.textTer, marginBottom: 2 }}>MEDIAN</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{fmtB(last.median)} <span style={{ fontSize: 10, fontWeight: 400, color: t.textTer }}>({pct(last.median)})</span></div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: t.textTer, marginBottom: 2 }}>OPTIMISTIC (P90)</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.accent }}>{fmtB(last.p90)} <span style={{ fontSize: 10, fontWeight: 400, color: t.textTer }}>({pct(last.p90)})</span></div>
          </div>
        </div>
      </div>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="mcBandGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={t.accent} stopOpacity={0.12} />
                <stop offset="100%" stopColor={t.accent} stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
            <XAxis dataKey="trade" tick={{ fontSize: 9, fill: t.textTer }} tickLine={false} axisLine={false}
              tickFormatter={v => `T${v}`} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9, fill: t.textTer }} tickLine={false} axisLine={false} width={58}
              tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const vals = {};
              payload.forEach(p => { vals[p.dataKey] = p.value; });
              return (
                <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 8, padding: '8px 12px', boxShadow: t.cardShadow }}>
                  <div style={{ fontSize: 10, color: t.textSec, marginBottom: 4 }}>Trade {label}</div>
                  <div style={{ fontSize: 11, color: t.accent }}>P90: {fmtB(vals.p90)}</div>
                  <div style={{ fontSize: 11, color: t.text }}>Median: {fmtB(vals.median)}</div>
                  <div style={{ fontSize: 11, color: t.red }}>P10: {fmtB(vals.p10)}</div>
                </div>
              );
            }} />
            <Area type="monotone" dataKey="p90" stroke="none" fill="url(#mcBandGrad)" dot={false} />
            <Area type="monotone" dataKey="p10" stroke="none" fill={t.card} dot={false} />
            <Line type="monotone" dataKey="p90"    stroke="#4A90D9" strokeWidth={1} strokeDasharray="4 2" dot={false} legendType="none" />
            <Line type="monotone" dataKey="median" stroke={t.accent} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="p10"    stroke={t.red}   strokeWidth={1} strokeDasharray="4 2" dot={false} />
            <ReferenceLine y={startBal} stroke={t.border} strokeDasharray="3 3" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 20, height: 2, background: t.accent }} />
          <span style={{ fontSize: 10, color: t.textSec }}>Median</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 20, height: 2, background: '#4A90D9', borderTop: '2px dashed #4A90D9' }} />
          <span style={{ fontSize: 10, color: t.textSec }}>P90 (optimistic)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 20, height: 2, borderTop: `2px dashed ${t.red}` }} />
          <span style={{ fontSize: 10, color: t.textSec }}>P10 (pessimistic)</span>
        </div>
      </div>
    </Card>
  );
}

// ─── Section: Risk of Ruin ────────────────────────────────────────────────────

function RiskOfRuinSection({ trades, startBal }) {
  const metrics = useMemo(() => {
    const wr  = winRate(trades);
    const aw  = avgWin(trades);
    const al  = avgLoss(trades);
    if (!wr || !aw || !al || !startBal) return null;
    const avgWinR  = aw / al;
    const rPct     = al / startBal;
    const ror50    = riskOfRuin(wr, avgWinR, 1, rPct, 5000, 0.50);
    const ror25    = riskOfRuin(wr, avgWinR, 1, rPct, 5000, 0.25);
    const streak3  = pLosingStreak(wr, 3);
    const streak5  = pLosingStreak(wr, 5);
    const streak7  = pLosingStreak(wr, 7);
    const streak10 = pLosingStreak(wr, 10);
    return { wr, aw, al, avgWinR, rPct, ror50, ror25, streak3, streak5, streak7, streak10 };
  }, [trades, startBal]);

  const fmtProbPct = (v) => v == null ? '—' : `${(v * 100).toFixed(2)}%`;
  const rorColor   = (v) => v == null ? t.text : v < 0.01 ? t.accent : v < 0.05 ? '#FF9F0A' : t.red;

  if (!metrics) {
    return (
      <Card style={{ marginBottom: 20 }}>
        <SectionHeader label="Risk of Ruin" info="Probability-based risk analysis. Risk of Ruin = chance of losing 50% of your account over 200 future trades, based on your historical win rate and risk/reward." />
        <div style={{ padding: '32px 0', textAlign: 'center', fontSize: 13, color: t.textTer }}>Not enough data</div>
      </Card>
    );
  }

  const statRows = [
    { label: 'Risk of Ruin (−50%)', value: fmtProbPct(metrics.ror50), color: rorColor(metrics.ror50) },
    { label: 'Risk of −25%',        value: fmtProbPct(metrics.ror25), color: rorColor(metrics.ror25) },
    { label: 'Avg Risk / Trade',     value: `${(metrics.rPct * 100).toFixed(2)}%`, color: t.text },
    { label: 'Win/Loss Ratio',       value: metrics.avgWinR.toFixed(2), color: metrics.avgWinR >= 1 ? t.accent : t.red },
    { label: '3 Losses in a row',    value: fmtProbPct(metrics.streak3),  color: t.text },
    { label: '5 Losses in a row',    value: fmtProbPct(metrics.streak5),  color: t.text },
    { label: '7 Losses in a row',    value: fmtProbPct(metrics.streak7),  color: t.text },
    { label: '10 Losses in a row',   value: fmtProbPct(metrics.streak10), color: t.textTer },
  ];

  const ruinPct = (metrics.ror50 || 0) * 100;
  const gaugeColor = metrics.ror50 < 0.01 ? t.accent : metrics.ror50 < 0.05 ? '#FF9F0A' : t.red;

  return (
    <Card style={{ marginBottom: 20 }}>
      <SectionHeader label="Risk of Ruin" info="Probability-based risk analysis. Risk of Ruin = chance of losing 50% of your account over 200 future trades, based on your historical win rate and risk/reward." />
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 32, alignItems: 'center' }}>
        {/* Gauge */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: t.textTer, marginBottom: 6 }}>RISK OF RUIN (−50%)</div>
          <div style={{ fontSize: 40, fontWeight: 700, color: gaugeColor, lineHeight: 1 }}>{fmtProbPct(metrics.ror50)}</div>
          <div style={{ marginTop: 10, height: 6, background: t.cardInner, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(ruinPct * 5, 100)}%`, background: gaugeColor, borderRadius: 3, transition: 'width 0.5s' }} />
          </div>
          <div style={{ fontSize: 10, color: t.textTer, marginTop: 5 }}>
            {metrics.ror50 < 0.01 ? 'Very low risk' : metrics.ror50 < 0.05 ? 'Moderate risk' : 'High risk'}
          </div>
        </div>
        {/* Metrics grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {statRows.map(s => (
            <div key={s.label} style={{ borderBottom: `1px solid ${t.border}`, paddingBottom: 10 }}>
              <div style={{ fontSize: 10, color: t.textTer, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ─── Account selector ─────────────────────────────────────────────────────────

function AccountSelector({ accounts, selected, onChange }) {
  const options = accounts.filter(a => a.tradeList?.length > 0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 12, color: t.textSec }}>Account</span>
      <select
        value={selected}
        onChange={e => onChange(e.target.value)}
        style={{
          padding: '7px 12px', background: t.card, border: `1px solid ${t.border}`,
          borderRadius: 9, fontSize: 13, fontFamily: 'inherit', color: t.text,
          outline: 'none', cursor: 'pointer', minWidth: 180,
        }}
      >
        <option value="">Select account</option>
        {accounts.map(a => (
          <option key={a.id} value={a.brokerName}>{a.brokerName} ({a.accountType})</option>
        ))}
      </select>
      {options.length === 0 && (
        <span style={{ fontSize: 11, color: t.textTer }}>No accounts with trade data yet</span>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard({ strategies, accounts, onNav }) {
  const [selectedAccount, setSelectedAccount] = useState(
    () => accounts.find(a => a.tradeList?.length > 0)?.brokerName || ''
  );

  const { activeTrades, startBal } = useMemo(() => {
    const acc = accounts.find(a => a.brokerName === selectedAccount);
    if (acc?.tradeList?.length) {
      return { activeTrades: acc.tradeList, startBal: acc.startingBalance || acc.accountSize || 10000 };
    }
    // Fall back to first strategy with trades
    const s = strategies.find(s => (s.tradeList || []).length > 0);
    return { activeTrades: s?.tradeList || [], startBal: 10000 };
  }, [accounts, strategies, selectedAccount]);

  const currentUser = 'Teun';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const firstTradeDate = useMemo(() => {
    if (!activeTrades.length) return null;
    const dates = activeTrades.map(tr => tr.openDate || tr.date || tr.closeDate).filter(Boolean).sort();
    return dates[0] ? new Date(dates[0]).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
  }, [activeTrades]);
  const liveSince = firstTradeDate;

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: t.text, margin: 0, letterSpacing: '-0.4px' }}>Welcome, {currentUser}</h1>
          <div style={{ fontSize: 12, color: t.textSec, marginTop: 3 }}>{today}</div>
          {liveSince && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.textTer} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span style={{ fontSize: 12, color: t.textTer }}>Strategy live since {liveSince}</span>
            </div>
          )}
        </div>
        <AccountSelector accounts={accounts} selected={selectedAccount} onChange={setSelectedAccount} />
      </div>

      <KpiCards trades={activeTrades} startBal={startBal} />
      <EquitySection trades={activeTrades} startBal={startBal} />
      <ExtendedMetrics trades={activeTrades} startBal={startBal} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 12, marginBottom: 20 }}>
        <MonthlyCalendar trades={activeTrades} startBal={startBal} />
        <AssetAllocation trades={activeTrades} />
      </div>

      <RiskOfRuinSection trades={activeTrades} startBal={startBal} />
      <UnderwaterPlot trades={activeTrades} startBal={startBal} />
      <MonteCarloSection trades={activeTrades} startBal={startBal} />
      <RollingCharts trades={activeTrades} />
    </div>
  );
}
