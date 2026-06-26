import { useState } from 'react';
import PropFirmAnalysis from './strategies/PropFirmAnalysis.jsx';
import { DARK as t } from '../theme';

const DEFAULT_ANALYSIS = {
  id: '__default__',
  name: 'Example Analysis',
  firmLabel: 'Custom',
  rules: { maxDailyDD: 5, maxTotalDD: 10, target: 10, accountSize: 100_000 },
  strategyId: null,
};

function InfoBanner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: t.rowBg, border: `1px solid ${t.border}`, borderRadius: 10, marginBottom: 20 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.textTer} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span style={{ fontSize: 12, color: t.textTer }}>No trade data loaded — connect a strategy or account to activate calculations</span>
    </div>
  );
}

export default function PropFirmPage({ strategies }) {
  const [selectedStrategyId, setSelectedStrategyId] = useState('');

  const selectedStrategy = strategies.find(s => s.id === Number(selectedStrategyId) || s.id === selectedStrategyId) || null;
  const hasData = selectedStrategy && (selectedStrategy.tradeList || []).length > 0;

  const analysis = {
    ...DEFAULT_ANALYSIS,
    strategyId: selectedStrategy?.id || null,
    rules: {
      ...DEFAULT_ANALYSIS.rules,
      accountSize: selectedStrategy?.accountSize || selectedStrategy?.startingBalance || 100_000,
    },
  };

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', overflowX: 'hidden', background: t.appBg }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: t.text, margin: 0, letterSpacing: '-0.4px' }}>Prop Firm Analysis</h1>
          <div style={{ fontSize: 12, color: t.textSec, marginTop: 3 }}>Simulate your strategy against prop firm rules</div>
        </div>

        {/* Strategy selector */}
        <div>
          <div style={{ fontSize: 12, color: t.textSec, marginBottom: 5 }}>Strategy</div>
          <select
            value={selectedStrategyId}
            onChange={e => setSelectedStrategyId(e.target.value)}
            style={{
              height: 36, border: `1px solid ${t.border}`, borderRadius: 8,
              background: t.card, fontSize: 13, color: t.text, padding: '0 12px',
              outline: 'none', fontFamily: 'inherit', minWidth: 200,
            }}
          >
            <option value="">— No strategy —</option>
            {strategies.map(s => (
              <option key={s.id} value={s.id}>{s.name || s.brokerName || `Strategy ${s.id}`}</option>
            ))}
          </select>
        </div>
      </div>

      {!hasData && <InfoBanner />}

      <PropFirmAnalysis analysis={analysis} strategy={selectedStrategy} />
    </div>
  );
}
