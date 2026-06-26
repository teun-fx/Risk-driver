import { useState, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DARK as t } from '../theme';
import {
  normalizeTrades, tradesPerMonth, ksTwoSample, lag1Autocorr,
  determineMethod, runSimulation,
} from '../utils/breachCalculator';

const C = {
  bg: t.appBg, card: t.card, border: t.border, shadow: t.cardShadow,
  text: t.text, textSec: t.textSec, textTer: t.textTer,
  accent: t.brand, accentText: '#000',
  red: t.red, redLight: t.redLight,
  green: t.accent, greenLight: t.accentLight,
  orange: '#E07A00', orangeLight: 'rgba(224,122,0,0.09)',
  divider: t.divider,
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

function Card({ children, style = {} }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px', boxShadow: C.shadow, ...style }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: C.textTer, marginBottom: 10 }}>{children}</div>;
}

function CheckCard({ title, value, threshold, pass, warn, detail, noData }) {
  const color = noData ? C.textTer : pass === null ? C.textSec : warn ? C.orange : pass ? C.green : C.red;
  const bg = noData ? C.bg : pass === null ? C.bg : warn ? C.orangeLight : pass ? C.greenLight : C.redLight;
  const badge = noData ? 'N/A' : pass === null ? 'N/A' : warn ? 'WARNING' : pass ? 'PASS' : 'FAIL';
  const badgeColor = noData ? C.textTer : color;
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{title}</div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: bg, color: badgeColor, letterSpacing: '0.8px' }}>{badge}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: noData ? C.textTer : C.text, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: C.textTer, marginBottom: detail ? 6 : 0 }}>{threshold}</div>
      {detail && <div style={{ fontSize: 12, color: noData ? C.textTer : (warn || !pass ? color : C.textSec), marginTop: 4 }}>{detail}</div>}
    </Card>
  );
}

function MetricCard({ label: lbl, value, sub, highlight, noData }) {
  return (
    <Card>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: C.textTer, marginBottom: 8 }}>{lbl}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: noData ? C.textTer : (highlight || C.text), marginBottom: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.textSec }}>{sub}</div>}
    </Card>
  );
}

function InputField({ label: lbl, value, onChange, suffix, readOnly }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: C.textSec, marginBottom: 5, fontWeight: 500 }}>{lbl}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0 10px', height: 36 }}>
        <input
          type="number"
          value={value}
          onChange={e => onChange?.(e.target.value)}
          readOnly={readOnly}
          style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 13, color: readOnly ? C.textSec : C.text, outline: 'none', fontFamily: 'inherit' }}
        />
        {suffix && <span style={{ fontSize: 12, color: C.textTer }}>{suffix}</span>}
      </div>
    </div>
  );
}

function SelectField({ label: lbl, value, onChange, options }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: C.textSec, marginBottom: 5, fontWeight: 500 }}>{lbl}</div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%', height: 36, border: `1px solid ${C.border}`, borderRadius: 8, background: C.bg, fontSize: 13, color: C.text, padding: '0 10px', outline: 'none', fontFamily: 'inherit' }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Btn({ onClick, children, disabled, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? C.border : C.accent,
      color: disabled ? C.textTer : '#000',
      border: 'none', borderRadius: 8, padding: '0 20px', height: 36,
      fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'inherit', ...style,
    }}>{children}</button>
  );
}

const BAR_COLORS = ['#2DBD6E', '#7BC47F', '#E07A00', '#F03D3D', '#B02020'];
const EMPTY_HISTOGRAM = [
  { label: '0', pct: 0 }, { label: '1', pct: 0 }, { label: '2', pct: 0 },
  { label: '3', pct: 0 }, { label: '4+', pct: 0 },
];

