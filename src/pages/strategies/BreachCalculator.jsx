import { useState, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  normalizeTrades, tradesPerMonth, ksTwoSample, lag1Autocorr,
  determineMethod, runSimulation,
} from '../../utils/breachCalculator';

const C = {
  bg: '#F4F6F8', card: '#FFFFFF', border: '#E8ECF0', shadow: '0 1px 4px rgba(0,0,0,0.06)',
  text: '#0F1728', textSec: '#5A6478', textTer: '#9AA3B2',
  accent: '#A1D533', accentText: '#5A8A00',
  red: '#F03D3D', redLight: 'rgba(240,61,61,0.08)',
  green: '#2DBD6E', greenLight: 'rgba(45,189,110,0.10)',
  orange: '#E07A00', orangeLight: 'rgba(224,122,0,0.09)',
  divider: '#E8ECF0',
};

const label = (text) => ({
  fontSize: 10, fontWeight: 600, letterSpacing: '1.5px',
  textTransform: 'uppercase', color: C.textTer, marginBottom: 10,
});

function Card({ children, style = {} }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px', boxShadow: C.shadow, ...style }}>
      {children}
    </div>
  );
}

function CheckCard({ title, value, threshold, pass, warn, detail }) {
  const color = pass === null ? C.textSec : warn ? C.orange : pass ? C.green : C.red;
  const bg = pass === null ? C.bg : warn ? C.orangeLight : pass ? C.greenLight : C.redLight;
  const badge = pass === null ? 'N/A' : warn ? 'WARNING' : pass ? 'PASS' : 'FAIL';
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{title}</div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: bg, color, letterSpacing: '0.8px' }}>{badge}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: C.textTer, marginBottom: detail ? 6 : 0 }}>{threshold}</div>
      {detail && <div style={{ fontSize: 12, color: warn || !pass ? color : C.textSec, marginTop: 4 }}>{detail}</div>}
    </Card>
  );
}

function MetricCard({ label: lbl, value, sub, highlight }) {
  return (
    <Card>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: C.textTer, marginBottom: 8 }}>{lbl}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: highlight || C.text, marginBottom: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.textSec }}>{sub}</div>}
    </Card>
  );
}

function Input({ label: lbl, value, onChange, suffix, readOnly, type = 'number' }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: C.textSec, marginBottom: 5, fontWeight: 500 }}>{lbl}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0 10px', height: 36 }}>
        <input
          type={type}
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

