import { useState, useRef } from 'react';
import { DARK as t } from '../theme';
import { parseTradeFile } from '../services/csvParser.js';
import { useAuth } from '../AuthContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const CFD_GROUP     = ['prop_challenge', 'prop_funded', 'cfd_funded'];
const FUT_GROUP     = ['futures_eval', 'futures_funded'];

const ACCOUNT_TYPES = [
  { id: 'prop_challenge', label: 'Prop Firm Challenge',    group: 'cfd' },
  { id: 'prop_funded',    label: 'Prop Firm Funded',       group: 'cfd' },
  { id: 'cfd_funded',     label: 'CFD Funded',             group: 'cfd' },
  { id: 'futures_eval',   label: 'Futures Evaluation',     group: 'futures' },
  { id: 'futures_funded', label: 'Futures Funded',         group: 'futures' },
  { id: 'private',        label: 'Private Broker Account', group: 'other' },
  { id: 'demo',           label: 'Demo Account',           group: 'other' },
  { id: 'backtest',       label: 'Backtest Data',          group: 'other' },
];

const CFD_FIRMS = [
  'FTMO', 'Funding Pips', 'The Funded Trader', 'E8 Funding', 'True Forex Funds',
  'MyForexFunds', 'Alpha Capital', 'Instant Funding', 'The5ers', 'FundedNext',
];
const FUT_FIRMS = [
  'Apex Trader Funding', 'Topstep', 'Earn2Trade', 'MyFundedFutures',
  'TradeDay', 'Take Profit Trader', 'Bulenox', 'FastTrackTrading',
];

const INIT_FORM = {
  // shared
  firmName: '', accountSize: '', startDate: '', profitSplit: '', activationCost: '', monthlyCost: '',
  // CFD-specific
  dailyDDLimit: '', dailyDDType: 'balance', totalDDLimit: '', profitTarget: '',
  minTradingDays: '', maxTradingDays: '', consistencyEnabled: false, consistencyMaxPct: '',
  newsTrading: false, weekendHold: false, overnightHold: false, expertAdvisors: false, leverage: '',
  // Futures-specific
  dailyLossLimit: '', trailingDD: '', trailingDDType: 'eod', profitTargetDollar: '',
  minWinningDays: '', maxContracts: '', tradingHours: 'rth', resetCost: '',
  futuresConsistency: false, futuresNewsTrading: false,
  // Other-specific
  name: '', broker: '', currency: 'USD', notes: '',
};

function accountGroup(typeId) {
  if (CFD_GROUP.includes(typeId)) return 'cfd';
  if (FUT_GROUP.includes(typeId)) return 'futures';
  return 'other';
}

// ─── Reusable UI pieces ───────────────────────────────────────────────────────

