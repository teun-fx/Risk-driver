import { useState, useRef } from 'react';
import { parseTradeFile } from '../services/csvParser.js';
import PropFirmAnalysis from './strategies/PropFirmAnalysis.jsx';

// ─── design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#F2F2F7', card: '#FFFFFF', border: '#E5E5EA', shadow: '0 1px 3px rgba(0,0,0,0.07)',
  text: '#1D1D1F', textSec: '#6E6E73', textTer: '#AEAEB2',
  accent: '#A1D533', accentText: '#1D1D1F',
  red: '#D63A30', green: '#28B548', divider: '#E5E5EA',
  input: '#F2F2F7', inputBorder: '#E5E5EA',
};

const SOURCE_ICONS = {
  csv: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  ),
  mt4mt5: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
      <polyline points="6,10 9,7 12,10 15,7 18,10" />
    </svg>
  ),
  ctrader: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3,17 9,11 13,14 21,6" />
      <polyline points="15,6 21,6 21,12" />
    </svg>
  ),
  tradelocker: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
      <circle cx="12" cy="16" r="1" />
    </svg>
  ),
  manual: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
};

const SOURCES = [
  { id: 'csv',         label: 'CSV upload'   },
  { id: 'mt4mt5',      label: 'MT4/MT5'      },
  { id: 'ctrader',     label: 'cTrader'      },
  { id: 'tradelocker', label: 'TradeLocker'  },
  { id: 'manual',      label: 'Manual entry' },
];
const SOURCE_LABELS = Object.fromEntries(SOURCES.map(s => [s.id, s.label]));

// ─── shared UI components ─────────────────────────────────────────────────────
function Btn({ children, onClick, variant = 'primary', disabled, style = {} }) {
  const variants = {
    primary:   { background: C.accent, color: C.accentText },
    secondary: { background: C.card, color: C.textSec, border: `1px solid ${C.border}` },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{
      padding: '9px 18px', border: 'none', borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: 13, fontFamily: 'inherit', fontWeight: 600, opacity: disabled ? 0.45 : 1,
      ...variants[variant], ...style,
    }}>{children}</button>
  );
}

function FieldInput({ label, value, onChange, placeholder, suffix, type = 'text' }) {
  return (
    <div>
      {label && <div style={{ fontSize: 12, fontWeight: 500, color: C.textSec, marginBottom: 5 }}>{label}</div>}
      <div style={{ display: 'flex' }}>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || ''}
          style={{
            flex: 1, padding: '9px 12px', border: `1px solid ${C.inputBorder}`,
            borderRadius: suffix ? '9px 0 0 9px' : 9, background: C.input,
            fontSize: 13, color: C.text, fontFamily: 'inherit', outline: 'none',
          }} />
        {suffix && (
          <span style={{ padding: '9px 11px', background: C.bg, border: `1px solid ${C.inputBorder}`, borderLeft: 'none', borderRadius: '0 9px 9px 0', fontSize: 12, color: C.textSec }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── modal shell ──────────────────────────────────────────────────────────────
function Modal({ title, children, footer, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: C.card, borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${C.divider}` }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: C.textTer, padding: '0 4px', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>{children}</div>
        {footer && <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.divider}` }}>{footer}</div>}
      </div>
    </div>
  );
}

// ─── strategy card ─────────────────────────────────────────────────────────────
function StrategyCard({ strategy, isSelected, onClick, onDelete }) {
  const trades = strategy.tradeList || [];
  const netPL  = trades.reduce((s, t) => s + (t.profit || 0), 0);
  const wins   = trades.filter(t => (t.profit || 0) > 0).length;
  const losses = trades.filter(t => (t.profit || 0) < 0).length;
  const wr     = (wins + losses) > 0 ? Math.round(wins / (wins + losses) * 100) : null;
  return (
    <div onClick={onClick} style={{
      background: C.card, border: `1.5px solid ${isSelected ? C.accent : C.border}`,
      borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
      boxShadow: isSelected ? `0 0 0 3px ${C.accent}22` : C.shadow,
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{strategy.label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5, background: '#F0F7E0', color: '#3D7A00' }}>
              {SOURCE_LABELS[strategy.source] || strategy.source}
            </span>
            <span style={{ fontSize: 11, color: C.textSec }}>{trades.length} trades</span>
            {wr !== null && <span style={{ fontSize: 11, color: C.textSec }}>{wr}% WR</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: netPL >= 0 ? C.green : C.red }}>
            {netPL >= 0 ? '+' : ''}${Math.round(Math.abs(netPL)).toLocaleString()}
          </div>
          <button onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: C.textTer, padding: '2px', marginTop: 4, display: 'block', marginLeft: 'auto' }}>×</button>
        </div>
      </div>
    </div>
  );
}

