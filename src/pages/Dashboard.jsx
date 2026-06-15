import { useState, useMemo } from 'react';
import { useTheme } from '../ThemeContext';
import InsightsTab  from './dashboard/InsightsTab';
import AnalyticsTab from './dashboard/AnalyticsTab';

const TABS = [
  { id: 'insights',  label: 'Insights' },
  { id: 'analytics', label: 'Analytics' },
];

// ─── empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onNav }) {
  const t = useTheme();
  return (
    <div style={{ padding: '36px 40px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 600, color: t.text, margin: '0 0 28px', letterSpacing: '-0.4px' }}>Dashboard</h1>
      <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 18, padding: '80px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>◈</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: t.text, marginBottom: 8 }}>No strategies yet</div>
        <div style={{ fontSize: 14, color: t.textSec, maxWidth: 380, margin: '0 auto 28px', lineHeight: 1.6 }}>
          Add a strategy with trade data first, then come back here to explore insights and analytics.
        </div>
        <button onClick={() => onNav('strategies')} style={{
          padding: '11px 28px', background: '#A1D533', color: '#1D1D1F',
          border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>Go to Strategies →</button>
      </div>
    </div>
  );
}

// ─── strategy selector ────────────────────────────────────────────────────────
function StrategySelector({ strategies, selectedId, onChange }) {
  const t = useTheme();
  const selected = strategies.find(s => s.id === selectedId) || strategies[0];
  if (!strategies.length) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 13, color: t.textSec }}>Strategy:</span>
      <div style={{ position: 'relative' }}>
        <select
          value={selectedId}
          onChange={e => { const v = e.target.value; onChange(isNaN(Number(v)) ? v : Number(v)); }}
          style={{
            appearance: 'none', padding: '8px 36px 8px 14px', border: `1px solid ${t.cardBorder}`,
            borderRadius: 10, background: t.card, color: t.text, fontSize: 14,
            fontFamily: 'inherit', fontWeight: 500, cursor: 'pointer', outline: 'none', minWidth: 200,
          }}
        >
          {strategies.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 11, color: t.textSec }}>▾</span>
      </div>
      {selected && (
        <span style={{ fontSize: 12, color: t.textSec }}>
          {(selected.tradeList || []).length} trades
          {selected.startingBalance ? ` · $${selected.startingBalance.toLocaleString()} start` : ''}
        </span>
      )}
    </div>
  );
}

// ─── tab nav ──────────────────────────────────────────────────────────────────
function TabNav({ active, onChange }) {
  const t = useTheme();
  return (
    <div style={{ display: 'flex', gap: 4, padding: '4px', background: t.rowBg, borderRadius: 12, width: 'fit-content' }}>
      {TABS.map(tab => {
        const isActive = tab.id === active;
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)} style={{
            padding: '8px 20px', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13, fontWeight: isActive ? 600 : 400,
            background: isActive ? t.card : 'transparent',
            color: isActive ? t.text : t.textSec,
            boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s',
          }}>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── summary metric strip ─────────────────────────────────────────────────────
function MetricStrip({ trades, startBal }) {
  const t = useTheme();
  if (!trades.length) return null;

  const netPL  = trades.reduce((s, tr) => s + (tr.profit || 0), 0);
  const wins   = trades.filter(tr => (tr.profit || 0) > 0).length;
  const losses = trades.filter(tr => (tr.profit || 0) < 0).length;
  const wr     = (wins + losses) > 0 ? wins / (wins + losses) : null;
  const grossW = trades.filter(tr => (tr.profit || 0) > 0).reduce((s, tr) => s + tr.profit, 0);
  const grossL = Math.abs(trades.filter(tr => (tr.profit || 0) < 0).reduce((s, tr) => s + tr.profit, 0));
  const pf     = grossL > 0 ? grossW / grossL : null;
  let peak = startBal, running = startBal, maxDD = 0;
  trades.forEach(tr => {
    running += tr.profit || 0;
    if (running > peak) peak = running;
    if (peak !== 0) { const dd = (running - peak) / Math.abs(peak) * 100; if (dd < maxDD) maxDD = dd; }
  });

  const metrics = [
    { label: 'Net P&L',       value: `${netPL >= 0 ? '+' : ''}$${Math.round(Math.abs(netPL)).toLocaleString()}`, color: netPL >= 0 ? '#34C759' : '#FF3B30' },
    { label: 'Win rate',      value: wr != null ? `${(wr * 100).toFixed(1)}%` : '—', color: wr != null && wr >= 0.5 ? '#34C759' : '#FF9500' },
    { label: 'Profit factor', value: pf != null ? pf.toFixed(2) : '—', color: pf != null && pf >= 1.5 ? '#34C759' : pf != null && pf >= 1 ? t.textSec : '#FF3B30' },
    { label: 'Max drawdown',  value: `${maxDD.toFixed(1)}%`, color: '#FF3B30' },
    { label: 'Trades',        value: String(trades.length) },
  ];

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {metrics.map(m => (
        <div key={m.label} style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 12, padding: '10px 16px', minWidth: 110 }}>
          <div style={{ fontSize: 11, color: t.textSec, marginBottom: 4 }}>{m.label}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: m.color || t.text }}>{m.value}</div>
        </div>
      ))}
    </div>
  );
}

// ─── main export ───────────────────────────────────────────────────────────────
export default function Dashboard({ strategies, onNav, initialTab }) {
  const t = useTheme();
  const [selectedId, setSelectedId] = useState(strategies[0]?.id ?? null);
  const [activeTab, setActiveTab]   = useState(initialTab || 'insights');

  const validId = useMemo(() => {
    if (strategies.find(s => s.id === selectedId)) return selectedId;
    return strategies[0]?.id ?? null;
  }, [strategies, selectedId]);

  const selectedStrategy = useMemo(() => strategies.find(s => s.id === validId) || null, [strategies, validId]);
  const trades   = useMemo(() => selectedStrategy?.tradeList || [], [selectedStrategy]);
  const startBal = useMemo(() => selectedStrategy?.startingBalance || selectedStrategy?.equity || 10000, [selectedStrategy]);

  if (!strategies || strategies.length === 0) return <EmptyState onNav={onNav} />;

  return (
    <div style={{ padding: '32px 36px', minHeight: '100vh', background: t.appBg }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: t.text, margin: 0, letterSpacing: '-0.4px' }}>Dashboard</h1>
          <div style={{ fontSize: 13, color: t.textSec, marginTop: 3 }}>Statistical insights and analytics for your strategy</div>
        </div>
        <StrategySelector strategies={strategies} selectedId={validId} onChange={setSelectedId} />
      </div>

      {/* Metrics */}
      <div style={{ marginBottom: 20 }}>
        <MetricStrip trades={trades} startBal={startBal} />
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 20 }}>
        <TabNav active={activeTab} onChange={setActiveTab} />
      </div>

      {/* Content */}
      {activeTab === 'insights'  && <InsightsTab  trades={trades} startBal={startBal} />}
      {activeTab === 'analytics' && <AnalyticsTab trades={trades} startBal={startBal} />}
    </div>
  );
}