function Input({ label, hint, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      {label && (
        <div style={{ fontSize: 12, color: t.textSec, marginBottom: 5, fontWeight: 500 }}>
          {label}
          {hint && <span style={{ color: t.textTer, fontWeight: 400, marginLeft: 4 }}>{hint}</span>}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || ''}
        style={{
          width: '100%', padding: '9px 12px', background: t.cardInner,
          border: `1px solid ${t.border}`, borderRadius: 10, fontSize: 13,
          fontFamily: 'inherit', color: t.text, outline: 'none', boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

function Seg({ value, onChange, options }) {
  return (
    <div style={{ display: 'flex', background: t.cardInner, borderRadius: 8, padding: 2, gap: 2 }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{
          flex: 1, padding: '5px 8px', borderRadius: 6, border: 'none', fontFamily: 'inherit',
          fontSize: 11, fontWeight: 500, cursor: 'pointer',
          background: value === o.value ? t.accent : 'transparent',
          color: value === o.value ? '#000' : t.textSec,
          whiteSpace: 'nowrap',
        }}>{o.label}</button>
      ))}
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{
      width: 40, height: 23, borderRadius: 12, cursor: 'pointer', flexShrink: 0,
      background: value ? t.accent : t.cardInner,
      border: `1px solid ${value ? t.accent : t.border}`,
      position: 'relative', transition: 'background 0.2s',
    }}>
      <div style={{
        position: 'absolute', top: 2, left: value ? 18 : 2,
        width: 17, height: 17, borderRadius: '50%', background: '#fff',
        transition: 'left 0.18s',
      }} />
    </div>
  );
}

function TRow({ label, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${t.border}` }}>
      <span style={{ fontSize: 13, color: t.text }}>{label}</span>
      {children}
    </div>
  );
}

function G2({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>;
}

function SecLbl({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: t.textTer, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 18, marginBottom: 8 }}>
      {children}
    </div>
  );
}

function FirmPills({ firms, selected, onSelect }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 4 }}>
      {firms.map(f => (
        <button key={f} onClick={() => onSelect(f)} style={{
          padding: '5px 11px', borderRadius: 8, fontFamily: 'inherit', fontSize: 12, fontWeight: 500,
          border: `1px solid ${selected === f ? t.accent : t.border}`,
          background: selected === f ? 'rgba(48,209,88,0.1)' : t.cardInner,
          color: selected === f ? t.accent : t.textSec,
          cursor: 'pointer',
        }}>{f}</button>
      ))}
    </div>
  );
}

function NavBtns({ onBack, onNext, nextDisabled, nextLabel = 'Next →' }) {
  return (
    <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
      <button onClick={onBack} style={{
        flex: 1, padding: '10px', borderRadius: 12, border: `1px solid ${t.border}`,
        background: 'transparent', color: t.textSec, fontFamily: 'inherit', fontSize: 14, cursor: 'pointer',
      }}>← Back</button>
      <button onClick={onNext} disabled={nextDisabled} style={{
        flex: 2, padding: '10px', borderRadius: 12, border: 'none', fontFamily: 'inherit',
        background: nextDisabled ? t.rowBg : t.accent,
        color: nextDisabled ? t.textSec : '#000',
        fontSize: 14, fontWeight: 600, cursor: nextDisabled ? 'not-allowed' : 'pointer',
      }}>{nextLabel}</button>
    </div>
  );
}

// ─── SVG account type icons ───────────────────────────────────────────────────

function TypeIcon({ id, size = 18, color }) {
  const c = color || t.textSec;
  const s = { width: size, height: size, display: 'block', flexShrink: 0 };
  const base = { fill: 'none', stroke: c, strokeWidth: '1.5', strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (id) {
    case 'prop_challenge':
      return (
        <svg style={s} viewBox="0 0 20 20" {...base}>
          <path d="M6 3h8M4 3H3a1 1 0 000 2c0 2 1.5 4 3 5M16 3h1a1 1 0 010 2c0 2-1.5 4-3 5M7 10a3 3 0 006 0V3H7v7zM10 13v3M7 16h6" />
        </svg>
      );
    case 'prop_funded':
      return (
        <svg style={s} viewBox="0 0 20 20" {...base}>
          <circle cx="10" cy="10" r="7" />
          <path d="M10 6v8M8.5 8.3c0-.8.7-1.3 1.5-1.3s1.5.5 1.5 1.3-.8 1-1.5 1-1.5.5-1.5 1.4.7 1.3 1.5 1.3 1.5-.5 1.5-1.3" />
        </svg>
      );
    case 'cfd_funded':
      return (
        <svg style={s} viewBox="0 0 20 20" {...base}>
          <path d="M10 2l7 3v5c0 4-3 6.5-7 7-4-.5-7-3-7-7V5l7-3z" />
          <polyline points="7,10 9,12 13,8" />
        </svg>
      );
    case 'futures_eval':
      return (
        <svg style={s} viewBox="0 0 20 20" {...base}>
          <rect x="3" y="12" width="3" height="5" rx="1" />
          <rect x="8.5" y="7" width="3" height="10" rx="1" />
          <rect x="14" y="3" width="3" height="14" rx="1" />
        </svg>
      );
    case 'futures_funded':
      return (
        <svg style={s} viewBox="0 0 20 20" {...base}>
          <polyline points="3,15 8,9 12,12 17,5" />
          <polyline points="13,5 17,5 17,9" />
        </svg>
      );
    case 'private':
      return (
        <svg style={s} viewBox="0 0 20 20" {...base}>
          <rect x="5" y="9" width="10" height="8" rx="2" />
          <path d="M7 9V7a3 3 0 016 0v2" />
        </svg>
      );
    case 'demo':
      return (
        <svg style={s} viewBox="0 0 20 20" {...base}>
          <rect x="2" y="3" width="16" height="11" rx="2" />
          <path d="M7 17h6M10 14v3" />
        </svg>
      );
    case 'backtest':
      return (
        <svg style={s} viewBox="0 0 20 20" {...base}>
          <circle cx="10" cy="10" r="7" />
          <polyline points="10,6 10,10 13,12" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── Step 1: Account type ─────────────────────────────────────────────────────

function TypeStep({ accountType, onSelect, onNext }) {
  const groups = [
    { key: 'cfd',     label: 'CFD / Forex' },
    { key: 'futures', label: 'Futures' },
    { key: 'other',   label: 'Other' },
  ];
  return (
    <>
      {groups.map(g => {
        const types = ACCOUNT_TYPES.filter(a => a.group === g.key);
        return (
          <div key={g.key} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: t.textTer, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              {g.label}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${types.length}, 1fr)`, gap: 8 }}>
              {types.map(at => {
                const active = accountType === at.id;
                return (
                  <button key={at.id} onClick={() => onSelect(at.id)} style={{
                    padding: '14px 10px', borderRadius: 12, textAlign: 'left', fontFamily: 'inherit',
                    border: `1.5px solid ${active ? t.accent : t.border}`,
                    background: active ? 'rgba(48,209,88,0.08)' : t.cardInner,
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8,
                  }}>
                    <TypeIcon id={at.id} color={active ? t.accent : t.textSec} />
                    <div style={{ fontSize: 12, color: active ? t.accent : t.text, fontWeight: 500, lineHeight: 1.3 }}>{at.label}</div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
        <button onClick={onNext} disabled={!accountType} style={{
          padding: '10px 28px', borderRadius: 12, border: 'none', fontFamily: 'inherit',
          background: accountType ? t.accent : t.rowBg,
          color: accountType ? '#000' : t.textSec,
          fontSize: 14, fontWeight: 600, cursor: accountType ? 'pointer' : 'not-allowed',
        }}>Next →</button>
      </div>
    </>
  );
}

// ─── Step 2: CFD / Forex form ─────────────────────────────────────────────────

function CfdStep({ form, set, onBack, onNext }) {
  return (
    <>
      <SecLbl>Select firm</SecLbl>
      <FirmPills firms={CFD_FIRMS} selected={form.firmName} onSelect={v => set('firmName', v)} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
        <SecLbl>Account</SecLbl>
        <G2>
          <Input label="Firm name" value={form.firmName} onChange={v => set('firmName', v)} placeholder="e.g. FTMO" />
          <Input label="Account size ($)" type="number" value={form.accountSize} onChange={v => set('accountSize', v)} placeholder="100000" />
        </G2>

        <SecLbl>Drawdown rules</SecLbl>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <Input label="Daily drawdown limit (%)" type="number" value={form.dailyDDLimit} onChange={v => set('dailyDDLimit', v)} placeholder="5" />
          </div>
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: t.textSec, marginBottom: 5, fontWeight: 500 }}>Type</div>
            <Seg value={form.dailyDDType} onChange={v => set('dailyDDType', v)}
              options={[{ value: 'balance', label: 'Balance' }, { value: 'trailing', label: 'Trailing' }]} />
          </div>
        </div>
        <Input label="Max total drawdown (%)" type="number" value={form.totalDDLimit} onChange={v => set('totalDDLimit', v)} placeholder="10" />

        <SecLbl>Targets</SecLbl>
        <G2>
          <Input label="Profit target (%)" type="number" value={form.profitTarget} onChange={v => set('profitTarget', v)} placeholder="10" />
          <Input label="Profit split (%)" type="number" value={form.profitSplit} onChange={v => set('profitSplit', v)} placeholder="80" />
        </G2>
        <G2>
          <Input label="Minimum trading days" type="number" value={form.minTradingDays} onChange={v => set('minTradingDays', v)} placeholder="5" />
          <Input label="Maximum trading days" hint="(optional)" type="number" value={form.maxTradingDays} onChange={v => set('maxTradingDays', v)} />
        </G2>

        <SecLbl>Rules</SecLbl>
        <TRow label="Consistency rule">
          <Toggle value={form.consistencyEnabled} onChange={v => set('consistencyEnabled', v)} />
        </TRow>
        {form.consistencyEnabled && (
          <Input label="Max % of profit from one day" type="number" value={form.consistencyMaxPct} onChange={v => set('consistencyMaxPct', v)} placeholder="30" />
        )}
        <TRow label="News trading allowed"><Toggle value={form.newsTrading} onChange={v => set('newsTrading', v)} /></TRow>
        <TRow label="Weekend holding allowed"><Toggle value={form.weekendHold} onChange={v => set('weekendHold', v)} /></TRow>
        <TRow label="Overnight holding allowed"><Toggle value={form.overnightHold} onChange={v => set('overnightHold', v)} /></TRow>
        <TRow label="Expert Advisors allowed"><Toggle value={form.expertAdvisors} onChange={v => set('expertAdvisors', v)} /></TRow>

        <SecLbl>Account details</SecLbl>
        <G2>
          <Input label="Leverage" value={form.leverage} onChange={v => set('leverage', v)} placeholder="1:100" />
          <Input label="Start date" type="date" value={form.startDate} onChange={v => set('startDate', v)} />
        </G2>
        <G2>
          <Input label="Activation cost ($)" type="number" value={form.activationCost} onChange={v => set('activationCost', v)} placeholder="0" />
          <Input label="Monthly fee ($)" hint="(optional)" type="number" value={form.monthlyCost} onChange={v => set('monthlyCost', v)} placeholder="0" />
        </G2>
      </div>

      <NavBtns onBack={onBack} onNext={onNext} nextDisabled={!form.firmName} />
    </>
  );
}

// ─── Step 2: Futures form ─────────────────────────────────────────────────────

function FuturesStep({ form, set, onBack, onNext }) {
  return (
    <>
      <SecLbl>Select firm</SecLbl>
      <FirmPills firms={FUT_FIRMS} selected={form.firmName} onSelect={v => set('firmName', v)} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
        <SecLbl>Account</SecLbl>
        <G2>
          <Input label="Firm name" value={form.firmName} onChange={v => set('firmName', v)} placeholder="e.g. Apex" />
          <Input label="Account size ($)" type="number" value={form.accountSize} onChange={v => set('accountSize', v)} placeholder="50000" />
        </G2>

        <SecLbl>Loss limits</SecLbl>
        <G2>
          <Input label="Daily loss limit ($)" type="number" value={form.dailyLossLimit} onChange={v => set('dailyLossLimit', v)} placeholder="1000" />
          <Input label="Max trailing drawdown ($)" type="number" value={form.trailingDD} onChange={v => set('trailingDD', v)} placeholder="2500" />
        </G2>
        <div>
          <div style={{ fontSize: 11, color: t.textSec, marginBottom: 5, fontWeight: 500 }}>Drawdown measured</div>
          <Seg value={form.trailingDDType} onChange={v => set('trailingDDType', v)}
            options={[{ value: 'eod', label: 'End of day' }, { value: 'intraday', label: 'Intraday' }]} />
        </div>

        <SecLbl>Targets</SecLbl>
        <G2>
          <Input label="Profit target ($)" type="number" value={form.profitTargetDollar} onChange={v => set('profitTargetDollar', v)} placeholder="3000" />
          <Input label="Profit split (%)" type="number" value={form.profitSplit} onChange={v => set('profitSplit', v)} placeholder="90" />
        </G2>
        <G2>
          <Input label="Min winning days" type="number" value={form.minWinningDays} onChange={v => set('minWinningDays', v)} placeholder="10" />
          <Input label="Max position size (contracts)" type="number" value={form.maxContracts} onChange={v => set('maxContracts', v)} placeholder="10" />
        </G2>

        <SecLbl>Rules</SecLbl>
        <TRow label="Consistency rule"><Toggle value={form.futuresConsistency} onChange={v => set('futuresConsistency', v)} /></TRow>
        <TRow label="News trading allowed"><Toggle value={form.futuresNewsTrading} onChange={v => set('futuresNewsTrading', v)} /></TRow>
        <div>
          <div style={{ fontSize: 11, color: t.textSec, marginBottom: 5, fontWeight: 500, marginTop: 8 }}>Permitted trading hours</div>
          <Seg value={form.tradingHours} onChange={v => set('tradingHours', v)}
            options={[{ value: 'rth', label: 'RTH only' }, { value: '24h', label: '24 hours' }]} />
        </div>

        <SecLbl>Account details</SecLbl>
        <G2>
          <Input label="Start date" type="date" value={form.startDate} onChange={v => set('startDate', v)} />
          <Input label="Activation cost ($)" type="number" value={form.activationCost} onChange={v => set('activationCost', v)} placeholder="0" />
        </G2>
        <G2>
          <Input label="Monthly fee ($)" hint="(optional)" type="number" value={form.monthlyCost} onChange={v => set('monthlyCost', v)} placeholder="0" />
          <Input label="Reset cost ($)" type="number" value={form.resetCost} onChange={v => set('resetCost', v)} placeholder="0" />
        </G2>
      </div>

      <NavBtns onBack={onBack} onNext={onNext} nextDisabled={!form.firmName} />
    </>
  );
}

// ─── Step 2: Other / simple form ─────────────────────────────────────────────

function OtherStep({ form, set, onBack, onNext }) {
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <G2>
          <Input label="Account name" value={form.name} onChange={v => set('name', v)} placeholder="My account" />
          <Input label="Broker" value={form.broker} onChange={v => set('broker', v)} placeholder="e.g. IC Markets" />
        </G2>
        <G2>
          <Input label="Account size" type="number" value={form.accountSize} onChange={v => set('accountSize', v)} placeholder="25000" />
          <Input label="Currency" value={form.currency} onChange={v => set('currency', v)} placeholder="USD" />
        </G2>
        <Input label="Start date" type="date" value={form.startDate} onChange={v => set('startDate', v)} />
        <div>
          <div style={{ fontSize: 12, color: t.textSec, marginBottom: 5, fontWeight: 500 }}>Notes</div>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Optional notes..."
            style={{
              width: '100%', padding: '9px 12px', background: t.cardInner, border: `1px solid ${t.border}`,
              borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: t.text,
              outline: 'none', resize: 'vertical', minHeight: 72, boxSizing: 'border-box',
            }}
          />
        </div>
      </div>
      <NavBtns onBack={onBack} onNext={onNext} nextDisabled={!form.name} />
    </>
  );
}