// ─── add strategy modal ───────────────────────────────────────────────────────
function AddStrategyModal({ onSave, onClose }) {
  const [step, setStep] = useState(1);
  const [source, setSource] = useState(null);
  const [label, setLabel] = useState('');
  const [startBal, setStartBal] = useState('');
  const [parsed, setParsed] = useState(null);
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);
  const [manualRows, setManualRows] = useState(
    Array.from({ length: 5 }, () => ({ date: '', instrument: '', direction: 'Long', profit: '', rMultiple: '', result: '' }))
  );
  const fileRef = useRef();

  async function handleFile(file) {
    if (!file) return;
    setImporting(true); setParseError('');
    try {
      const text = await file.text();
      const result = parseTradeFile(text, file.name);
      if (!result?.trades?.length) { setParseError('No trades found. Check the file format.'); }
      else { setParsed(result); if (!label) setLabel(file.name.replace(/\.[^.]+$/, '')); }
    } catch (err) { setParseError('Parse error: ' + (err?.message || 'Unknown error')); }
    setImporting(false);
  }

  function handleSave() {
    if (!label.trim()) return;
    const bal = parseFloat(startBal) || null;
    let tradeList = [];
    if (source === 'csv' && parsed) tradeList = parsed.trades || [];
    else if (source === 'manual') {
      tradeList = manualRows.filter(r => r.date || r.profit).map(r => ({
        date: r.date || '', instrument: r.instrument || '—', direction: r.direction || 'Long',
        profit: parseFloat(r.profit) || 0,
        rMultiple: r.rMultiple !== '' ? parseFloat(r.rMultiple) : null,
        result: r.result || (parseFloat(r.profit) > 0 ? 'Win' : parseFloat(r.profit) < 0 ? 'Loss' : 'Break-even'),
      }));
    }
    const netPL = tradeList.reduce((s, t) => s + (t.profit || 0), 0);
    onSave({
      id: Date.now(), label: label.trim(), source,
      startingBalance: bal,
      equity: bal !== null ? Math.round(bal + netPL) : Math.round(netPL),
      tradeList, trades: tradeList.length, createdAt: new Date().toISOString(),
    });
  }

  const canSave = label.trim() && (
    (source === 'csv' && parsed?.trades?.length) ||
    (source === 'manual' && manualRows.some(r => r.date || r.profit)) ||
    ['mt4mt5', 'ctrader', 'tradelocker'].includes(source)
  );

  if (step === 1) {
    return (
      <Modal title="Add strategy — choose data source" onClose={onClose}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {SOURCES.map(src => (
            <button key={src.id} onClick={() => { setSource(src.id); setStep(2); }} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              border: `1px solid ${C.border}`, borderRadius: 12, background: C.card,
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', color: C.textSec,
            }}>
              <span style={{ flexShrink: 0 }}>{SOURCE_ICONS[src.id]}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{src.label}</div>
                <div style={{ fontSize: 11, color: C.textSec, marginTop: 1 }}>
                  {src.id === 'csv' ? 'Upload a CSV file' : src.id === 'manual' ? 'Enter trades manually' : 'Connect via API (soon)'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={`Add strategy — ${SOURCES.find(s => s.id === source)?.label}`} onClose={onClose}
      footer={<div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Btn variant="secondary" onClick={() => setStep(1)}>← Back</Btn>
        <Btn disabled={!canSave} onClick={handleSave}>Save strategy</Btn>
      </div>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FieldInput label="Strategy name" value={label} onChange={setLabel} placeholder="e.g. FTMO Breakout 2024" />
        <FieldInput label="Starting balance (optional)" value={startBal} onChange={setStartBal} placeholder="10000" type="number" suffix="$" />

        {source === 'csv' && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: C.textSec, marginBottom: 8 }}>Upload CSV file</div>
            <div onClick={() => fileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
              style={{ border: `2px dashed ${parsed ? C.accent : C.border}`, borderRadius: 12, padding: '28px', textAlign: 'center', cursor: 'pointer', background: parsed ? '#F8FDE8' : C.bg }}>
              {importing ? <div style={{ color: C.textSec, fontSize: 13 }}>Reading file…</div> :
               parsed ? (
                <div>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>✓</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{parsed.trades.length} trades found</div>
                  <div style={{ fontSize: 11, color: C.textSec, marginTop: 3 }}>
                    {parsed.trades.filter(t => (t.profit || 0) > 0).length}W · {parsed.trades.filter(t => (t.profit || 0) < 0).length}L
                  </div>
                </div>
               ) : (
                <div>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.textTer} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8, display: 'block', margin: '0 auto 8px' }}>
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                  </svg>
                  <div style={{ fontSize: 13, color: C.textSec }}>Drop CSV here or <span style={{ color: C.accent, fontWeight: 600 }}>browse</span></div>
                  <div style={{ fontSize: 11, color: C.textTer, marginTop: 4 }}>Supports RiskDriver CSV, MT4/MT5, and generic formats</div>
                </div>
               )}
              <input ref={fileRef} type="file" accept=".csv,.txt,.html,.htm" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            </div>
            {parseError && <div style={{ fontSize: 12, color: C.red, marginTop: 8 }}>{parseError}</div>}
          </div>
        )}

        {['mt4mt5', 'ctrader', 'tradelocker'].includes(source) && (
          <div style={{ background: '#FFF8E6', border: '1px solid #FFE08A', borderRadius: 10, padding: '14px 16px', fontSize: 13, color: '#8A6500', lineHeight: 1.6 }}>
            Live API integration for {SOURCE_LABELS[source]} is coming soon. Save the strategy and import data via CSV in the meantime.
          </div>
        )}

        {source === 'manual' && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: C.textSec, marginBottom: 8 }}>Enter trades</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>{['Date', 'Instrument', 'Direction', 'P&L ($)', 'R-multiple', 'Result'].map(h => (
                    <th key={h} style={{ padding: '5px 8px', textAlign: 'left', color: C.textSec, fontWeight: 500, borderBottom: `1px solid ${C.divider}` }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {manualRows.map((row, i) => (
                    <tr key={i}>
                      {['date', 'instrument'].map(f => (
                        <td key={f} style={{ padding: '3px 3px' }}>
                          <input value={row[f]} onChange={e => setManualRows(rows => rows.map((r, j) => j === i ? { ...r, [f]: e.target.value } : r))}
                            style={{ width: f === 'date' ? 96 : 90, padding: '4px 6px', border: `1px solid ${C.inputBorder}`, borderRadius: 5, fontSize: 11, fontFamily: 'inherit', background: C.input }} />
                        </td>
                      ))}
                      <td style={{ padding: '3px 3px' }}>
                        <select value={row.direction} onChange={e => setManualRows(rows => rows.map((r, j) => j === i ? { ...r, direction: e.target.value } : r))}
                          style={{ padding: '4px 6px', border: `1px solid ${C.inputBorder}`, borderRadius: 5, fontSize: 11, fontFamily: 'inherit', background: C.input }}>
                          <option>Long</option><option>Short</option>
                        </select>
                      </td>
                      {['profit', 'rMultiple'].map(f => (
                        <td key={f} style={{ padding: '3px 3px' }}>
                          <input type="number" value={row[f]} onChange={e => setManualRows(rows => rows.map((r, j) => j === i ? { ...r, [f]: e.target.value } : r))}
                            style={{ width: 70, padding: '4px 6px', border: `1px solid ${C.inputBorder}`, borderRadius: 5, fontSize: 11, fontFamily: 'inherit', background: C.input }} />
                        </td>
                      ))}
                      <td style={{ padding: '3px 3px' }}>
                        <select value={row.result} onChange={e => setManualRows(rows => rows.map((r, j) => j === i ? { ...r, result: e.target.value } : r))}
                          style={{ padding: '4px 6px', border: `1px solid ${C.inputBorder}`, borderRadius: 5, fontSize: 11, fontFamily: 'inherit', background: C.input }}>
                          <option value="">Auto</option><option>Win</option><option>Loss</option><option>Break-even</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => setManualRows(r => [...r, { date: '', instrument: '', direction: 'Long', profit: '', rMultiple: '', result: '' }])}
              style={{ marginTop: 8, fontSize: 12, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0, fontWeight: 600 }}>+ Add row</button>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── prop firm data ───────────────────────────────────────────────────────────
const PROP_FIRMS = {
  forex: [
    { id: 'ftmo',        label: 'FTMO',               rules: { maxDailyDD: 5, maxTotalDD: 10, target: 10, minDays: 4,  maxPerDay: null, accountSize: 100000 } },
    { id: 'fundingpips', label: 'Funding Pips',        rules: { maxDailyDD: 5, maxTotalDD: 10, target: 10, minDays: 5,  maxPerDay: null, accountSize: 100000 } },
    { id: 'tft',         label: 'The Funded Trader',   rules: { maxDailyDD: 5, maxTotalDD: 10, target: 10, minDays: 5,  maxPerDay: null, accountSize: 100000 } },
    { id: 'mff',         label: 'MyForexFunds',        rules: { maxDailyDD: 4, maxTotalDD: 8,  target: 8,  minDays: 5,  maxPerDay: null, accountSize: 100000 } },
    { id: 'e8',          label: 'E8 Funding',          rules: { maxDailyDD: 5, maxTotalDD: 8,  target: 8,  minDays: 8,  maxPerDay: null, accountSize: 100000 } },
    { id: 'tff',         label: 'True Forex Funds',    rules: { maxDailyDD: 5, maxTotalDD: 10, target: 10, minDays: 5,  maxPerDay: null, accountSize: 100000 } },
  ],
  futures: [
    { id: 'apex',        label: 'Apex Trader Funding', rules: { maxDailyDD: 3, maxTotalDD: 6,  target: 6,  minDays: 7,  maxPerDay: null, accountSize: 50000  } },
    { id: 'topstep',     label: 'Topstep',             rules: { maxDailyDD: 2, maxTotalDD: 6,  target: 6,  minDays: 10, maxPerDay: null, accountSize: 50000  } },
    { id: 'earn2trade',  label: 'Earn2Trade',          rules: { maxDailyDD: 3, maxTotalDD: 6,  target: 8,  minDays: 15, maxPerDay: null, accountSize: 50000  } },
    { id: 'mff2',        label: 'MyFundedFutures',     rules: { maxDailyDD: 3, maxTotalDD: 8,  target: 8,  minDays: 5,  maxPerDay: null, accountSize: 50000  } },
    { id: 'tradeday',    label: 'TradeDay',            rules: { maxDailyDD: 3, maxTotalDD: 8,  target: 8,  minDays: 5,  maxPerDay: null, accountSize: 50000  } },
  ],
};

function AddAnalysisModal({ strategies, onSave, onClose }) {
  const [step, setStep] = useState(1);
  const [firmId, setFirmId] = useState(null);
  const [firmLabel, setFirmLabel] = useState('');
  const [rules, setRules] = useState({ maxDailyDD: 5, maxTotalDD: 10, target: 10, minDays: 4, maxPerDay: '', accountSize: 100000 });
  const [strategyId, setStrategyId] = useState(strategies[0]?.id || '');
  const [analysisName, setAnalysisName] = useState('');

  function selectFirm(firm) {
    setFirmId(firm.id); setFirmLabel(firm.label);
    setRules({ ...firm.rules, maxPerDay: firm.rules.maxPerDay || '' });
    setAnalysisName(firm.label + ' Challenge');
    setStep(2);
  }

  function handleSave() {
    if (!analysisName.trim()) return;
    const strategy = strategies.find(s => s.id === (typeof strategyId === 'string' ? strategyId : String(strategyId)));
    onSave({
      id: Date.now(), name: analysisName.trim(), firmId, firmLabel,
      rules: {
        maxDailyDD:  parseFloat(rules.maxDailyDD)  || 5,
        maxTotalDD:  parseFloat(rules.maxTotalDD)  || 10,
        target:      parseFloat(rules.target)      || 10,
        minDays:     parseFloat(rules.minDays)     || 4,
        maxPerDay:   parseFloat(rules.maxPerDay)   || null,
        accountSize: parseFloat(rules.accountSize) || 100000,
      },
      strategyId:    strategy?.id     || null,
      strategyLabel: strategy?.label  || '',
    });
  }

  function setRule(k, v) { setRules(r => ({ ...r, [k]: v })); }

  if (step === 1) {
    return (
      <Modal title="New prop firm analysis — select firm" onClose={onClose}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {[['Forex / CFD', PROP_FIRMS.forex], ['Futures', PROP_FIRMS.futures]].map(([cat, firms]) => (
            <div key={cat}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{cat}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {firms.map(firm => (
                  <button key={firm.id} onClick={() => selectFirm(firm)} style={{
                    padding: '11px 14px', border: `1px solid ${C.border}`, borderRadius: 10,
                    background: C.card, cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 13, fontWeight: 500, color: C.text, textAlign: 'left',
                  }}>{firm.label}</button>
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => { setFirmId('custom'); setFirmLabel('Custom'); setAnalysisName('Custom Challenge'); setStep(2); }} style={{
            padding: '11px 14px', border: `2px dashed ${C.border}`, borderRadius: 10,
            background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: C.textSec,
          }}>+ Custom firm</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={`New analysis — ${firmLabel}`} onClose={onClose}
      footer={<div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Btn variant="secondary" onClick={() => setStep(1)}>← Back</Btn>
        <Btn onClick={handleSave} disabled={!analysisName.trim()}>Create analysis</Btn>
      </div>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FieldInput label="Analysis name" value={analysisName} onChange={setAnalysisName} placeholder="e.g. FTMO $100k Challenge" />
        <div style={{ fontSize: 12, fontWeight: 600, color: C.textSec }}>Prop firm rules</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FieldInput label="Max daily drawdown" value={rules.maxDailyDD} onChange={v => setRule('maxDailyDD', v)} suffix="%" type="number" />
          <FieldInput label="Max total drawdown" value={rules.maxTotalDD} onChange={v => setRule('maxTotalDD', v)} suffix="%" type="number" />
          <FieldInput label="Profit target" value={rules.target} onChange={v => setRule('target', v)} suffix="%" type="number" />
          <FieldInput label="Account size" value={rules.accountSize} onChange={v => setRule('accountSize', v)} suffix="$" type="number" />
          <FieldInput label="Min. trading days" value={rules.minDays} onChange={v => setRule('minDays', v)} type="number" />
          <FieldInput label="Max trades/day (optional)" value={rules.maxPerDay} onChange={v => setRule('maxPerDay', v)} type="number" />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: C.textSec, marginBottom: 6 }}>Link strategy</div>
          {strategies.length === 0 ? (
            <div style={{ fontSize: 13, color: C.textSec, background: C.bg, padding: '10px 14px', borderRadius: 8 }}>
              No strategies yet. Add a strategy first, then link it here.
            </div>
          ) : (
            <select value={strategyId} onChange={e => setStrategyId(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.inputBorder}`, borderRadius: 9, background: C.input, fontSize: 13, fontFamily: 'inherit', color: C.text }}>
              {strategies.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── analysis card ────────────────────────────────────────────────────────────
function AnalysisCard({ analysis, isSelected, onClick, onDelete }) {
  return (
    <div onClick={onClick} style={{
      background: C.card, border: `1.5px solid ${isSelected ? C.accent : C.border}`,
      borderRadius: 14, padding: '12px 14px', cursor: 'pointer',
      boxShadow: isSelected ? `0 0 0 3px ${C.accent}22` : C.shadow,
      transition: 'border-color 0.15s, box-shadow 0.15s', minWidth: 200,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{analysis.name}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5, background: '#E8F4FD', color: '#1A56A4' }}>{analysis.firmLabel}</span>
            {analysis.strategyLabel && <span style={{ fontSize: 11, color: C.textSec }}>→ {analysis.strategyLabel}</span>}
          </div>
          <div style={{ fontSize: 10, color: C.textTer, marginTop: 3 }}>DD {analysis.rules.maxTotalDD}% · Target {analysis.rules.target}%</div>
        </div>
        <button onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: C.textTer, padding: '2px', flexShrink: 0 }}>×</button>
      </div>
    </div>
  );
}

// ─── main export ───────────────────────────────────────────────────────────────
export default function StrategiesPage({ strategies, setStrategies }) {
  const [selectedStrategyId, setSelectedStrategyId] = useState(null);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [showAddStrategy, setShowAddStrategy] = useState(false);
  const [showAddAnalysis, setShowAddAnalysis] = useState(false);

  const selectedAnalysis = analyses.find(a => a.id === selectedAnalysisId) || null;
  const analysisStrategy = selectedAnalysis ? (strategies.find(s => s.id === selectedAnalysis.strategyId) || null) : null;

  function addStrategy(data) {
    setStrategies(prev => [...prev, data]);
    setSelectedStrategyId(data.id);
    setShowAddStrategy(false);
  }

  function addAnalysis(data) {
    setAnalyses(prev => [...prev, data]);
    setSelectedAnalysisId(data.id);
    setShowAddAnalysis(false);
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg }}>

      {/* LEFT COLUMN — Strategies */}
      <div style={{ width: 280, flexShrink: 0, borderRight: `1px solid ${C.border}`, padding: '28px 16px', display: 'flex', flexDirection: 'column', gap: 10, background: C.card }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, padding: '0 4px' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Strategies</div>
          <span style={{ fontSize: 11, color: C.textSec, background: C.bg, padding: '2px 8px', borderRadius: 8 }}>{strategies.length}</span>
        </div>

        {strategies.length === 0 && (
          <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.6, padding: '4px 4px 8px' }}>
            Add your first strategy to get started.
          </div>
        )}

        {strategies.map(s => (
          <StrategyCard key={s.id} strategy={s} isSelected={selectedStrategyId === s.id}
            onClick={() => setSelectedStrategyId(s.id)}
            onDelete={() => { setStrategies(prev => prev.filter(x => x.id !== s.id)); if (selectedStrategyId === s.id) setSelectedStrategyId(null); }} />
        ))}

        <button onClick={() => setShowAddStrategy(true)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '14px', border: `1.5px dashed ${C.border}`, borderRadius: 14,
          background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: C.textSec,
        }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add strategy
        </button>
      </div>

      {/* RIGHT COLUMN — Prop Firm Route */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Right header */}
        {analyses.length > 0 && (
          <div style={{ padding: '20px 28px', borderBottom: `1px solid ${C.border}`, background: C.card }}>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 2, flexWrap: 'wrap' }}>
              {analyses.map(a => (
                <AnalysisCard key={a.id} analysis={a} isSelected={selectedAnalysisId === a.id}
                  onClick={() => setSelectedAnalysisId(a.id)}
                  onDelete={() => { setAnalyses(prev => prev.filter(x => x.id !== a.id)); if (selectedAnalysisId === a.id) setSelectedAnalysisId(null); }} />
              ))}
            </div>
          </div>
        )}

        {/* Right content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {!selectedAnalysis ? (
            <div style={{ textAlign: 'center', padding: '60px 40px' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.textTer} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 14, display: 'block', margin: '0 auto 14px' }}>
                  <polyline points="3,17 9,11 13,14 21,6" />
                  <polyline points="15,6 21,6 21,12" />
                </svg>
              <div style={{ fontSize: 18, fontWeight: 600, color: C.text, marginBottom: 8 }}>No strategy found</div>
              <div style={{ fontSize: 13, color: C.textSec, maxWidth: 340, margin: '0 auto 24px', lineHeight: 1.6 }}>
                Add your strategy to get started.
              </div>
            </div>
          ) : (
            <PropFirmAnalysis analysis={selectedAnalysis} strategy={analysisStrategy} />
          )}
        </div>
      </div>

      {showAddStrategy && <AddStrategyModal onSave={addStrategy} onClose={() => setShowAddStrategy(false)} />}
      {showAddAnalysis && <AddAnalysisModal strategies={strategies} onSave={addAnalysis} onClose={() => setShowAddAnalysis(false)} />}
    </div>
  );
}
