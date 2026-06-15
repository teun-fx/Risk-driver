import { useState } from 'react';
import { useTheme } from '../ThemeContext';

function Card({ children, style = {} }) {
  const t = useTheme();
  return (
    <div style={{
      background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 18,
      boxShadow: t.cardShadow, padding: '28px 32px',
      transition: 'background 0.35s ease, border-color 0.35s ease', ...style,
    }}>{children}</div>
  );
}

function Field({ label, value, onChange, suffix, prefix, type = 'number', step, min, helper }) {
  const t = useTheme();
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 13, color: t.textSec, marginBottom: 7, fontWeight: 500 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {prefix && (
          <div style={{
            padding: '10px 12px', background: t.rowBg, border: `1px solid ${t.inputBorder}`,
            borderRight: 'none', borderRadius: '10px 0 0 10px', fontSize: 14, color: t.textSec,
          }}>{prefix}</div>
        )}
        <input
          type={type}
          value={value}
          step={step}
          min={min}
          onChange={e => onChange(e.target.value)}
          style={{
            flex: 1, padding: '10px 14px', border: `1px solid ${t.inputBorder}`,
            borderRadius: prefix && suffix ? 0 : prefix ? '0 10px 10px 0' : suffix ? '10px 0 0 10px' : 10,
            fontSize: 14, fontFamily: 'inherit', color: t.text,
            background: t.inputBg, outline: 'none',
          }}
        />
        {suffix && (
          <div style={{
            padding: '10px 12px', background: t.rowBg, border: `1px solid ${t.inputBorder}`,
            borderLeft: 'none', borderRadius: '0 10px 10px 0', fontSize: 14, color: t.textSec,
          }}>{suffix}</div>
        )}
      </div>
      {helper && <div style={{ fontSize: 11, color: '#AEAEB2', marginTop: 5 }}>{helper}</div>}
    </div>
  );
}

