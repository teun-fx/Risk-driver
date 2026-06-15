import { useMemo } from 'react';
import {
  winRate, avgWin, avgLoss, profitFactor, pLosingStreak, pDrawdownWithinN,
} from '../../utils/tradeStats';

const C = {
  bg: '#F5F5F7', card: '#FFFFFF', border: '#D2D2D7',
  text: '#1D1D1F', textSec: '#6E6E73', textTer: '#AEAEB2',
  accent: '#A1D533', red: '#FF3B30', green: '#34C759', orange: '#FF9500',
};

const MIN_TRADES = 50;

function InsightCard({ title, value, unit, explanation, color, warning }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: C.textSec, marginBottom: 10 }}>{title}</div>
      {warning ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
          <span style={{ fontSize: 12, color: C.orange, lineHeight: 1.5 }}>{warning}</span>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
            <span style={{ fontSize: 26, fontWeight: 700, color: color || C.text, letterSpacing: '-0.5px' }}>{value}</span>
            {unit && <span style={{ fontSize: 13, color: C.textSec }}>{unit}</span>}
          </div>
          <p style={{ fontSize: 12, color: C.textSec, margin: 0, lineHeight: 1.5 }}>{explanation}</p>
        </>
      )}
    </div>
  );
}

function calcBreakevenMonth(wr) {
  if (!wr) return null;
  const n = 20;
  let p = 0;
  for (let k = Math.ceil(n / 2); k <= n; k++) {
    let binom = 1;
    for (let i = 0; i < k; i++) binom = binom * (n - i) / (i + 1);
    p += binom * Math.pow(wr, k) * Math.pow(1 - wr, n - k);
  }
  return Math.min(1, p);
}

function calcExpectedBadDays(wr) {
  if (!wr) return null;
  return Math.pow(1 - wr, 2) * 22;
}

function calcNext10Profitable(wr, aw, al) {
  if (!wr || !aw || !al) return null;
  const minWins = Math.ceil((10 * al) / (aw + al));
  let p = 0;
  for (let k = Math.max(0, minWins); k <= 10; k++) {
    let binom = 1;
    for (let i = 0; i < k; i++) binom = binom * (10 - i) / (i + 1);
    p += binom * Math.pow(wr, k) * Math.pow(1 - wr, 10 - k);
  }
  return Math.min(1, p);
}

function calcBestWorstMonth(trades) {
  const byMonth = {};
  trades.forEach(t => {
    const k = String(t.date || '').slice(0, 7);
    if (k && k.length === 7) byMonth[k] = (byMonth[k] || 0) + (t.profit || 0);
  });
  const vals = Object.values(byMonth);
  if (vals.length < 3) return null;
  return { best: Math.max(...vals), worst: Math.min(...vals) };
}

function calcAvgRecovery(trades, startBal) {
  let peak = startBal, running = startBal;
  let inDD = false, ddStart = 0, recoveries = [];
  trades.forEach((t, i) => {
    running += t.profit || 0;
    if (running > peak) {
      if (inDD) { recoveries.push(i - ddStart); inDD = false; }
      peak = running;
    } else if (!inDD && running < peak * 0.97) { inDD = true; ddStart = i; }
  });
  if (!recoveries.length) return null;
  return Math.round(recoveries.reduce((s, v) => s + v, 0) / recoveries.length);
}

function calcDaysOver2R(trades) {
  const byDay = {};
  trades.forEach(t => {
    const k = String(t.date || '').slice(0, 10);
    if (!k || k.length < 8) return;
    byDay[k] = (byDay[k] || 0) + (parseFloat(t.rMultiple) || 0);
  });
  const days = Object.values(byDay);
  if (!days.length) return null;
  const over2R = days.filter(d => d >= 2).length;
  return { count: over2R, total: days.length, pct: over2R / days.length };
}

