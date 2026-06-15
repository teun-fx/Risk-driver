import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  winRate, avgWin, avgLoss, profitFactor, monteCarlo,
  recommendedRiskPct, tradesForTarget, pLosingStreak,
} from '../../utils/tradeStats';

const C = {
  bg: '#F5F5F7', card: '#FFFFFF', border: '#D2D2D7', shadow: '0 2px 8px rgba(0,0,0,0.06)',
  text: '#1D1D1F', textSec: '#6E6E73', textTer: '#AEAEB2',
  accent: '#A1D533', red: '#FF3B30', green: '#34C759', orange: '#FF9500',
  divider: '#F0F0F0',
};

function Card({ title, sub, children, style = {} }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 22px', boxShadow: C.shadow, ...style }}>
      {title && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{title}</div>
          {sub && <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>{sub}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${C.divider}` }}>
      <span style={{ fontSize: 13, color: C.textSec }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: color || C.text }}>{value}</span>
    </div>
  );
}

function fmtK(n) {
  const v = Number(n);
  if (isNaN(v)) return '—';
  return Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${Math.round(v)}`;
}

// No strategy linked state
function NoStrategyLinked() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 32px', background: '#FFF8E6', border: '1px solid #FFE08A', borderRadius: 14 }}>
      <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#8A6500', marginBottom: 8 }}>No strategy linked</div>
      <div style={{ fontSize: 13, color: '#8A6500', lineHeight: 1.6 }}>
        This analysis has no strategy linked to it. Go back and edit the analysis to link a strategy, so simulations can run.
      </div>
    </div>
  );
}