// ─── Step 3: Trade data upload ────────────────────────────────────────────────

const IMPORT_TABS = [
  { id: 'csv',    label: 'CSV Upload' },
  { id: 'mt45',   label: 'MT4 / MT5' },
  { id: 'ct',     label: 'cTrader' },
  { id: 'tl',     label: 'TradeLocker' },
  { id: 'manual', label: 'Manual entry' },
];

function TradeDataStep({ tradeList, importing, importDone, importError, fileRef, onFile, onBack, onSubmit }) {
  const [tab, setTab] = useState('csv');
  return (
    <>
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, overflowX: 'auto' }}>
        {IMPORT_TABS.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{
            padding: '6px 12px', borderRadius: 8, border: `1px solid ${tab === tb.id ? t.accent : t.border}`,
            background: tab === tb.id ? 'rgba(48,209,88,0.08)' : 'transparent',
            color: tab === tb.id ? t.accent : t.textSec, fontFamily: 'inherit',
            fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
          }}>{tb.label}</button>
        ))}
      </div>

      {tab === 'csv' ? (
        <>
          <a href="/riskdriver-template.csv" download
            style={{ fontSize: 12, color: t.accent, textDecoration: 'none', display: 'inline-block', marginBottom: 14 }}>
            ↓ Download template CSV
          </a>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}
            style={{
              border: `2px dashed ${importDone ? t.accent : t.border}`, borderRadius: 16,
              padding: '40px 24px', textAlign: 'center', cursor: 'pointer',
              background: importDone ? 'rgba(48,209,88,0.06)' : t.cardInner, transition: 'all 0.2s',
            }}
          >
            <input ref={fileRef} type="file" accept=".csv,.txt,.html,.htm" style={{ display: 'none' }}
              onChange={e => onFile(e.target.files[0])} />
            {importing ? (
              <div style={{ color: t.textSec, fontSize: 14 }}>Importing...</div>
            ) : importDone ? (
              <>
                <div style={{ fontSize: 22, color: t.accent, fontWeight: 700, marginBottom: 6 }}>✓</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.accent }}>{tradeList.length} trades imported</div>
                <div style={{ fontSize: 12, color: t.textSec, marginTop: 4 }}>Click to replace file</div>
              </>
            ) : (
              <>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={t.textTer} strokeWidth="1.5"
                  strokeLinecap="round" style={{ marginBottom: 10, display: 'block', margin: '0 auto 10px' }}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                <div style={{ fontSize: 14, fontWeight: 500, color: t.text }}>Click to upload or drag & drop</div>
                <div style={{ fontSize: 12, color: t.textSec, marginTop: 4 }}>CSV · MT4 · MT5 · cTrader · Myfxbook · FXBlue</div>
              </>
            )}
          </div>
          {importError && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,69,58,0.1)', borderRadius: 10, fontSize: 13, color: '#FF453A' }}>
              {importError}
            </div>
          )}
        </>
      ) : (
        <div style={{
          border: `1px solid ${t.border}`, borderRadius: 16, padding: '48px 24px', textAlign: 'center',
          background: t.cardInner,
        }}>
          <div style={{ fontSize: 13, color: t.textSec, lineHeight: 1.6 }}>
            Direct integration with <strong style={{ color: t.text }}>{IMPORT_TABS.find(tb => tb.id === tab)?.label}</strong> is coming soon.
            <br />Use CSV upload in the meantime, or skip and connect later.
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
        <button onClick={onBack} style={{
          flex: 1, padding: '10px', borderRadius: 12, border: `1px solid ${t.border}`,
          background: 'transparent', color: t.textSec, fontFamily: 'inherit', fontSize: 14, cursor: 'pointer',
        }}>← Back</button>
        <button onClick={onSubmit} style={{
          flex: 1, padding: '10px', borderRadius: 12, border: `1px solid ${t.border}`,
          background: 'transparent', color: t.textSec, fontFamily: 'inherit', fontSize: 14, cursor: 'pointer',
        }}>Skip</button>
        <button onClick={onSubmit} style={{
          flex: 2, padding: '10px', borderRadius: 12, border: 'none', fontFamily: 'inherit',
          background: t.accent, color: '#000', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>Add Account</button>
      </div>
    </>
  );
}

// ─── Add Account modal ────────────────────────────────────────────────────────

const STEP_LABELS = ['Account type', 'Details', 'Trade data'];

function AddAccountModal({ onClose, onAdd }) {
  const [step, setStep]               = useState(1);
  const [accountType, setAccountType] = useState(null);
  const [form, setForm]               = useState(INIT_FORM);
  const [tradeList, setTradeList]     = useState([]);
  const [importing, setImporting]     = useState(false);
  const [importError, setImportError] = useState('');
  const [importDone, setImportDone]   = useState(false);
  const fileRef = useRef();

  const group = accountType ? accountGroup(accountType) : null;

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleFile(file) {
    if (!file) return;
    setImporting(true); setImportError(''); setImportDone(false);
    try {
      const text = await file.text();
      const result = parseTradeFile(text, file.name);
      if (!result?.trades?.length) {
        setImportError('No trades found. Check the file format.');
      } else {
        setTradeList(result.trades);
        setImportDone(true);
      }
    } catch (err) {
      setImportError('Parse error: ' + (err?.message || 'Unknown error'));
    }
    setImporting(false);
  }

  function handleSubmit() {
    const typeDef    = ACCOUNT_TYPES.find(a => a.id === accountType);
    const isCfd      = group === 'cfd';
    const isFutures  = group === 'futures';
    const brokerName = (isCfd || isFutures) ? form.firmName : form.name;

    onAdd({
      id: Date.now(),
      type: accountType,
      group,
      brokerName,
      broker: form.broker || brokerName,
      accountType: typeDef?.label || accountType,
      accountSize: parseFloat(form.accountSize) || 0,
      currency: form.currency || 'USD',
      status: 'active',
      startDate: form.startDate,
      notes: form.notes,
      profitSplit: parseFloat(form.profitSplit) || null,
      activationCost: parseFloat(form.activationCost) || 0,
      monthlyCost: parseFloat(form.monthlyCost) || 0,
      startingBalance: parseFloat(form.accountSize) || 10000,
      tradeList,
      // CFD fields
      ...(isCfd && {
        dailyDDLimit: parseFloat(form.dailyDDLimit) || null,
        dailyDDType: form.dailyDDType,
        totalDDLimit: parseFloat(form.totalDDLimit) || null,
        profitTarget: parseFloat(form.profitTarget) || null,
        minTradingDays: parseFloat(form.minTradingDays) || null,
        maxTradingDays: parseFloat(form.maxTradingDays) || null,
        consistencyEnabled: form.consistencyEnabled,
        consistencyMaxPct: parseFloat(form.consistencyMaxPct) || null,
        newsTrading: form.newsTrading,
        weekendHold: form.weekendHold,
        overnightHold: form.overnightHold,
        expertAdvisors: form.expertAdvisors,
        leverage: form.leverage,
      }),
      // Futures fields
      ...(isFutures && {
        dailyLossLimit: parseFloat(form.dailyLossLimit) || null,
        trailingDD: parseFloat(form.trailingDD) || null,
        trailingDDType: form.trailingDDType,
        profitTargetDollar: parseFloat(form.profitTargetDollar) || null,
        minWinningDays: parseFloat(form.minWinningDays) || null,
        maxContracts: parseFloat(form.maxContracts) || null,
        tradingHours: form.tradingHours,
        resetCost: parseFloat(form.resetCost) || null,
        futuresConsistency: form.futuresConsistency,
        newsTrading: form.futuresNewsTrading,
      }),
    });
    onClose();
  }

  function goStep2() {
    if (accountType === 'backtest') set('name', form.name || 'Backtest Data');
    setStep(2);
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: t.card, borderRadius: 20, width: 640, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.65)' }}>
        {/* Sticky header */}
        <div style={{
          padding: '22px 26px', borderBottom: `1px solid ${t.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: t.card, zIndex: 2,
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600, color: t.text }}>Add Account</div>
            <div style={{ display: 'flex', gap: 14, marginTop: 10, alignItems: 'center' }}>
              {STEP_LABELS.map((label, i) => {
                const n      = i + 1;
                const active = step === n;
                const done   = step > n;
                return (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', fontSize: 10, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: (done || active) ? t.accent : t.cardInner,
                      color: (done || active) ? '#000' : t.textSec,
                    }}>{done ? '✓' : n}</div>
                    <span style={{ fontSize: 12, color: active ? t.text : t.textSec }}>{label}</span>
                    {i < STEP_LABELS.length - 1 && <span style={{ color: t.textTer, marginLeft: 4 }}>›</span>}
                  </div>
                );
              })}
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: 22, color: t.textSec, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: '22px 26px' }}>
          {step === 1 && (
            <TypeStep accountType={accountType} onSelect={setAccountType} onNext={goStep2} />
          )}
          {step === 2 && group === 'cfd' && (
            <CfdStep form={form} set={set} onBack={() => setStep(1)} onNext={() => setStep(3)} />
          )}
          {step === 2 && group === 'futures' && (
            <FuturesStep form={form} set={set} onBack={() => setStep(1)} onNext={() => setStep(3)} />
          )}
          {step === 2 && group === 'other' && (
            <OtherStep form={form} set={set} onBack={() => setStep(1)} onNext={() => setStep(3)} />
          )}
          {step === 3 && (
            <TradeDataStep
              tradeList={tradeList} importing={importing} importDone={importDone} importError={importError}
              fileRef={fileRef} onFile={handleFile} onBack={() => setStep(2)} onSubmit={handleSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Account card ─────────────────────────────────────────────────────────────

function AccountCard({ account, selected, onSelect, onDelete, isViewer }) {
  return (
    <div
      onClick={() => onSelect(account.id)}
      style={{
        background: t.card, borderRadius: 16, padding: '16px 18px', cursor: 'pointer',
        border: `1.5px solid ${selected ? t.accent : t.cardBorder}`,
        boxShadow: selected ? '0 0 0 3px rgba(29,185,84,0.10)' : 'none',
        transition: 'all 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TypeIcon id={account.type} size={16} color={t.textSec} />
          <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{account.brokerName}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: account.status === 'active' ? t.accent : t.red, display: 'inline-block' }} />
          <span style={{ fontSize: 11, color: t.textSec }}>{account.status === 'active' ? 'Active' : 'Inactive'}</span>
          <button
            onClick={e => { e.stopPropagation(); !isViewer && onDelete(account.id); }}
            style={{ background: 'none', border: 'none', cursor: isViewer ? 'not-allowed' : 'pointer', color: t.textTer, padding: '0 2px', lineHeight: 1, marginLeft: 2, opacity: isViewer ? 0.3 : 1 }}
            title="Delete account"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3,6 5,6 21,6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          </button>
        </div>
      </div>
      <div style={{ fontSize: 11, color: t.textSec, marginBottom: 6, marginLeft: 24 }}>{account.accountType}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: t.text, marginLeft: 24 }}>${(account.accountSize || 0).toLocaleString()}</div>
    </div>
  );
}

// ─── Account detail ───────────────────────────────────────────────────────────

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${t.cardBorder}` }}>
      <span style={{ fontSize: 13, color: t.textSec }}>{label}</span>
      <span style={{ fontSize: 13, color: t.text, fontWeight: 500 }}>{value ?? '—'}</span>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: t.textTer, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 20, marginBottom: 4 }}>
      {children}
    </div>
  );
}