export default function InsightsTab({ trades, startBal }) {
  const wr  = useMemo(() => winRate(trades), [trades]);
  const aw  = useMemo(() => avgWin(trades), [trades]);
  const al  = useMemo(() => avgLoss(trades), [trades]);
  const pf  = useMemo(() => profitFactor(trades), [trades]);
  const enough = trades.length >= MIN_TRADES;
  const warn = `Insufficient data (${trades.length} trades). At least ${MIN_TRADES} trades required for reliable insights.`;

  const bew      = useMemo(() => calcBreakevenMonth(wr), [wr]);
  const badDays  = useMemo(() => calcExpectedBadDays(wr), [wr]);
  const next10   = useMemo(() => calcNext10Profitable(wr, aw, al), [wr, aw, al]);
  const bw       = useMemo(() => calcBestWorstMonth(trades), [trades]);
  const recovery = useMemo(() => calcAvgRecovery(trades, startBal), [trades, startBal]);
  const over2R   = useMemo(() => calcDaysOver2R(trades), [trades]);

  const pDD5  = useMemo(() => enough ? pDrawdownWithinN(trades, startBal, 5,  50, 3000) : null, [trades, startBal, enough]);
  const pDD10 = useMemo(() => enough ? pDrawdownWithinN(trades, startBal, 10, 50, 3000) : null, [trades, startBal, enough]);
  const pDD15 = useMemo(() => enough ? pDrawdownWithinN(trades, startBal, 15, 50, 3000) : null, [trades, startBal, enough]);

  function pct(v) { return v != null ? `${(v * 100).toFixed(1)}%` : '—'; }
  function money(v) { return v != null ? `${v >= 0 ? '+' : ''}$${Math.round(Math.abs(v)).toLocaleString()}` : '—'; }

  const insights = [
    {
      title: 'Probability of 3 losses in a row',
      value: pct(wr ? pLosingStreak(wr, 3) : null),
      color: wr && pLosingStreak(wr, 3) < 0.1 ? C.green : C.red,
      explanation: `At a ${pct(wr)} win rate, the probability of exactly 3 consecutive losses is ${pct(wr ? pLosingStreak(wr, 3) : null)}.`,
      warning: !wr ? warn : null,
    },
    {
      title: 'Probability of 4 losses in a row',
      value: pct(wr ? pLosingStreak(wr, 4) : null),
      color: wr && pLosingStreak(wr, 4) < 0.05 ? C.green : C.red,
      explanation: `Plan your pause rules around this. It will happen — the question is when.`,
      warning: !wr ? warn : null,
    },
    {
      title: 'Probability of 5 losses in a row',
      value: pct(wr ? pLosingStreak(wr, 5) : null),
      color: C.red,
      explanation: `A 5-loss streak at ${pct(wr)} win rate occurs roughly 1 in ${wr ? Math.round(1 / pLosingStreak(wr, 5)) : '—'} trades on average.`,
      warning: !wr ? warn : null,
    },
    {
      title: 'Probability of 6 losses in a row',
      value: pct(wr ? pLosingStreak(wr, 6) : null),
      color: C.red,
      explanation: `Even at 60% win rate this is ${pct(pLosingStreak(0.6, 6))}. Your risk management must be able to absorb this.`,
      warning: !wr ? warn : null,
    },
    {
      title: 'Probability of 7 losses in a row',
      value: pct(wr ? pLosingStreak(wr, 7) : null),
      color: C.red,
      explanation: `Extreme but realistic. Use this when setting your daily loss limits.`,
      warning: !wr ? warn : null,
    },
    {
      title: 'Probability of a break-even month',
      value: pct(bew),
      color: bew != null && bew > 0.5 ? C.green : C.orange,
      explanation: `Probability that a month ends at break-even or better at ${pct(wr)} win rate with ~20 trades/month.`,
      warning: !enough ? warn : null,
    },
    {
      title: 'Expected bad days / month',
      value: badDays != null ? badDays.toFixed(1) : '—',
      unit: 'days',
      color: C.orange,
      explanation: `Number of days per month with 2+ consecutive losses based on your historical win rate.`,
      warning: !wr ? warn : null,
    },
    {
      title: 'Probability next 10 trades are profitable overall',
      value: pct(next10),
      color: next10 != null && next10 > 0.6 ? C.green : C.orange,
      explanation: `P(net profit > 0) over the next 10 trades based on your historical win rate and average win/loss.`,
      warning: !enough ? warn : null,
    },
    {
      title: 'Probability of 5% drawdown within 50 trades',
      value: pct(pDD5),
      color: pDD5 != null && pDD5 < 0.3 ? C.green : C.red,
      explanation: `Monte Carlo (3,000×): how likely is a 5%+ equity drop within the next 50 trades?`,
      warning: !enough ? warn : null,
    },
    {
      title: 'Probability of 10% drawdown within 50 trades',
      value: pct(pDD10),
      color: pDD10 != null && pDD10 < 0.2 ? C.green : C.red,
      explanation: `How likely is a 10%+ drawdown within the next 50 trades?`,
      warning: !enough ? warn : null,
    },
    {
      title: 'Probability of 15% drawdown within 50 trades',
      value: pct(pDD15),
      color: pDD15 != null && pDD15 < 0.1 ? C.green : C.red,
      explanation: `Serious drawdown risk. Useful for prop firm challenge planning.`,
      warning: !enough ? warn : null,
    },
    {
      title: 'Best expected month',
      value: bw ? money(bw.best) : '—',
      color: C.green,
      explanation: `Best-performing month in your history. Use as a reference, not as a target.`,
      warning: !enough ? warn : null,
    },
    {
      title: 'Worst expected month',
      value: bw ? money(bw.worst) : '—',
      color: C.red,
      explanation: `Worst-performing month. Ensure your risk management can absorb this.`,
      warning: !enough ? warn : null,
    },
    {
      title: 'Avg. recovery time after drawdown',
      value: recovery != null ? String(recovery) : '—',
      unit: 'trades',
      color: C.orange,
      explanation: `Average number of trades to return to the previous equity high after a >3% drawdown.`,
      warning: !enough ? warn : null,
    },
    {
      title: 'Days with more than 2R profit',
      value: over2R ? `${over2R.count}/${over2R.total}` : '—',
      unit: over2R ? `(${pct(over2R.pct)})` : '',
      color: C.green,
      explanation: `Number of trading days with net >2R profit. Shows where most of your gains are concentrated.`,
      warning: !enough ? warn : null,
    },
    {
      title: 'Profit factor',
      value: pf != null ? pf.toFixed(2) : '—',
      color: pf != null && pf >= 1.5 ? C.green : pf != null && pf >= 1 ? C.orange : C.red,
      explanation: `Gross profit divided by gross loss. Above 1.5 is strong; below 1.0 is structurally losing.`,
      warning: trades.length < 20 ? warn : null,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.6 }}>
          Statistical insights based on {trades.length} trades.
          {!enough && (
            <span style={{ color: C.orange, fontWeight: 500 }}> Dataset is small (&lt;{MIN_TRADES} trades) — results are indicative.</span>
          )}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {insights.map(ins => <InsightCard key={ins.title} {...ins} />)}
      </div>
    </div>
  );
}