function ResultRow({ label, value, accent }) {
  const t = useTheme();
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${t.dividerLight}` }}>
      <span style={{ fontSize: 13, color: t.textSec }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 600, color: accent ? '#A1D533' : t.text }}>{value}</span>
    </div>
  );
}

// ─── Lotsize calculator ────────────────────────────────────────────────────────
function LotsizeCalc() {
  const t = useTheme();
  const [balance, setBalance] = useState('10000');
  const [riskPct, setRiskPct] = useState('1');
  const [slPips, setSlPips] = useState('20');
  const [pipValue, setPipValue] = useState('10');
  const [currency, setCurrency] = useState('USD');

  const riskAmount   = (parseFloat(balance) || 0) * (parseFloat(riskPct) || 0) / 100;
  const slPipsN      = parseFloat(slPips) || 0;
  const pipValueN    = parseFloat(pipValue) || 0;
  const lotSize      = slPipsN > 0 && pipValueN > 0 ? riskAmount / (slPipsN * pipValueN) : 0;
  const minilots     = lotSize * 10;
  const microlots    = lotSize * 100;

  const pipValueHints = {
    'EURUSD': 10, 'GBPUSD': 10, 'AUDUSD': 10, 'NZDUSD': 10,
    'USDJPY': '~7.1', 'USDCAD': '~7.5', 'USDCHF': '~10.8',
    'XAUUSD': 10, 'NAS100': 1, 'US500': 10,
  };

  return (
    <Card>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, marginBottom: 6 }}>📐</div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: t.text, margin: '0 0 4px', letterSpacing: '-0.2px' }}>
          Lot Size Calculator
        </h2>
        <p style={{ fontSize: 13, color: t.textSec, margin: 0 }}>Calculate your position size based on risk</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
        <Field label="Account balance" value={balance} onChange={setBalance} prefix={currency === 'USD' ? '$' : '€'} />
        <Field label="Risk per trade" value={riskPct} onChange={setRiskPct} suffix="%" step="0.1" min="0.1" />
        <Field label="Stop loss" value={slPips} onChange={setSlPips} suffix="pips" min="1" helper="1 pip = 4th decimal for FX, 2nd for JPY" />
        <Field label="Pip value (per standard lot)" value={pipValue} onChange={setPipValue} prefix={currency === 'USD' ? '$' : '€'}
          helper="EURUSD = $10 · XAUUSD = $10 · NAS100 = $1" />
      </div>

      {/* Quick pip presets */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: t.textSec, marginBottom: 8, fontWeight: 500 }}>Quick presets (pip value per std lot)</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {Object.entries(pipValueHints).map(([sym, val]) => (
            <button key={sym} onClick={() => setPipValue(String(val))} style={{
              fontSize: 11, padding: '4px 10px', border: `1px solid ${t.cardBorder}`, borderRadius: 99,
              background: 'transparent', color: t.textSec, cursor: 'pointer', fontFamily: 'inherit',
            }}>{sym}</button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div style={{ background: t.rowBg, borderRadius: 14, padding: '18px 20px' }}>
        <ResultRow label="Risk amount" value={`${currency === 'USD' ? '$' : '€'}${riskAmount.toFixed(2)}`} />
        <ResultRow label="Standard lots" value={lotSize > 0 ? lotSize.toFixed(4) : '—'} accent />
        <ResultRow label="Mini lots (0.10)" value={lotSize > 0 ? minilots.toFixed(3) : '—'} />
        <ResultRow label="Micro lots (0.01)" value={lotSize > 0 ? microlots.toFixed(2) : '—'} />
        <div style={{ paddingTop: 10, fontSize: 11, color: t.textTer }}>
          Rounded standard lot: <strong>{lotSize > 0 ? Math.floor(lotSize * 100) / 100 : '—'}</strong>
        </div>
      </div>
    </Card>
  );
}

// ─── Margin calculator ─────────────────────────────────────────────────────────
function MarginCalc() {
  const t = useTheme();
  const [instrument, setInstrument] = useState('EURUSD');
  const [lotSize, setLotSize] = useState('0.10');
  const [leverage, setLeverage] = useState('100');
  const [price, setPrice] = useState('1.0850');
  const [currency, setCurrency] = useState('USD');

  const instruments = [
    { sym: 'EURUSD', contractSize: 100000, baseCcy: 'EUR' },
    { sym: 'GBPUSD', contractSize: 100000, baseCcy: 'GBP' },
    { sym: 'AUDUSD', contractSize: 100000, baseCcy: 'AUD' },
    { sym: 'USDJPY', contractSize: 100000, baseCcy: 'USD' },
    { sym: 'USDCAD', contractSize: 100000, baseCcy: 'USD' },
    { sym: 'XAUUSD', contractSize: 100,    baseCcy: 'XAU' },
    { sym: 'NAS100', contractSize: 1,      baseCcy: 'NAS' },
    { sym: 'US500',  contractSize: 50,     baseCcy: 'SP'  },
    { sym: 'BTCUSD', contractSize: 1,      baseCcy: 'BTC' },
  ];

  const selectedInstr = instruments.find(i => i.sym === instrument) || instruments[0];
  const lots    = parseFloat(lotSize) || 0;
  const lev     = parseFloat(leverage) || 1;
  const px      = parseFloat(price) || 0;
  const notional = lots * selectedInstr.contractSize * px;
  const margin   = lev > 0 ? notional / lev : 0;
  const marginPct = notional > 0 ? (margin / notional * 100).toFixed(2) : '—';

  return (
    <Card>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, marginBottom: 6 }}>💹</div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: t.text, margin: '0 0 4px', letterSpacing: '-0.2px' }}>
          Margin Calculator
        </h2>
        <p style={{ fontSize: 13, color: t.textSec, margin: 0 }}>Required margin for a given position</p>
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ display: 'block', fontSize: 13, color: t.textSec, marginBottom: 7, fontWeight: 500 }}>Instrument</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {instruments.map(i => (
            <button key={i.sym} onClick={() => setInstrument(i.sym)} style={{
              fontSize: 12, padding: '6px 12px', borderRadius: 99,
              border: `1px solid ${instrument === i.sym ? '#A1D533' : t.cardBorder}`,
              background: instrument === i.sym ? '#A1D533' : 'transparent',
              color: instrument === i.sym ? '#1D1D1F' : t.textSec,
              cursor: 'pointer', fontFamily: 'inherit', fontWeight: instrument === i.sym ? 600 : 400,
            }}>{i.sym}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
        <Field label="Lot size" value={lotSize} onChange={setLotSize} step="0.01" min="0.01" />
        <Field label="Leverage" value={leverage} onChange={setLeverage} prefix="1:" min="1" helper="e.g. 100 = 1:100" />
        <Field label="Entry price" value={price} onChange={setPrice} step="0.0001" />
      </div>

      <div style={{ background: t.rowBg, borderRadius: 14, padding: '18px 20px' }}>
        <ResultRow label="Notional value" value={`$${notional.toLocaleString('en-US', { maximumFractionDigits: 2 })}`} />
        <ResultRow label="Required margin" value={margin > 0 ? `$${margin.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '—'} accent />
        <ResultRow label="Margin %" value={`${marginPct}%`} />
        <ResultRow label="Contract size" value={`${selectedInstr.contractSize.toLocaleString()} ${selectedInstr.baseCcy}`} />
        <div style={{ paddingTop: 10, fontSize: 11, color: t.textTer }}>
          Leverage {lev}:1 · {lots} lot{lots !== 1 ? 's' : ''} {instrument}
        </div>
      </div>
    </Card>
  );
}

export default function Tools() {
  const t = useTheme();
  return (
    <div style={{ padding: '36px 40px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: t.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 4 }}>
          Tools
        </h1>
        <p style={{ fontSize: 14, color: t.textSec, margin: 0 }}>Calculators for sizing and margin</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20 }}>
        <LotsizeCalc />
        <MarginCalc />
      </div>
    </div>
  );
}