function BreachHistogram({ histogram }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={histogram} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: C.textSec }} axisLine={false} tickLine={false}
          label={{ value: 'Number of breaches', position: 'insideBottom', offset: -2, fontSize: 11, fill: C.textTer }} />
        <YAxis tickFormatter={v => `${v.toFixed(1)}%`} tick={{ fontSize: 11, fill: C.textTer }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={v => [`${v.toFixed(2)}%`, '% of simulations']}
          contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
        />
        <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
          {histogram.map((_, i) => <Cell key={i} fill={BAR_COLORS[i] || BAR_COLORS[4]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function BreachPage({ strategies, accounts }) {
  const [selectedSource, setSelectedSource] = useState('');
  const [ddLimit, setDdLimit] = useState(10);
  const [repurchase, setRepurchase] = useState(2);
  const [horizon, setHorizon] = useState(24);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [condDD, setCondDD] = useState('');
  const [condTrades, setCondTrades] = useState('');
  const [condResult, setCondResult] = useState(null);
  const [condRunning, setCondRunning] = useState(false);

  // Build source list from strategies + accounts
  const sources = [
    ...strategies.map(s => ({ id: `s_${s.id}`, label: s.name || `Strategy ${s.id}`, trades: s.tradeList || [] })),
    ...accounts.map(a => ({ id: `a_${a.id}`, label: a.brokerName || `Account ${a.id}`, trades: a.tradeList || [] })),
  ];
  const selectedSrc = sources.find(s => s.id === selectedSource);
  const trades = selectedSrc?.trades || [];
  const hasData = trades.length > 0;

  const normalized = useMemo(() => normalizeTrades(trades), [trades]);

  const diagnostics = useMemo(() => {
    if (!normalized.length) return null;
    const tpm = tradesPerMonth(trades);
    const mid = Math.floor(normalized.length / 2);
    const ks = normalized.length >= 4 ? ksTwoSample(normalized.slice(0, mid), normalized.slice(mid)) : null;
    const autocorr = lag1Autocorr(normalized);
    const method = determineMethod(tpm, autocorr, ks?.pValue ?? 1);
    return { tpm, ks, autocorr, method };
  }, [normalized, trades]);

  const runSim = useCallback(() => {
    if (!normalized.length) return;
    setRunning(true);
    setResult(null);
    setTimeout(() => {
      const r = runSimulation({
        normalizedTrades: normalized,
        ddLimitPct: Number(ddLimit),
        repurchaseMonths: Number(repurchase),
        horizonMonths: Number(horizon),
        simCount: 5000,
        startEquityPct: 1.0,
      });
      setResult(r);
      setRunning(false);
    }, 20);
  }, [normalized, ddLimit, repurchase, horizon]);

  const runConditional = useCallback(() => {
    const dd = parseFloat(condDD);
    if (!normalized.length || isNaN(dd) || dd < 0 || dd >= Number(ddLimit)) return;
    setCondRunning(true);
    setCondResult(null);
    setTimeout(() => {
      const r = runSimulation({
        normalizedTrades: normalized,
        ddLimitPct: Number(ddLimit),
        repurchaseMonths: Number(repurchase),
        horizonMonths: Number(horizon),
        simCount: 5000,
        startEquityPct: 1 - dd / 100,
      });
      setCondResult(r);
      setCondRunning(false);
    }, 20);
  }, [normalized, ddLimit, repurchase, horizon, condDD]);

  const { tpm, ks, autocorr, method } = diagnostics || {};
  const tpmWarn = hasData && tpm < 30;
  const ksPass = ks ? ks.pValue > 0.05 : null;
  const autocorrInterp = !hasData ? 'Load trade data to calculate'
    : autocorr > 0.4 ? 'Path-dependent — particle filter recommended'
    : autocorr >= 0.1 ? 'Weak signal — too noisy for live filtering'
    : 'Independent — standard Monte Carlo applicable';

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', overflowX: 'hidden', background: t.appBg }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: t.text, margin: 0, letterSpacing: '-0.4px' }}>Breach Calculator</h1>
          <div style={{ fontSize: 12, color: t.textSec, marginTop: 3 }}>Probability of prop firm account breaches over time</div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: t.textSec, marginBottom: 5 }}>Data source</div>
          <select
            value={selectedSource}
            onChange={e => { setSelectedSource(e.target.value); setResult(null); setCondResult(null); }}
            style={{ height: 36, border: `1px solid ${t.border}`, borderRadius: 8, background: t.card, fontSize: 13, color: t.text, padding: '0 12px', outline: 'none', fontFamily: 'inherit', minWidth: 220 }}
          >
            <option value="">— Select strategy or account —</option>
            {strategies.length > 0 && <optgroup label="Strategies">
              {strategies.map(s => <option key={`s_${s.id}`} value={`s_${s.id}`}>{s.name || `Strategy ${s.id}`}</option>)}
            </optgroup>}
            {accounts.length > 0 && <optgroup label="Accounts">
              {accounts.map(a => <option key={`a_${a.id}`} value={`a_${a.id}`}>{a.brokerName || `Account ${a.id}`}</option>)}
            </optgroup>}
          </select>
        </div>
      </div>

      {!hasData && <InfoBanner />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Diagnostic checks */}
        <div>
          <SectionLabel>Diagnostic Checks</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <CheckCard
              title="A — Trades / month"
              value={hasData ? (tpm?.toFixed(1) ?? '—') : '—'}
              threshold="Threshold: ≥ 30 = reliable"
              pass={hasData ? !tpmWarn : null}
              warn={false}
              noData={!hasData}
              detail={hasData && tpmWarn ? 'Below 30 trades/month reduces detection reliability.' : undefined}
            />
            <CheckCard
              title="B — Stationarity (KS-test)"
              value={hasData && ks ? `p = ${ks.pValue.toFixed(3)}` : '—'}
              threshold="Threshold: p > 0.05 = stationary"
              pass={ksPass}
              warn={false}
              noData={!hasData}
              detail={!hasData ? 'Load trade data to calculate'
                : ksPass === true ? 'Stationary — historical data is a reliable prior.'
                : ksPass === false ? 'Non-stationary — distribution shifted between periods.'
                : 'Insufficient data for KS-test.'}
            />
            <CheckCard
              title="C — Lag-1 Autocorrelation"
              value={hasData && autocorr != null ? autocorr.toFixed(3) : '—'}
              threshold={hasData && autocorr != null ? (autocorr > 0.4 ? '> 0.4' : autocorr >= 0.1 ? '0.1–0.4' : '< 0.1') : '—'}
              pass={hasData && autocorr != null ? autocorr < 0.1 : null}
              warn={hasData && autocorr != null && autocorr >= 0.1 && autocorr <= 0.4}
              noData={!hasData}
              detail={autocorrInterp}
            />
          </div>
        </div>

        {/* Method verdict */}
        <Card style={{ borderLeft: `3px solid ${method ? C.accent : C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: C.textTer, marginBottom: 6 }}>Method Verdict</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: hasData ? C.text : C.textTer, marginBottom: 4 }}>
                {hasData && method ? `Method ${method.id}: ${method.name}` : '—'}
              </div>
              <div style={{ fontSize: 13, color: C.textSec, marginBottom: 4 }}>
                {hasData && method ? method.desc : 'Load trade data to determine the recommended simulation method.'}
              </div>
              <div style={{ fontSize: 12, color: C.textTer }}>
                {hasData && method ? `Recommended update cycle: ${method.update}` : ''}
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.accent, opacity: hasData ? 0.4 : 0.15, paddingLeft: 16 }}>
              {hasData && method ? `M${method.id}` : 'M?'}
            </div>
          </div>
        </Card>

        {/* Settings */}
        <div>
          <SectionLabel>Simulation Settings</SectionLabel>
          <Card>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
              <InputField label="Drawdown limit" value={ddLimit} onChange={setDdLimit} suffix="%" />
              <SelectField
                label="Repurchase frequency"
                value={repurchase}
                onChange={setRepurchase}
                options={[
                  { value: 1, label: 'Every 1 month' },
                  { value: 2, label: 'Every 2 months' },
                  { value: 3, label: 'Every 3 months' },
                  { value: 4, label: 'Every 4 months' },
                  { value: 6, label: 'Every 6 months' },
                ]}
              />
              <SelectField
                label="Time horizon"
                value={horizon}
                onChange={setHorizon}
                options={[
                  { value: 12, label: '12 months' },
                  { value: 24, label: '24 months' },
                  { value: 36, label: '36 months' },
                ]}
              />
              <InputField label="Simulations" value="5,000" readOnly />
            </div>
            <Btn onClick={runSim} disabled={running || !hasData}>
              {running ? 'Running 5,000 simulations…' : 'Run Simulation'}
            </Btn>
          </Card>
        </div>

        {/* Results — always shown, -- when no sim run */}
        <div>
          <SectionLabel>
            {result ? `Simulation Results — ${result.accountsPerSim} accounts over ${horizon} months` : 'Simulation Results'}
          </SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            <MetricCard label="Expected breaches" value={result ? result.mean.toFixed(2) : '—'} sub="Mean across 5,000 runs" noData={!result} />
            <MetricCard label="Probability of 0 breaches" value={result ? `${result.pZero.toFixed(1)}%` : '—'} highlight={result ? (result.pZero >= 70 ? C.green : result.pZero >= 40 ? C.orange : C.red) : undefined} noData={!result} />
            <MetricCard label="Median breaches" value={result ? result.median.toFixed(0) : '—'} noData={!result} />
            <MetricCard label="Worst case (95th pct)" value={result ? result.p95.toFixed(0) : '—'} sub="Breaches in worst 5% of runs" highlight={result ? C.red : undefined} noData={!result} />
          </div>

          <Card>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: C.textTer, marginBottom: 14 }}>Breach Distribution</div>
            <BreachHistogram histogram={result ? result.histogram : EMPTY_HISTOGRAM} />
          </Card>
        </div>

        {/* Conditional analysis */}
        <div>
          <SectionLabel>Conditional Analysis — Where are you now?</SectionLabel>
          <Card>
            <div style={{ fontSize: 13, color: C.textSec, marginBottom: 16, lineHeight: 1.6 }}>
              Standard Monte Carlo assumes you start at 0% drawdown. If you're already in drawdown, enter your current position to recalculate based on where you actually are.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
              <InputField label="Current drawdown on this account" value={condDD} onChange={setCondDD} suffix="%" />
              <InputField label="Remaining estimated trades" value={condTrades} onChange={setCondTrades} />
              <Btn onClick={runConditional} disabled={condRunning || !hasData || !condDD}>
                {condRunning ? 'Running…' : 'Recalculate'}
              </Btn>
            </div>

            {condResult && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, color: C.textSec, marginBottom: 12, fontWeight: 500 }}>
                  Conditional results — starting at {condDD}% drawdown
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                  <MetricCard label="Expected breaches" value={condResult.mean.toFixed(2)} />
                  <MetricCard label="Probability of 0 breaches" value={`${condResult.pZero.toFixed(1)}%`} highlight={condResult.pZero >= 70 ? C.green : condResult.pZero >= 40 ? C.orange : C.red} />
                  <MetricCard label="Median breaches" value={condResult.median.toFixed(0)} />
                  <MetricCard label="Worst case (95th pct)" value={condResult.p95.toFixed(0)} highlight={C.red} />
                </div>
                <BreachHistogram histogram={condResult.histogram} />
              </div>
            )}

            {!condResult && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, color: C.textTer, marginBottom: 12 }}>Conditional results — enter drawdown above and click Recalculate</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                  {['Expected breaches', 'Probability of 0 breaches', 'Median breaches', 'Worst case (95th pct)'].map(lbl => (
                    <MetricCard key={lbl} label={lbl} value="—" noData />
                  ))}
                </div>
                <BreachHistogram histogram={EMPTY_HISTOGRAM} />
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}
