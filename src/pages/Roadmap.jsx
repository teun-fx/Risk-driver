import { useState } from 'react';
import { DARK as t } from '../theme';

// ─── Math helpers ─────────────────────────────────────────────────────────────

function computeStats(strategy) {
  if (!strategy) return null;
  const trades = strategy.tradeList || [];
  if (trades.length === 0) return null;

  const wins   = trades.filter(tr => (tr.profit || 0) > 0);
  const losses = trades.filter(tr => (tr.profit || 0) < 0);
  const winRate   = (wins.length + losses.length) > 0 ? wins.length / (wins.length + losses.length) : 0;
  const avgWinPct = wins.length > 0
    ? wins.reduce((s, tr) => s + (tr.pnlPct || Math.abs(tr.rMultiple ? parseFloat(tr.rMultiple) : 0) || 0), 0) / wins.length
    : 0;
  const avgLossPct = losses.length > 0
    ? Math.abs(losses.reduce((s, tr) => s + (tr.pnlPct || (tr.rMultiple ? Math.abs(parseFloat(tr.rMultiple)) : 0) || 0), 0) / losses.length)
    : 0;

  // If pnlPct not available, estimate from avg profit/loss relative to account
  const avgWinDollar  = wins.length > 0 ? wins.reduce((s, tr) => s + (tr.profit || 0), 0) / wins.length : 0;
  const avgLossDollar = losses.length > 0 ? Math.abs(losses.reduce((s, tr) => s + (tr.profit || 0), 0) / losses.length) : 0;

  return {
    tradeCount: trades.length,
    winRate,
    avgWinDollar,
    avgLossDollar,
    avgWinLossRatio: avgLossDollar > 0 ? avgWinDollar / avgLossDollar : 0,
  };
}

function analyseRoadmap(roadmap, account, strategy) {
  const stats = computeStats(strategy);
  if (!stats || !account) return null;

  const accountSize = account.accountSize || account.balance || 10000;
  const targetDollar = accountSize * (roadmap.targetPct / 100);
  const { winRate, avgWinDollar, avgLossDollar, avgWinLossRatio } = stats;

  const RISK_LEVELS = [0.5, 1, 1.5, 2, 2.5];

  const rows = RISK_LEVELS.map(riskPct => {
    const riskDollar = accountSize * (riskPct / 100);
    const expectancy = winRate * avgWinDollar - (1 - winRate) * avgLossDollar;
    // Estimate trades needed: target / expectancy per trade
    const tradesToTarget = expectancy > 0 ? Math.ceil(targetDollar / expectancy) : null;
    // Estimate days assuming ~1 trade per day on average
    const tradesPerDay = stats.tradeCount > 0
      ? Math.max(1, stats.tradeCount / Math.max(1, daysBetween(strategy)))
      : 1;
    const estDays = tradesToTarget != null ? Math.ceil(tradesToTarget / tradesPerDay) : null;

    // Simple Monte Carlo estimate for chance of hitting target before 25% DD
    const chanceTarget = tradesToTarget != null
      ? Math.min(99, Math.max(1, Math.round(winRate * 100 * (avgWinLossRatio >= 1 ? 1.1 : 0.9))))
      : null;
    // Chance of 25% drawdown based on risk per trade
    const ddBreachRisk = Math.min(95, Math.round(riskPct * 8));
    const recommended = riskPct <= 1.5 && winRate >= 0.5 && avgWinLossRatio >= 1;

    return { riskPct, tradesToTarget, estDays, chanceTarget, ddBreachRisk, recommended };
  });

  return { accountSize, targetDollar, stats, rows };
}

