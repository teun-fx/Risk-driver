import { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { DARK as t } from '../theme';

// ─── dummy data ───────────────────────────────────────────────────────────────
function genEquity() {
  const data = []; let val = 100000;
  for (let i = 90; i >= 0; i--) {
    val += (Math.random() - 0.38) * 800;
    data.push({ day: 90 - i, value: Math.round(val) });
  }
  return data;
}
const EQUITY = genEquity();

const MONTHLY = [
  { month: 'Jan', ret: 3.2 }, { month: 'Feb', ret: -1.1 }, { month: 'Mar', ret: 5.4 },
  { month: 'Apr', ret: 2.7 }, { month: 'May', ret: -0.8 }, { month: 'Jun', ret: 1.9 },
  { month: 'Jul', ret: 4.1 }, { month: 'Aug', ret: -2.3 }, { month: 'Sep', ret: 3.8 },
  { month: 'Oct', ret: 1.2 }, { month: 'Nov', ret: 5.1 }, { month: 'Dec', ret: 2.6 },
];

const YEARLY = [
  { year: '2023', ret: 18.4 }, { year: '2024', ret: 24.7 }, { year: '2025', ret: 21.3 }, { year: '2026', ret: 9.8 },
];

const HISTOGRAM = [
  { bin: '-3R+', count: 2 }, { bin: '-2R', count: 8 }, { bin: '-1R', count: 22 },
  { bin: '0', count: 5 }, { bin: '+1R', count: 18 }, { bin: '+2R', count: 14 },
  { bin: '+3R+', count: 7 },
];

const UNDERWATER = EQUITY.map((d, i) => {
  const peak = Math.max(...EQUITY.slice(0, i + 1).map(e => e.value));
  return { day: d.day, value: Math.min(0, ((d.value - peak) / peak) * 100) };
});

const MONTHLY_MATRIX = {
  2025: { Jan: 3.2, Feb: -1.1, Mar: 5.4, Apr: 2.7, May: -0.8, Jun: 1.9, Jul: 4.1, Aug: -2.3, Sep: 3.8, Oct: 1.2, Nov: 5.1, Dec: 2.6 },
  2026: { Jan: 2.1, Feb: -0.5, Mar: 3.8, Apr: 1.9, May: -1.2, Jun: 1.1, Jul: null, Aug: null, Sep: null, Oct: null, Nov: null, Dec: null },
};
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const METRICS = [
  { label: 'Win Rate',        value: '62.4%',  pos: true  },
  { label: 'Profit Factor',   value: '2.31',   pos: true  },
  { label: 'Expectancy',      value: '+0.42R', pos: true  },
  { label: 'Net Profit',      value: '+$3,420',pos: true  },
  { label: 'Sharpe Ratio',    value: '1.84',   pos: true  },
  { label: 'Sortino Ratio',   value: '2.67',   pos: true  },
  { label: 'Max Drawdown',    value: '-4.2%',  pos: false },
  { label: 'Recovery Factor', value: '3.12',   pos: true  },
];

const chartTooltipStyle = {
  contentStyle: { background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, color: t.text, boxShadow: t.cardShadow },
  labelStyle: { color: t.textSec, fontSize: 12 },
};

export default function Statistics({ strategies = [] }) {
  const [selectedStrategy, setSelectedStrategy] = useState('');

  return (
    <div style={{ padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: t.text, margin: 0, letterSpacing: '-0.5px' }}>Statistics</h1>
          <div style={{ fontSize: 13, color: t.textSec, marginTop: 4 }}>Detailed performance analysis</div>
        </div>
        <select
          value={selectedStrategy}
          onChange={e => setSelectedStrategy(e.target.value)}
          style={{
            padding: '9px 16px', background: t.card, border: `1px solid ${t.cardBorder}`,
            borderRadius: 12, color: t.text, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="">All Strategies</option>
          {strategies.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      {/* Metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {METRICS.map(m => (
          <div key={m.label} style={{ background: t.card, borderRadius: 18, padding: '18px 20px' }}>
            <div style={{ fontSize: 12, color: t.textSec, marginBottom: 8 }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: m.pos ? t.accent : t.red, letterSpacing: '-0.3px' }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Equity Curve */}
      <div style={{ background: t.card, borderRadius: 18, padding: '20px 22px' }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: t.text, marginBottom: 16 }}>Equity Curve</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={EQUITY} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="greenGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={t.accent} stopOpacity={0.3} />
                <stop offset="95%" stopColor={t.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
            <XAxis dataKey="day" stroke={t.border} tick={{ fill: t.textTer, fontSize: 11 }} tickLine={false} />
            <YAxis stroke={t.border} tick={{ fill: t.textTer, fontSize: 11 }} />
            <Tooltip {...chartTooltipStyle} formatter={v => [`$${v.toLocaleString()}`, 'Equity']} />
            <Area type="monotone" dataKey="value" stroke={t.accent} strokeWidth={2} fill="url(#greenGrad2)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Drawdown Curve */}
      <div style={{ background: t.card, borderRadius: 18, padding: '20px 22px' }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: t.text, marginBottom: 16 }}>Drawdown Curve</div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={UNDERWATER} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={t.red} stopOpacity={0.4} />
                <stop offset="95%" stopColor={t.red} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
            <XAxis dataKey="day" stroke={t.border} tick={{ fill: t.textTer, fontSize: 11 }} tickLine={false} />
            <YAxis stroke={t.border} tick={{ fill: t.textTer, fontSize: 11 }} tickFormatter={v => `${v.toFixed(1)}%`} />
            <Tooltip {...chartTooltipStyle} formatter={v => [`${v.toFixed(2)}%`, 'Drawdown']} />
            <Area type="monotone" dataKey="value" stroke={t.red} strokeWidth={2} fill="url(#redGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Return Matrix */}
      <div style={{ background: t.card, borderRadius: 18, padding: '20px 22px' }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: t.text, marginBottom: 16 }}>Monthly Returns</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', fontSize: 11, color: t.textTer, fontWeight: 500, padding: '6px 8px' }}>Year</th>
                {MONTHS.map(m => (
                  <th key={m} style={{ fontSize: 11, color: t.textTer, fontWeight: 500, padding: '6px 8px', textAlign: 'center' }}>{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(MONTHLY_MATRIX).map(([year, months]) => (
                <tr key={year}>
                  <td style={{ fontSize: 13, color: t.textSec, padding: '6px 8px', fontWeight: 500 }}>{year}</td>
                  {MONTHS.map(m => {
                    const v = months[m];
                    return (
                      <td key={m} style={{ padding: '4px 4px', textAlign: 'center' }}>
                        {v != null ? (
                          <div style={{
                            padding: '5px 4px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                            background: v >= 0 ? 'rgba(29,185,84,0.15)' : 'rgba(229,55,61,0.15)',
                            color: v >= 0 ? t.accent : t.red,
                          }}>
                            {v >= 0 ? '+' : ''}{v.toFixed(1)}%
                          </div>
                        ) : (
                          <div style={{ padding: '5px 4px', fontSize: 12, color: t.textTer }}>—</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Daily Returns Histogram */}
        <div style={{ background: t.card, borderRadius: 18, padding: '20px 22px' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: t.text, marginBottom: 16 }}>Daily Returns Distribution</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={HISTOGRAM} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
              <XAxis dataKey="bin" stroke={t.border} tick={{ fill: t.textTer, fontSize: 11 }} tickLine={false} />
              <YAxis stroke={t.border} tick={{ fill: t.textTer, fontSize: 11 }} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {HISTOGRAM.map((entry, i) => (
                  <Cell key={i} fill={entry.bin.startsWith('-') ? t.red : entry.bin === '0' ? t.textTer : t.accent} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Yearly Returns */}
        <div style={{ background: t.card, borderRadius: 18, padding: '20px 22px' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: t.text, marginBottom: 16 }}>Yearly Returns</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={YEARLY} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
              <XAxis dataKey="year" stroke={t.border} tick={{ fill: t.textTer, fontSize: 11 }} tickLine={false} />
              <YAxis stroke={t.border} tick={{ fill: t.textTer, fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <Tooltip {...chartTooltipStyle} formatter={v => [`${v}%`, 'Return']} />
              <Bar dataKey="ret" fill={t.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