export default function PropFirmAnalysis({ analysis, strategy }) {
  const { rules, name, firmLabel } = analysis;
  const trades   = strategy?.tradeList || [];
  const startBal = rules.accountSize || strategy?.startingBalance || strategy?.equity || 10000;

  const wr  = useMemo(() => winRate(trades), [trades]);
  const aw  = useMemo(() => avgWin(trades), [trades]);
  const al  = useMemo(() => avgLoss(trades), [trades]);
  const pf  = useMemo(() => profitFactor(trades), [trades]);

  const recRisk = useMemo(() => {
    if (!wr || !aw || !al) return null;
    return recommendedRiskPct(wr, aw / (al || 1), 1, rules.maxTotalDD);
  }, [wr, aw, al, rules.maxTotalDD]);

  const mc = useMemo(() => monteCarlo(trades, startBal, 500), [trades, startBal]);

  const targetResult = useMemo(() => {
    if (!trades.length) return null;
    return tradesForTarget(trades, startBal, rules.target, 5000);
  }, [trades, startBal, rules.target]);

  // Prop firm reference levels
  const dailyDDLevel = startBal * (1 - rules.maxDailyDD / 100);
  const totalDDLevel = startBal * (1 - rules.maxTotalDD / 100);
  const targetLevel  = startBal * (1 + rules.target / 100);

  // Pass rate: % of MC paths that hit target without breaching total DD
  const passRate = useMemo(() => {
    if (!mc.allPaths?.length) return null;
    const passed = mc.allPaths.filter(path =>
      path.some(eq => eq >= targetLevel) && !path.some(eq => eq <= totalDDLevel)
    ).length;
    return passed / mc.allPaths.length;
  }, [mc.allPaths, targetLevel, totalDDLevel]);

  // Avg trades per day from historical data
  const avgTradesPerDay = useMemo(() => {
    if (!trades.length) return null;
    const days = new Set(trades.map(t => String(t.date || '').slice(0, 10)).filter(d => d && d.length >= 8));
    return days.size > 0 ? trades.length / days.size : null;
  }, [trades]);

  const expectedDays = targetResult?.median && avgTradesPerDay
    ? Math.ceil(targetResult.median / avgTradesPerDay)
    : null;

  // Risk warning: if recRisk > 1/maxStreak
  const worstStreak = trades.length >= 10
    ? Math.max(...Array.from({ length: trades.length }, (_, i) => {
        let streak = 0, max = 0;
        for (let j = i; j < trades.length; j++) {
          if ((trades[j].profit || 0) < 0) { streak++; max = Math.max(max, streak); } else streak = 0;
        }
        return max;
      }).filter(Boolean))
    : null;

  const riskWarning = recRisk && worstStreak && (recRisk * worstStreak > rules.maxTotalDD / 100);

  if (!strategy) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>{name}</div>
        <div style={{ fontSize: 13, color: C.textSec }}>{firmLabel} · DD {rules.maxTotalDD}% · Target {rules.target}% · ${Number(rules.accountSize || 0).toLocaleString()}</div>
      </div>
      <NoStrategyLinked />
    </div>
  );

  const noTrades = trades.length === 0;
  const insufficientData = trades.length < 20;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>{name}</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 9px', borderRadius: 6, background: '#E8F4FD', color: '#1A56A4' }}>{firmLabel}</span>
          <span style={{ fontSize: 12, color: C.textSec }}>→ {strategy.label}</span>
          <span style={{ fontSize: 12, color: C.textSec }}>{trades.length} trades</span>
          <span style={{ fontSize: 12, color: C.textSec }}>${Number(rules.accountSize || 0).toLocaleString()} account</span>
        </div>
      </div>

      {/* Insufficient data warning */}
      {insufficientData && !noTrades && (
        <div style={{ background: '#FFF8E6', border: '1px solid #FFE08A', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#8A6500', lineHeight: 1.6 }}>
          ⚠️ Only {trades.length} trades available — results may not be statistically reliable. We recommend at least 50 trades for meaningful simulations.
        </div>
      )}

      {noTrades && (
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '24px', textAlign: 'center', color: C.textSec, fontSize: 13 }}>
          The linked strategy "{strategy.label}" has no trades yet. Import trade data to run the simulation.
        </div>
      )}

      {/* Risk warning card */}
      {riskWarning && (
        <div style={{ background: '#FFF0F0', border: '1px solid #FFCCCC', borderRadius: 12, padding: '14px 16px', fontSize: 13, color: C.red, lineHeight: 1.6 }}>
          ⚠️ <strong>Risk warning:</strong> Your worst historical losing streak ({worstStreak} in a row) at the recommended risk of {recRisk != null ? (recRisk * 100).toFixed(2) : '—'}% per trade would cause a drawdown of{' '}
          {recRisk != null ? (recRisk * worstStreak * 100).toFixed(1) : '—'}%, which may exceed the prop firm's limit of {rules.maxTotalDD}%.
          Consider reducing risk to {recRisk != null ? ((rules.maxTotalDD / 100 / worstStreak) * 100).toFixed(2) : '—'}% or lower.
        </div>
      )}

      {/* Key metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <Card title="Recommended risk / trade">
          <div style={{ fontSize: 34, fontWeight: 700, color: C.accent, letterSpacing: '-1px', marginBottom: 8 }}>
            {recRisk != null ? `${(recRisk * 100).toFixed(2)}%` : '—'}
          </div>
          <div style={{ fontSize: 12, color: C.textSec, lineHeight: 1.6 }}>
            Based on half-Kelly ({wr != null ? `${(wr * 100).toFixed(1)}%` : '—'} win rate,{' '}
            {aw && al ? (aw / al).toFixed(2) : '—'} R:R) and {rules.maxTotalDD}% max DD limit.
          </div>
        </Card>

        <Card title="Pass rate (Monte Carlo 500×)">
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-1px', marginBottom: 8, color: passRate != null ? (passRate > 0.6 ? C.green : passRate > 0.3 ? C.orange : C.red) : C.textTer }}>
            {passRate != null ? `${(passRate * 100).toFixed(0)}%` : noTrades ? '—' : '…'}
          </div>
          <div style={{ fontSize: 12, color: C.textSec, lineHeight: 1.6 }}>
            Probability of hitting the {rules.target}% target without breaching the {rules.maxTotalDD}% drawdown limit.
          </div>
        </Card>

        <Card title="Expected days to pass">
          <div style={{ fontSize: 34, fontWeight: 700, color: C.text, letterSpacing: '-1px', marginBottom: 8 }}>
            {expectedDays != null ? expectedDays : '—'}
          </div>
          <div style={{ fontSize: 12, color: C.textSec, lineHeight: 1.6 }}>
            Based on median {targetResult?.median ?? '—'} trades to reach the target at {avgTradesPerDay != null ? avgTradesPerDay.toFixed(1) : '—'} trades/day average.{' '}
            {rules.minDays ? `Min. ${rules.minDays} trading days required.` : ''}
          </div>
        </Card>
      </div>

      {/* Trade count distribution */}
      {targetResult && (
        <Card title="Expected trades to pass" sub="Based on 5,000 Monte Carlo simulations">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
            {[
              { label: 'Best 25%',    value: targetResult.p25,    sub: 'fast scenario' },
              { label: 'Median',      value: targetResult.median, sub: 'most likely' },
              { label: 'Worst 25%',   value: targetResult.p75,    sub: 'slow scenario' },
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'center', padding: '14px 8px', background: C.bg, borderRadius: 12 }}>
                <div style={{ fontSize: 11, color: C.textSec, marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{m.value ?? '—'}</div>
                <div style={{ fontSize: 10, color: C.textTer, marginTop: 2 }}>trades · {m.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, color: C.textSec, background: C.bg, padding: '10px 14px', borderRadius: 10 }}>
            Success rate:{' '}
            <strong style={{ color: targetResult.pSuccess > 0.5 ? C.green : C.red }}>
              {(targetResult.pSuccess * 100).toFixed(0)}%
            </strong>
            {' '}of simulations reached the target.
          </div>
        </Card>
      )}

      {/* MC chart */}
      <Card title="Monte Carlo simulation — 500 equity paths" sub="Red lines = drawdown limits · Green line = profit target · Bold line = median path">
        {mc.result.length > 1 ? (
          <>
            <div style={{ display: 'flex', gap: 20, marginBottom: 12, fontSize: 12, color: C.textSec, flexWrap: 'wrap' }}>
              {[['P10 (worst 10%)', C.red], ['Median', C.text], ['P90 (best 10%)', C.accent]].map(([lbl, col]) => (
                <span key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 14, height: 2, background: col, display: 'inline-block', borderRadius: 1 }} />{lbl}
                </span>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mc.result} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="trade" tick={{ fontSize: 10, fill: C.textTer }} axisLine={false} tickLine={false}
                  label={{ value: 'Trades', position: 'insideBottomRight', offset: -8, fontSize: 11, fill: C.textTer }} />
                <YAxis tick={{ fontSize: 10, fill: C.textTer }} axisLine={false} tickLine={false} tickFormatter={v => fmtK(v)} width={54} />
                <Tooltip
                  contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12 }}
                  formatter={(v, n) => [fmtK(v), n]}
                />
                {/* Ghost paths */}
                {(mc.sampledPaths || []).slice(0, 40).map((path, i) => (
                  <Line key={`g${i}`} data={path} dataKey="v" stroke="rgba(0,0,0,0.04)" strokeWidth={1} dot={false} isAnimationActive={false} legendType="none" />
                ))}
                <Line dataKey="p10"    stroke={C.red}    strokeWidth={2} dot={false} name="P10" />
                <Line dataKey="median" stroke={C.text}   strokeWidth={2.5} dot={false} name="Median" />
                <Line dataKey="p90"    stroke={C.accent} strokeWidth={2} dot={false} name="P90" />
                {/* Firm limits */}
                <ReferenceLine y={totalDDLevel} stroke={C.red} strokeDasharray="6 3" strokeWidth={1.5}
                  label={{ value: `Max DD (${rules.maxTotalDD}%)`, position: 'insideTopRight', fontSize: 10, fill: C.red }} />
                <ReferenceLine y={dailyDDLevel} stroke="#FF9500" strokeDasharray="4 3" strokeWidth={1}
                  label={{ value: `Daily DD (${rules.maxDailyDD}%)`, position: 'insideTopLeft', fontSize: 10, fill: '#FF9500' }} />
                <ReferenceLine y={targetLevel} stroke={C.green} strokeDasharray="6 3" strokeWidth={1.5}
                  label={{ value: `Target (${rules.target}%)`, position: 'insideBottomRight', fontSize: 10, fill: C.green }} />
                <ReferenceLine y={startBal} stroke="rgba(0,0,0,0.15)" strokeDasharray="3 3" strokeWidth={1} />
              </LineChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textTer, fontSize: 13 }}>
            {noTrades ? 'Import trades to run the simulation.' : 'Not enough trades for simulation (need ≥2).'}
          </div>
        )}
      </Card>

      {/* Strategy stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title="Strategy statistics">
          <StatRow label="Win rate" value={wr != null ? `${(wr * 100).toFixed(1)}%` : '—'} color={wr != null && wr >= 0.5 ? C.green : C.red} />
          <StatRow label="Avg. win" value={aw != null ? `$${Math.round(aw)}` : '—'} color={C.green} />
          <StatRow label="Avg. loss" value={al != null ? `$${Math.round(al)}` : '—'} color={C.red} />
          <StatRow label="Profit factor" value={pf != null ? pf.toFixed(2) : '—'} color={pf != null && pf >= 1.5 ? C.green : pf != null && pf >= 1 ? C.textSec : C.red} />
          <StatRow label="Total trades" value={trades.length} />
          <StatRow label="Avg. trades / day" value={avgTradesPerDay != null ? avgTradesPerDay.toFixed(1) : '—'} />
        </Card>

        <Card title="Losing streak analysis">
          {[3, 4, 5, 6, 7].map(n => {
            const p = wr ? pLosingStreak(wr, n) : null;
            return (
              <div key={n} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: C.text }}>{n} losses in a row</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: p != null && p < 0.05 ? C.green : C.red }}>
                    {p != null ? `${(p * 100).toFixed(2)}%` : '—'}
                  </span>
                </div>
                <div style={{ height: 3, background: C.bg, borderRadius: 2 }}>
                  <div style={{ height: 3, width: `${Math.min(100, (p || 0) * 500)}%`, background: C.red, borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
          <div style={{ fontSize: 12, color: C.textSec, marginTop: 8, lineHeight: 1.5 }}>
            At {wr != null ? `${(wr * 100).toFixed(1)}%` : '—'} win rate, a streak of 5 losses occurs roughly 1 in {wr ? Math.round(1 / pLosingStreak(wr, 5)) : '—'} trades on average.
          </div>
        </Card>
      </div>
    </div>
  );
}