function daysBetween(strategy) {
  const trades = strategy?.tradeList || [];
  if (trades.length < 2) return trades.length;
  const dates = trades.map(tr => tr.date).filter(Boolean).sort();
  if (dates.length < 2) return trades.length;
  const ms = new Date(dates[dates.length - 1]) - new Date(dates[0]);
  return Math.max(1, Math.ceil(ms / 86400000));
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function NewRoadmapModal({ accounts, strategies, onSave, onClose }) {
  const [name, setName]           = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [strategyId, setStrategyId] = useState(strategies[0]?.id ?? '');
  const [targetPct, setTargetPct] = useState('10');

  function handleSave() {
    if (!name.trim()) return;
    onSave({
      id: Date.now(),
      name: name.trim(),
      accountId: accountId !== '' ? Number(accountId) : null,
      strategyId: strategyId !== '' ? Number(strategyId) : null,
      targetPct: parseFloat(targetPct) || 10,
    });
  }

  const canSave = name.trim() && accountId !== '' && strategyId !== '';

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: t.card, borderRadius: 20, width: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: t.text }}>New Roadmap</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: t.textTer, padding: '0 4px', lineHeight: 1 }}>x</button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: t.textSec, marginBottom: 5 }}>Roadmap name</div>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. FTMO Q3 Target"
              style={{ width: '100%', padding: '9px 12px', border: `1px solid ${t.inputBorder}`, borderRadius: 10, background: t.inputBg, fontSize: 13, fontFamily: 'inherit', color: t.text, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: t.textSec, marginBottom: 5 }}>Account</div>
            <select
              value={accountId} onChange={e => setAccountId(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: `1px solid ${t.inputBorder}`, borderRadius: 10, background: t.inputBg, fontSize: 13, fontFamily: 'inherit', color: t.text, outline: 'none' }}
            >
              {accounts.map(a => <option key={a.id} value={a.id}>{a.brokerName} — ${(a.accountSize || 0).toLocaleString()}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: t.textSec, marginBottom: 5 }}>Strategy (for trade data)</div>
            <select
              value={strategyId} onChange={e => setStrategyId(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: `1px solid ${t.inputBorder}`, borderRadius: 10, background: t.inputBg, fontSize: 13, fontFamily: 'inherit', color: t.text, outline: 'none' }}
            >
              {strategies.length === 0
                ? <option value="">No strategies available</option>
                : strategies.map(s => <option key={s.id} value={s.id}>{s.label}</option>)
              }
            </select>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: t.textSec, marginBottom: 5 }}>Profit target (%)</div>
            <div style={{ display: 'flex' }}>
              <input
                type="number" value={targetPct} onChange={e => setTargetPct(e.target.value)}
                placeholder="10"
                style={{ flex: 1, padding: '9px 12px', border: `1px solid ${t.inputBorder}`, borderLeft: 'none', borderRight: 'none', borderRadius: '9px 0 0 9px', borderLeft: `1px solid ${t.inputBorder}`, background: t.inputBg, fontSize: 13, fontFamily: 'inherit', color: t.text, outline: 'none' }}
              />
              <span style={{ padding: '9px 11px', background: t.cardInner, border: `1px solid ${t.inputBorder}`, borderLeft: 'none', borderRadius: '0 9px 9px 0', fontSize: 12, color: t.textSec }}>%</span>
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', border: `1px solid ${t.border}`, borderRadius: 10, background: 'transparent', color: t.textSec, fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={!canSave} style={{
            padding: '9px 18px', border: 'none', borderRadius: 10, background: canSave ? t.accent : t.rowBg,
            color: canSave ? '#000' : t.textSec, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: canSave ? 'pointer' : 'not-allowed',
          }}>Create Roadmap</button>
        </div>
      </div>
    </div>
  );
}

// ─── Analysis display ─────────────────────────────────────────────────────────

