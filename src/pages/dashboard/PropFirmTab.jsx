import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import {
  winRate, avgWin, avgLoss, profitFactor, monteCarlo,
  recommendedRiskPct, tradesForTarget, pLosingStreak,
} from '../../utils/tradeStats';

const T = {
  bg: '#F5F5F7', card: '#FFFFFF', border: '#D2D2D7',
  text: '#1D1D1F', textSec: '#6E6E73', textTer: '#AEAEB2',
  accent: '#A1D533', divider: '#F0F0F0', red: '#FF3B30', green: '#34C759',
};

function Field({ label, value, onChange, suffix, placeholder }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 500, color: T.textSec, display: 'block', marginBottom: 6 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        <input
          type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || '0'}
          style={{
            flex: 1, padding: '9px 12px', border: `1px solid ${T.border}`, borderRadius: suffix ? '10px 0 0 10px' : 10,
            background: '#FAFAFA', fontSize: 14, color: T.text, fontFamily: 'inherit', outline: 'none',
          }}
        />
        {suffix && (
          <span style={{ padding: '9px 12px', background: T.bg, border: `1px solid ${T.border}`, borderLeft: 'none', borderRadius: '0 10px 10px 0', fontSize: 13, color: T.textSec }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${T.divider}` }}>
      <span style={{ fontSize: 13, color: T.textSec }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: color || T.text }}>{value}</span>
    </div>
  );
}

function Card({ title, children, style = {} }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: '20px 22px', ...style }}>
      {title && <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 16 }}>{title}</div>}
      {children}
    </div>
  );
}

export default function PropFirmTab({ trades, startBal }) {
  const [rules, setRules] = useState({ maxDailyDD: 5, maxTotalDD: 10, target: 10, maxPerDay: 4, minDays: 10 });
  const [configured, setConfigured] = useState(false);

  const wr     = useMemo(() => winRate(trades), [trades]);
  const aw     = useMemo(() => avgWin(trades), [trades]);
  const al     = useMemo(() => avgLoss(trades), [trades]);
  const pf     = useMemo(() => profitFactor(trades), [trades]);

  const recRisk = useMemo(() => {
    if (!wr || !aw || !al) return null;
    return recommendedRiskPct(wr, aw / (al || 1), al / (al || 1), rules.maxTotalDD);
  }, [wr, aw, al, rules.maxTotalDD]);

  const mc = useMemo(() => monteCarlo(trades, startBal, 500), [trades, startBal]);

  const targetResult = useMemo(() => {
    if (!configured) return null;
    return tradesForTarget(trades, startBal, rules.target, 5000);
  }, [configured, trades, startBal, rules.target]);

  // Prop firm drawdown limits as absolute equity levels
  const dailyDDLine  = startBal * (1 - rules.maxDailyDD / 100);
  const totalDDLine  = startBal * (1 - rules.maxTotalDD / 100);
  const targetLine   = startBal * (1 + rules.target / 100);

  function fmt(n, d = 1) { return n != null ? Number(n).toFixed(d) : '—'; }
  function fmtK(n) {
    const v = Number(n);
    return Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${Math.round(v)}`;
  }

  if (!configured) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '12px 0' }}>
        <Card title="Prop firm regels instellen">
          <p style={{ fontSize: 14, color: T.textSec, marginBottom: 20, lineHeight: 1.6 }}>
            Vul de regels van je prop firm in. Het dashboard berekent daarna aanbevolen risico en verwachte doorlooptijd.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <Field label="Max dagelijkse drawdown" value={rules.maxDailyDD} suffix="%" onChange={v => setRules(r => ({ ...r, maxDailyDD: v }))} />
            <Field label="Max totale drawdown" value={rules.maxTotalDD} suffix="%" onChange={v => setRules(r => ({ ...r, maxTotalDD: v }))} />
            <Field label="Winstdoel" value={rules.target} suffix="%" onChange={v => setRules(r => ({ ...r, target: v }))} />
            <Field label="Max trades per dag" value={rules.maxPerDay} onChange={v => setRules(r => ({ ...r, maxPerDay: v }))} />
            <Field label="Min. trading dagen" value={rules.minDays} onChange={v => setRules(r => ({ ...r, minDays: v }))} />
          </div>
          <button onClick={() => setConfigured(true)} style={{
            width: '100%', padding: '12px', background: T.accent, color: '#1D1D1F', border: 'none',
            borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>Berekenen →</button>
        </Card>
      </div>
    );
  }

  const losingStreakP = [3, 4, 5, 6].map(n => ({
    n, p: wr ? pLosingStreak(wr, n) : null,
  }));

  // Count MC paths that breach maxTotalDD
  const breachCount = mc.allPaths
    ? mc.allPaths.filter(path => path.some(eq => eq <= totalDDLine)).length
    : 0;
  const passCount = mc.allPaths ? mc.allPaths.length - breachCount : 0;
  const passRate = mc.allPaths ? passCount / mc.allPaths.length : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* top reset bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, color: T.textSec }}>
          Regels: max DD {rules.maxTotalDD}% · doel {rules.target}% · max {rules.maxPerDay} trades/dag
        </div>
        <button onClick={() => setConfigured(false)} style={{
          fontSize: 13, padding: '6px 14px', border: `1px solid ${T.border}`, borderRadius: 8,
          background: T.card, color: T.textSec, cursor: 'pointer', fontFamily: 'inherit',
        }}>Regels aanpassen</button>
      </div>

      {/* recommended risk + stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <Card title="Aanbevolen risico per trade">
          <div style={{ fontSize: 36, fontWeight: 700, color: T.accent, letterSpacing: '-1px', marginBottom: 8 }}>
            {recRisk != null ? `${(recRisk * 100).toFixed(2)}%` : '—'}
          </div>
          <p style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6, margin: 0 }}>
            Berekend op basis van half-Kelly ({fmt(wr ? wr * 100 : null)}% winrate, {fmt(aw && al ? aw / al : null)}R:R) en max drawdown limiet {rules.maxTotalDD}%.
            Een losing streak van 6 zou maximaal {recRisk != null ? fmt(recRisk * 6 * 100) : '—'}% drawdown veroorzaken.
          </p>
        </Card>

        <Card title="Historische statistieken">
          <div style={{ marginTop: -4 }}>
            <StatRow label="Winrate" value={wr != null ? `${(wr * 100).toFixed(1)}%` : '—'} color={wr >= 0.5 ? T.green : T.red} />
            <StatRow label="Gem. winst" value={aw != null ? `$${Math.round(aw)}` : '—'} color={T.green} />
            <StatRow label="Gem. verlies" value={al != null ? `$${Math.round(al)}` : '—'} color={T.red} />
            <StatRow label="Profit factor" value={pf != null ? pf.toFixed(2) : '—'} color={pf >= 1.5 ? T.green : pf >= 1 ? T.textSec : T.red} />
            <StatRow label="Trades in data" value={trades.length} />
          </div>
        </Card>

        <Card title="Kans op doorhalen (MC 500×)">
          <div style={{ fontSize: 36, fontWeight: 700, color: passRate != null && passRate > 0.7 ? T.green : T.red, letterSpacing: '-1px', marginBottom: 8 }}>
            {passRate != null ? `${(passRate * 100).toFixed(0)}%` : '—'}
          </div>
          <p style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6, margin: 0 }}>
            kans op challenge halen zonder de max drawdown van {rules.maxTotalDD}% te raken,
            op basis van 500 Monte Carlo simulaties met jouw trade-historiek.
          </p>
        </Card>
      </div>

      {/* MC chart */}
      <Card title={`Monte Carlo simulatie — 500 equity paden`}>
        {mc.result.length > 1 ? (
          <>
            <div style={{ display: 'flex', gap: 20, marginBottom: 12, fontSize: 12, color: T.textSec }}>
              {[['P10 (slechtste 10%)', '#FF6B6B'], ['Mediaan', '#1D1D1F'], ['P90 (beste 10%)', T.accent]].map(([lbl, col]) => (
                <span key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 14, height: 2, background: col, display: 'inline-block', borderRadius: 1 }} />{lbl}
                </span>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={mc.result} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="trade" tick={{ fontSize: 10, fill: T.textTer }} axisLine={false} tickLine={false} label={{ value: 'Trades', position: 'insideBottomRight', offset: -8, fontSize: 11, fill: T.textTer }} />
                <YAxis tick={{ fontSize: 10, fill: T.textTer }} axisLine={false} tickLine={false} tickFormatter={v => fmtK(v)} width={52} />
                <Tooltip
                  contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 12 }}
                  formatter={(v, name) => [`$${Math.round(v).toLocaleString()}`, name]}
                />
                {(mc.sampledPaths || []).slice(0, 40).map((path, i) => (
                  <Line key={`g${i}`} data={path} dataKey="v" stroke="rgba(0,0,0,0.04)" strokeWidth={1} dot={false} isAnimationActive={false} legendType="none" />
                ))}
                <Line dataKey="p10"    stroke="#FF6B6B" strokeWidth={2} dot={false} name="P10" />
                <Line dataKey="median" stroke="#1D1D1F" strokeWidth={2} dot={false} name="Mediaan" />
                <Line dataKey="p90"    stroke={T.accent} strokeWidth={2} dot={false} name="P90" />
                {/* Prop firm limits */}
                <ReferenceLine y={totalDDLine} stroke={T.red} strokeDasharray="5 3" strokeWidth={1.5}
                  label={{ value: `Max DD (${rules.maxTotalDD}%)`, position: 'insideTopRight', fontSize: 10, fill: T.red }} />
                <ReferenceLine y={targetLine} stroke={T.green} strokeDasharray="5 3" strokeWidth={1.5}
                  label={{ value: `Doel (${rules.target}%)`, position: 'insideBottomRight', fontSize: 10, fill: T.green }} />
              </LineChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textTer, fontSize: 13 }}>
            Onvoldoende trades voor simulatie
          </div>
        )}
      </Card>

      {/* Target timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={`Verwachte doorlooptijd naar ${rules.target}% doel`}>
          {targetResult ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { label: '25e percentiel', value: targetResult.p25, sub: 'snel scenario' },
                  { label: 'Mediaan', value: targetResult.median, sub: 'meest waarschijnlijk' },
                  { label: '75e percentiel', value: targetResult.p75, sub: 'traag scenario' },
                ].map(m => (
                  <div key={m.label} style={{ textAlign: 'center', padding: '14px 8px', background: T.bg, borderRadius: 12 }}>
                    <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: T.text }}>{m.value}</div>
                    <div style={{ fontSize: 10, color: T.textTer, marginTop: 2 }}>trades · {m.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 13, color: T.textSec, background: T.bg, padding: '10px 14px', borderRadius: 10 }}>
                Slagingskans op basis van simulatie:{' '}
                <strong style={{ color: targetResult.pSuccess > 0.5 ? T.green : T.red }}>
                  {(targetResult.pSuccess * 100).toFixed(0)}%
                </strong>
                {' '}(van de 5000 simulaties haalt {Math.round(targetResult.pSuccess * 5000)} het doel)
              </div>
              {rules.minDays > 0 && (
                <div style={{ fontSize: 12, color: T.textSec, marginTop: 10 }}>
                  Met max {rules.maxPerDay} trades/dag en min. {rules.minDays} handelsdagen duurt dit minimaal {rules.minDays} en gemiddeld {Math.ceil(targetResult.median / rules.maxPerDay)} dagen.
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: T.textTer, fontSize: 13 }}>Onvoldoende data</div>
          )}
        </Card>

        <Card title="Kans op losing streaks">
          <p style={{ fontSize: 12, color: T.textSec, marginBottom: 14, lineHeight: 1.5 }}>
            Op basis van winrate {wr != null ? `${(wr * 100).toFixed(1)}%` : '—'} — de kans dat deze verliesreeks exact zo voorkomt.
          </p>
          {losingStreakP.map(({ n, p }) => (
            <div key={n} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: T.text }}>{n} verliezen op rij</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: p != null && p < 0.05 ? T.green : T.red }}>
                  {p != null ? `${(p * 100).toFixed(2)}%` : '—'}
                </span>
              </div>
              <div style={{ height: 4, background: T.bg, borderRadius: 2 }}>
                <div style={{ height: 4, width: `${Math.min(100, (p || 0) * 100 * 10)}%`, background: T.red, borderRadius: 2, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