function Select({ label: lbl, value, onChange, options }) {
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

function BreachHistogram({ histogram }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={histogram} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: C.textSec }} axisLine={false} tickLine={false} label={{ value: 'Number of breaches', position: 'insideBottom', offset: -2, fontSize: 11, fill: C.textTer }} />
        <YAxis tickFormatter={v => `${v.toFixed(1)}%`} tick={{ fontSize: 11, fill: C.textTer }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(v) => [`${v.toFixed(2)}%`, '% of simulations']}
          contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
        />
        <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
          {histogram.map((_, i) => <Cell key={i} fill={BAR_COLORS[i] || BAR_COLORS[4]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function BreachCalculator({ trades }) {
  // Settings
  const [ddLimit, setDdLimit] = useState(10);
  const [repurchase, setRepurchase] = useState(2);
  const [horizon, setHorizon] = useState(24);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  // Conditional
  const [condDD, setCondDD] = useState('');
  const [condTrades, setCondTrades] = useState('');
  const [condResult, setCondResult] = useState(null);
  const [condRunning, setCondRunning] = useState(false);

  const normalized = useMemo(() => normalizeTrades(trades), [trades]);

  const diagnostics = useMemo(() => {
    if (!normalized.length) return null;
    const tpm = tradesPerMonth(trades);
    const mid = Math.floor(normalized.length / 2);
    const firstHalf = normalized.slice(0, mid);
    const secondHalf = normalized.slice(mid);
    const ks = firstHalf.length >= 2 && secondHalf.length >= 2 ? ksTwoSample(firstHalf, secondHalf) : null;
    const autocorr = lag1Autocorr(normalized);
    const method = determineMethod(tpm, autocorr, ks?.pValue ?? 1);
    return { tpm, ks, autocorr, method };
  }, [normalized, trades]);

  const runSim = useCallback(() => {
    setRunning(true);
    setResult(null);
    // Defer to let UI update
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
    if (isNaN(dd) || dd < 0 || dd >= Number(ddLimit)) return;
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

  if (!trades.length) {
    return (
      <div style={{ padding: '48px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 12 }}>📂</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.textSec, marginBottom: 6 }}>Load trade data first</div>
        <div style={{ fontSize: 13, color: C.textTer }}>Load trade data first to run the Breach Calculator.</div>
      </div>
    );
  }

  const { tpm, ks, autocorr, method } = diagnostics || {};
  const tpmPass = tpm >= 30;
  const tpmWarn = tpm < 30;
  const ksPass = ks ? ks.pValue > 0.05 : null;
  const autocorrInterp = !autocorr
    ? 'Independent — standard Monte Carlo applicable'
    : autocorr > 0.4
      ? 'Path-dependent — particle filter recommended'
      : autocorr >= 0.1
        ? 'Weak signal — too noisy for live filtering'
        : 'Independent — standard Monte Carlo applicable';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* STEP 2 — Diagnostics */}
      <div>
        <div style={label()}>Diagnostic Checks</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <CheckCard
            title="A — Trades / month"
            value={tpm?.toFixed(1) ?? '—'}
            threshold="Threshold: ≥ 30 = reliable"
            pass={!tpmWarn}
            warn={false}
            detail={tpmWarn ? 'Below 30 trades/month reduces detection reliability.' : undefined}
          />
          <CheckCard
            title="B — Stationarity (KS-test)"
            value={ks ? `p = ${ks.pValue.toFixed(3)}` : '—'}
            threshold="Threshold: p > 0.05 = stationary"
            pass={ksPass}
            warn={false}
            detail={ksPass === true
              ? 'Stationary — historical data is a reliable prior.'
              : ksPass === false
                ? 'Non-stationary — distribution shifted between periods.'
                : 'Insufficient data for KS-test.'}
          />
          <CheckCard
            title="C — Lag-1 Autocorrelation"
            value={autocorr != null ? autocorr.toFixed(3) : '—'}
            threshold={autocorr > 0.4 ? '> 0.4' : autocorr >= 0.1 ? '0.1–0.4' : '< 0.1'}
            pass={autocorr != null ? autocorr < 0.1 : null}
            warn={autocorr != null && autocorr >= 0.1 && autocorr <= 0.4}
            detail={autocorrInterp}
          />
        </div>
      </div>

      {/* Method Verdict */}
      {method && (
        <Card style={{ borderLeft: `3px solid ${C.accent}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: C.textTer, marginBottom: 6 }}>Method Verdict</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>Method {method.id}: {method.name}</div>
              <div style={{ fontSize: 13, color: C.textSec, marginBottom: 4 }}>{method.desc}</div>
              <div style={{ fontSize: 12, color: C.textTer }}>Recommended update cycle: {method.update}</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.accent, opacity: 0.4, paddingLeft: 16 }}>M{method.id}</div>
          </div>
        </Card>
      )}

      {/* STEP 3 — Settings */}
      <div>
        <div style={label()}>Simulation Settings</div>
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
            <Input label="Drawdown limit" value={ddLimit} onChange={setDdLimit} suffix="%" />
            <Select
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
            <Select
              label="Time horizon"
              value={horizon}
              onChange={setHorizon}
              options={[
                { value: 12, label: '12 months' },
                { value: 24, label: '24 months' },
                { value: 36, label: '36 months' },
              ]}
            />
            <Input label="Simulations" value="5,000" readOnly />
          </div>
          <Btn onClick={runSim} disabled={running}>
            {running ? 'Running 5,000 simulations…' : 'Run Simulation'}
          </Btn>
        </Card>
      </div>

      {/* STEP 5 — Results */}
      {result && (
        <div>
          <div style={label()}>Simulation Results — {result.accountsPerSim} accounts over {horizon} months</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            <MetricCard label="Expected breaches" value={result.mean.toFixed(2)} sub="Mean across 5,000 runs" />
            <MetricCard label="Probability of 0 breaches" value={`${result.pZero.toFixed(1)}%`} highlight={result.pZero >= 70 ? C.green : result.pZero >= 40 ? C.orange : C.red} />
            <MetricCard label="Median breaches" value={result.median.toFixed(0)} />
            <MetricCard label="Worst case (95th pct)" value={result.p95.toFixed(0)} sub="Breaches in worst 5% of runs" highlight={C.red} />
          </div>

          <Card>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: C.textTer, marginBottom: 14 }}>Breach Distribution</div>
            <BreachHistogram histogram={result.histogram} />
          </Card>
        </div>
      )}

      {/* STEP 6 — Conditional Analysis */}
      {result && (
        <div>
          <div style={label()}>Conditional Analysis — Where are you now?</div>
          <Card>
            <div style={{ fontSize: 13, color: C.textSec, marginBottom: 16, lineHeight: 1.6 }}>
              Standard Monte Carlo assumes you start at 0% drawdown. If you're already in drawdown, enter your current position to recalculate based on where you actually are.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
              <Input
                label="Current drawdown on this account"
                value={condDD}
                onChange={setCondDD}
                suffix="%"
              />
              <Input
                label="Remaining estimated trades"
                value={condTrades}
                onChange={setCondTrades}
              />
              <Btn onClick={runConditional} disabled={condRunning || !condDD}>
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
          </Card>
        </div>
      )}
    </div>
  );
}