function EditAccountModal({ account, onSave, onClose }) {
  const [name, setName]             = useState(account.brokerName || '');
  const [accountSize, setAccountSize] = useState(String(account.accountSize || ''));
  const [currency, setCurrency]     = useState(account.currency || 'USD');
  const [startDate, setStartDate]   = useState(account.startDate || '');

  function handleSave() {
    onSave({
      ...account,
      brokerName: name.trim() || account.brokerName,
      accountSize: parseFloat(accountSize) || account.accountSize,
      startingBalance: parseFloat(accountSize) || account.startingBalance,
      currency: currency.trim() || 'USD',
      startDate,
    });
    onClose();
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: t.card, borderRadius: 20, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: t.text }}>Edit Account</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: t.textTer, padding: '0 4px', lineHeight: 1 }}>x</button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Account name" value={name} onChange={setName} placeholder="Account name" />
          <Input label="Account size ($)" type="number" value={accountSize} onChange={setAccountSize} placeholder="10000" />
          <Input label="Currency" value={currency} onChange={setCurrency} placeholder="USD" />
          <Input label="Start date" type="date" value={startDate} onChange={setStartDate} />
        </div>
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', border: `1px solid ${t.border}`, borderRadius: 10, background: 'transparent', color: t.textSec, fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} style={{ padding: '9px 18px', border: 'none', borderRadius: 10, background: t.accent, color: '#000', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Save</button>
        </div>
      </div>
    </div>
  );
}