function RoadmapAnalysis({ roadmap, account, strategy }) {
  const result = analyseRoadmap(roadmap, account, strategy);

  if (!result) {
    return (
      <div style={{ padding: '60px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: t.textTer, lineHeight: 1.6 }}>
          No trade data available for this strategy.<br />
          Add trades to the strategy to see analysis.
        </div>
      </div>
    );
  }

  const { accountSize, targetDollar, stats, rows } = result;
  const bestRow = rows.find(r => r.recommended) || rows[1];

  return (
    <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Hero card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <div style={{ background: t.card, borderRadius: 16, padding: '20px 22px', border: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 11, color: t.textSec, marginBottom: 6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Profit Target</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: t.accent }}>+{roadmap.targetPct}%</div>
          <div style={{ fontSize: 12, color: t.textTer, marginTop: 4 }}>${targetDollar.toLocaleString('en-US', { maximumFractionDigits: 0 })} on ${accountSize.toLocaleString()}</div>
        </div>
        <div style={{ background: t.card, borderRadius: 16, padding: '20px 22px', border: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 11, color: t.textSec, marginBottom: 6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Est. Days (rec. risk)</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: t.text }}>{bestRow?.estDays ?? '—'}</div>
          <div style={{ fontSize: 12, color: t.textTer, marginTop: 4 }}>at {bestRow?.riskPct}% risk per trade</div>
        </div>
        <div style={{ background: t.card, borderRadius: 16, padding: '20px 22px', border: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 11, color: t.textSec, marginBottom: 6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Win Rate</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: stats.winRate >= 0.5 ? t.accent : t.red }}>{(stats.winRate * 100).toFixed(1)}%</div>
          <div style={{ fontSize: 12, color: t.textTer, marginTop: 4 }}>from {stats.tradeCount} trades</div>
        </div>
      </div>

      {/* Risk table */}
      <div style={{ background: t.card, borderRadius: 16, border: `1px solid ${t.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Risk Level Analysis</div>
          <div style={{ fontSize: 12, color: t.textSec, marginTop: 2 }}>
            Based on {stats.tradeCount} trades from {strategy?.label || 'strategy'}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: t.rowBg }}>
                {['Risk/Trade', 'Trades to Target', 'Est. Days', 'Chance of Target', 'Chance of Breach (25% DD)', 'Recommended'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: t.textTer, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.riskPct} style={{ background: row.recommended ? 'rgba(29,185,84,0.04)' : 'transparent', borderTop: `1px solid ${t.border}` }}>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: t.text }}>{row.riskPct}%</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: t.text }}>{row.tradesToTarget ?? '—'}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: t.text }}>{row.estDays ?? '—'}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: row.chanceTarget >= 60 ? t.accent : t.red }}>
                    {row.chanceTarget != null ? `${row.chanceTarget}%` : '—'}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: row.ddBreachRisk > 40 ? t.red : t.textSec }}>{row.ddBreachRisk}%</td>
                  <td style={{ padding: '12px 14px' }}>
                    {row.recommended ? (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6, background: 'rgba(29,185,84,0.12)', color: t.accent }}>Recommended</span>
                    ) : (
                      <span style={{ fontSize: 11, color: t.textTer }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key stats */}
      <div style={{ background: t.card, borderRadius: 16, padding: '18px 20px', border: `1px solid ${t.border}` }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 14 }}>Key Stats</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: t.textSec, marginBottom: 4 }}>Win Rate</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: stats.winRate >= 0.5 ? t.accent : t.red }}>{(stats.winRate * 100).toFixed(1)}%</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: t.textSec, marginBottom: 4 }}>Avg Win / Loss ratio</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: stats.avgWinLossRatio >= 1 ? t.accent : t.red }}>
              {stats.avgWinLossRatio > 0 ? stats.avgWinLossRatio.toFixed(2) : '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: t.textSec, marginBottom: 4 }}>Trade Count</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: t.text }}>{stats.tradeCount}</div>
          </div>
        </div>
        <div style={{ marginTop: 14, fontSize: 12, color: t.textTer, paddingTop: 12, borderTop: `1px solid ${t.border}` }}>
          Based on {stats.tradeCount} trades from {strategy?.label || 'strategy'}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Roadmap({ accounts = [], strategies = [] }) {
  const [roadmaps, setRoadmaps]       = useState([]);
  const [selectedId, setSelectedId]   = useState(null);
  const [showModal, setShowModal]     = useState(false);

  const selected  = roadmaps.find(r => r.id === selectedId) || null;
  const account   = selected ? accounts.find(a => a.id === selected.accountId) : null;
  const strategy  = selected ? strategies.find(s => s.id === selected.strategyId) : null;

  function addRoadmap(data) {
    setRoadmaps(prev => [...prev, data]);
    setSelectedId(data.id);
    setShowModal(false);
  }

  function deleteRoadmap(id) {
    if (!window.confirm('Delete this roadmap?')) return;
    setRoadmaps(prev => prev.filter(r => r.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.appBg }}>
      {/* Left panel */}
      <div style={{ width: 240, flexShrink: 0, borderRight: `1px solid ${t.border}`, background: t.card, display: 'flex', flexDirection: 'column', padding: '20px 14px', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: t.text }}>Roadmaps</div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '10px 12px', border: `1.5px dashed ${t.border}`, borderRadius: 12,
            background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: t.textSec,
            marginBottom: 4,
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New Roadmap
        </button>

        {roadmaps.length === 0 && (
          <div style={{ fontSize: 13, color: t.textTer, lineHeight: 1.6, padding: '8px 4px' }}>
            Create your first roadmap to plan a path to your profit target.
          </div>
        )}

        {roadmaps.map(rm => {
          const isActive = selectedId === rm.id;
          const acc = accounts.find(a => a.id === rm.accountId);
          return (
            <div
              key={rm.id}
              onClick={() => setSelectedId(rm.id)}
              style={{
                background: isActive ? 'rgba(29,185,84,0.06)' : t.rowBg,
                border: `1.5px solid ${isActive ? t.accent : t.border}`,
                borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rm.name}</div>
                  <div style={{ fontSize: 11, color: t.textSec, marginTop: 3 }}>{acc?.brokerName || 'Account'}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: t.accent, marginTop: 4 }}>+{rm.targetPct}% target</div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deleteRoadmap(rm.id); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textTer, fontSize: 14, padding: '0 2px', flexShrink: 0 }}
                >x</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {selected ? (
          <>
            <div style={{ padding: '24px 32px 0', borderBottom: `1px solid ${t.border}`, background: t.card }}>
              <h1 style={{ fontSize: 22, fontWeight: 600, color: t.text, margin: '0 0 4px', letterSpacing: '-0.4px' }}>{selected.name}</h1>
              <div style={{ fontSize: 13, color: t.textSec, paddingBottom: 16 }}>
                {account?.brokerName} — {strategy?.label || 'No strategy'}
              </div>
            </div>
            <RoadmapAnalysis roadmap={selected} account={account} strategy={strategy} />
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12, padding: 40 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={t.textTer} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="5" cy="18" r="2" />
              <circle cx="19" cy="6" r="2" />
              <path d="M5 16C5 10 10 8 14 8" strokeDasharray="3 2" />
              <path d="M14 8l3-3" />
              <line x1="17" y1="5" x2="21" y2="5" />
              <line x1="19" y1="3" x2="19" y2="7" />
            </svg>
            <div style={{ fontSize: 15, fontWeight: 500, color: t.textSec }}>No roadmap selected</div>
            <div style={{ fontSize: 13, color: t.textTer, textAlign: 'center', maxWidth: 300 }}>
              Create a roadmap to plan your path to a profit target based on your trading data.
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <NewRoadmapModal
          accounts={accounts}
          strategies={strategies}
          onSave={addRoadmap}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