function AccountDetail({ account, onEdit, onDelete, isViewer }) {
  const group = account.group || accountGroup(account.type);
  const isCfd     = group === 'cfd';
  const isFutures = group === 'futures';

  return (
    <div style={{ background: t.card, borderRadius: 18, padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <TypeIcon id={account.type} size={22} color={t.textSec} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, color: t.text }}>{account.brokerName}</div>
            <div style={{ fontSize: 13, color: t.textSec, marginTop: 2 }}>{account.accountType}</div>
          </div>
        </div>
        {!isViewer && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onEdit} style={{
              padding: '7px 14px', border: `1px solid ${t.border}`, borderRadius: 10,
              background: 'transparent', color: t.textSec, fontFamily: 'inherit', fontSize: 12, cursor: 'pointer',
            }}>Edit</button>
            <button onClick={onDelete} style={{
              padding: '7px 14px', border: `1px solid ${t.red}`, borderRadius: 10,
              background: 'transparent', color: t.red, fontFamily: 'inherit', fontSize: 12, cursor: 'pointer',
            }}>Delete</button>
          </div>
        )}
      </div>

      <SectionTitle>Account Info</SectionTitle>
      <InfoRow label="Account size" value={account.accountSize ? `$${account.accountSize.toLocaleString()}` : null} />
      <InfoRow label="Currency" value={account.currency || 'USD'} />
      <InfoRow label="Start date" value={account.startDate || null} />
      {account.notes && <InfoRow label="Notes" value={account.notes} />}

      {isCfd && (
        <>
          <SectionTitle>Drawdown Rules</SectionTitle>
          <InfoRow label="Daily drawdown limit" value={account.dailyDDLimit != null ? `${account.dailyDDLimit}% (${account.dailyDDType === 'trailing' ? 'trailing' : 'balance-based'})` : null} />
          <InfoRow label="Max total drawdown" value={account.totalDDLimit != null ? `${account.totalDDLimit}%` : null} />
          <SectionTitle>Targets</SectionTitle>
          <InfoRow label="Profit target" value={account.profitTarget != null ? `${account.profitTarget}%` : null} />
          <InfoRow label="Min trading days" value={account.minTradingDays ?? null} />
          <InfoRow label="Max trading days" value={account.maxTradingDays ?? null} />
          <SectionTitle>Trading Rules</SectionTitle>
          <InfoRow label="Consistency rule" value={account.consistencyEnabled ? `Yes — max ${account.consistencyMaxPct ?? '?'}% from one day` : 'No'} />
          <InfoRow label="News trading" value={account.newsTrading ? 'Allowed' : 'Not allowed'} />
          <InfoRow label="Weekend holding" value={account.weekendHold ? 'Allowed' : 'Not allowed'} />
          <InfoRow label="Overnight holding" value={account.overnightHold ? 'Allowed' : 'Not allowed'} />
          <InfoRow label="Expert Advisors" value={account.expertAdvisors ? 'Allowed' : 'Not allowed'} />
          <InfoRow label="Leverage" value={account.leverage || null} />
        </>
      )}

      {isFutures && (
        <>
          <SectionTitle>Loss Limits</SectionTitle>
          <InfoRow label="Daily loss limit" value={account.dailyLossLimit != null ? `$${account.dailyLossLimit.toLocaleString()}` : account.dailyDDLimit != null ? `$${Number(account.dailyDDLimit).toLocaleString()}` : null} />
          <InfoRow label="Max trailing drawdown" value={account.trailingDD != null ? `$${account.trailingDD.toLocaleString()} (${account.trailingDDType === 'intraday' ? 'intraday' : 'end of day'})` : account.totalDDLimit != null ? `$${Number(account.totalDDLimit).toLocaleString()}` : null} />
          <SectionTitle>Targets</SectionTitle>
          <InfoRow label="Profit target" value={account.profitTargetDollar != null ? `$${account.profitTargetDollar.toLocaleString()}` : null} />
          <InfoRow label="Min winning days" value={account.minWinningDays ?? null} />
          <InfoRow label="Max position size" value={account.maxContracts != null ? `${account.maxContracts} contracts` : account.maxPositionSize || null} />
          <SectionTitle>Trading Rules</SectionTitle>
          <InfoRow label="Consistency rule" value={account.futuresConsistency ? 'Yes' : 'No'} />
          <InfoRow label="News trading" value={account.newsTrading ? 'Allowed' : 'Not allowed'} />
          <InfoRow label="Trading hours" value={account.tradingHours === 'rth' ? 'RTH only' : account.tradingHours === '24h' ? '24 hours' : account.tradingHours || null} />
        </>
      )}

      <SectionTitle>Financials</SectionTitle>
      <InfoRow label="Profit split" value={account.profitSplit != null ? `${account.profitSplit}%` : null} />
      <InfoRow label="Activation cost" value={account.activationCost != null ? `$${Number(account.activationCost).toLocaleString()}` : null} />
      <InfoRow label="Monthly fee" value={account.monthlyCost != null && account.monthlyCost > 0 ? `$${Number(account.monthlyCost).toLocaleString()}` : 'None'} />
      {isFutures && <InfoRow label="Reset cost" value={account.resetCost != null ? `$${account.resetCost.toLocaleString()}` : null} />}
      <InfoRow label="Trades loaded" value={account.tradeList?.length ? `${account.tradeList.length} trades` : 'None'} />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Accounts({ accounts, setAccounts }) {
  const { isViewer } = useAuth();
  const [selected, setSelected]   = useState(accounts[0]?.id ?? null);
  const [showModal, setShowModal] = useState(false);
  const [editAccount, setEditAccount] = useState(null);

  const selectedAccount = accounts.find(a => a.id === selected);

  function addAccount(data) {
    setAccounts(prev => [...prev, data]);
    setSelected(data.id);
  }

  function handleDelete(id) {
    if (!window.confirm('Delete this account?')) return;
    setAccounts(prev => prev.filter(a => a.id !== id));
    if (selected === id) setSelected(accounts.find(a => a.id !== id)?.id ?? null);
  }

  function handleEdit(updatedAccount) {
    setAccounts(prev => prev.map(a => a.id === updatedAccount.id ? updatedAccount : a));
  }

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: t.text, margin: 0, letterSpacing: '-0.5px' }}>
          Accounts
          <span style={{ marginLeft: 10, fontSize: 14, fontWeight: 500, padding: '3px 10px', borderRadius: 99, background: t.rowBg, color: t.textSec }}>
            {accounts.length}
          </span>
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {accounts.map(acc => (
            <AccountCard key={acc.id} account={acc} selected={selected === acc.id} onSelect={setSelected} onDelete={handleDelete} isViewer={isViewer} />
          ))}
          <button
            onClick={() => !isViewer && setShowModal(true)}
            style={{
              border: `2px dashed ${t.border}`, borderRadius: 16, padding: '20px',
              background: 'transparent', cursor: isViewer ? 'not-allowed' : 'pointer',
              textAlign: 'center', fontFamily: 'inherit', color: t.textSec,
              fontSize: 13, fontWeight: 500, opacity: isViewer ? 0.5 : 1,
            }}
          >+ Add account</button>
        </div>

        {selectedAccount ? (
          <AccountDetail
            account={selectedAccount}
            onEdit={() => setEditAccount(selectedAccount)}
            onDelete={() => handleDelete(selectedAccount.id)}
            isViewer={isViewer}
          />
        ) : (
          <div style={{ background: t.card, borderRadius: 18, padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: t.textTer }}>Select an account to view details</div>
          </div>
        )}
      </div>

      {showModal && <AddAccountModal onClose={() => setShowModal(false)} onAdd={addAccount} />}
      {editAccount && (
        <EditAccountModal
          account={editAccount}
          onSave={handleEdit}
          onClose={() => setEditAccount(null)}
        />
      )}
    </div>
  );
}
