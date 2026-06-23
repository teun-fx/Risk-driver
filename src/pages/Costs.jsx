import { useState, useMemo } from 'react';
import { DARK as t } from '../theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const COST_CATEGORIES = [
  { id: 'prop_fee',     label: 'Prop Firm Fee' },
  { id: 'subscription', label: 'Software Subscription' },
  { id: 'one_time',     label: 'One-time Purchase' },
  { id: 'other',        label: 'Other' },
];

const DUMMY_COSTS = [
  { id: 1, date: '2026-01-15', category: 'prop_fee',     name: 'FTMO Challenge',        amount: 540,   recurring: false,  recurringPeriod: null },
  { id: 2, date: '2026-01-01', category: 'subscription', name: 'TradingView Pro',        amount: 14.99, recurring: true,   recurringPeriod: 'monthly' },
  { id: 3, date: '2026-02-05', category: 'prop_fee',     name: 'Apex Trader Funding',   amount: 167,   recurring: false,  recurringPeriod: null },
  { id: 4, date: '2026-02-01', category: 'subscription', name: 'TradingView Pro',        amount: 14.99, recurring: true,   recurringPeriod: 'monthly' },
  { id: 5, date: '2026-03-01', category: 'subscription', name: 'TradingView Pro',        amount: 14.99, recurring: true,   recurringPeriod: 'monthly' },
  { id: 6, date: '2026-03-15', category: 'one_time',     name: 'Trading Journal License', amount: 49,   recurring: false,  recurringPeriod: null },
  { id: 7, date: '2026-04-01', category: 'subscription', name: 'TradingView Pro',        amount: 14.99, recurring: true,   recurringPeriod: 'monthly' },
  { id: 8, date: '2026-05-01', category: 'subscription', name: 'TradingView Pro',        amount: 14.99, recurring: true,   recurringPeriod: 'monthly' },
  { id: 9, date: '2026-06-01', category: 'subscription', name: 'TradingView Pro',        amount: 14.99, recurring: true,   recurringPeriod: 'monthly' },
];

const DUMMY_PAYOUTS = [
  { id: 1, date: '2026-03-20', account: 'FTMO Funded #1',   propFirm: 'FTMO',               amount: 2400 },
  { id: 2, date: '2026-04-15', account: 'Apex Funded',      propFirm: 'Apex Trader Funding', amount: 1500 },
  { id: 3, date: '2026-05-10', account: 'FTMO Funded #1',   propFirm: 'FTMO',               amount: 3200 },
  { id: 4, date: '2026-06-05', account: 'Topstep Funded',   propFirm: 'Topstep',            amount: 980 },
];

const THIS_MONTH = new Date().toISOString().slice(0, 7);
const fmtUSD = (n) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtMonth = (ym) => {
  if (!ym || ym.length < 7) return ym;
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
};
const categoryLabel = (id) => COST_CATEGORIES.find(c => c.id === id)?.label ?? id;

// ─── Reusable UI ─────────────────────────────────────────────────────────────

function Input({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      {label && <div style={{ fontSize: 12, color: t.textSec, marginBottom: 5, fontWeight: 500 }}>{label}</div>}
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder || ''}
        style={{
          width: '100%', padding: '9px 12px', background: t.cardInner, border: `1px solid ${t.border}`,
          borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: t.text,
          outline: 'none', boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      {label && <div style={{ fontSize: 12, color: t.textSec, marginBottom: 5, fontWeight: 500 }}>{label}</div>}
      <select
        value={value} onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '9px 12px', background: t.cardInner, border: `1px solid ${t.border}`,
          borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: t.text,
          outline: 'none', boxSizing: 'border-box', cursor: 'pointer',
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{
      width: 40, height: 23, borderRadius: 12, cursor: 'pointer', flexShrink: 0,
      background: value ? t.accent : t.cardInner, border: `1px solid ${value ? t.accent : t.border}`,
      position: 'relative', transition: 'background 0.2s',
    }}>
      <div style={{
        position: 'absolute', top: 2, left: value ? 18 : 2, width: 17, height: 17,
        borderRadius: '50%', background: '#fff', transition: 'left 0.18s',
      }} />
    </div>
  );
}

function Seg({ value, onChange, options }) {
  return (
    <div style={{ display: 'flex', background: t.cardInner, borderRadius: 8, padding: 2, gap: 2 }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{
          flex: 1, padding: '5px 10px', borderRadius: 6, border: 'none', fontFamily: 'inherit',
          fontSize: 12, fontWeight: 500, cursor: 'pointer',
          background: value === o.value ? t.accent : 'transparent',
          color: value === o.value ? '#000' : t.textSec,
        }}>{o.label}</button>
      ))}
    </div>
  );
}

function TRow({ label, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0' }}>
      <span style={{ fontSize: 13, color: t.text }}>{label}</span>
      {children}
    </div>
  );
}

function Btn({ onClick, children, variant = 'primary' }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 16px', borderRadius: 10, border: variant === 'primary' ? 'none' : `1px solid ${t.border}`,
      background: variant === 'primary' ? t.accent : 'transparent',
      color: variant === 'primary' ? '#000' : t.textSec,
      fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    }}>{children}</button>
  );
}

// ─── Add Cost modal ───────────────────────────────────────────────────────────

function AddCostModal({ onClose, onAdd }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    date: today, category: 'prop_fee', name: '', amount: '', recurring: false, recurringPeriod: 'monthly',
  });
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function submit() {
    if (!form.name || !form.amount) return;
    onAdd({
      id: Date.now(), date: form.date, category: form.category, name: form.name,
      amount: parseFloat(form.amount), recurring: form.recurring,
      recurringPeriod: form.recurring ? form.recurringPeriod : null,
    });
    onClose();
  }

  return (
    <Overlay onClose={onClose}>
      <ModalBox title="Add Cost" onClose={onClose}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Date" type="date" value={form.date} onChange={v => set('date', v)} />
            <Input label="Amount ($)" type="number" value={form.amount} onChange={v => set('amount', v)} placeholder="0.00" />
          </div>
          <Select label="Category" value={form.category} onChange={v => set('category', v)}
            options={COST_CATEGORIES.map(c => ({ value: c.id, label: c.label }))} />
          <Input label="Name" value={form.name} onChange={v => set('name', v)} placeholder="e.g. FTMO Challenge" />
          <TRow label="Recurring">
            <Toggle value={form.recurring} onChange={v => set('recurring', v)} />
          </TRow>
          {form.recurring && (
            <Seg value={form.recurringPeriod} onChange={v => set('recurringPeriod', v)}
              options={[{ value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }]} />
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <button onClick={submit} disabled={!form.name || !form.amount} style={{
              flex: 1, padding: '10px', borderRadius: 12, border: 'none', fontFamily: 'inherit',
              background: form.name && form.amount ? t.accent : t.rowBg,
              color: form.name && form.amount ? '#000' : t.textSec,
              fontSize: 14, fontWeight: 600, cursor: form.name && form.amount ? 'pointer' : 'not-allowed',
            }}>Add Cost</button>
          </div>
        </div>
      </ModalBox>
    </Overlay>
  );
}

// ─── Add Payout modal ─────────────────────────────────────────────────────────

function AddPayoutModal({ onClose, onAdd }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ date: today, account: '', propFirm: '', amount: '' });
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function submit() {
    if (!form.account || !form.amount) return;
    onAdd({ id: Date.now(), date: form.date, account: form.account, propFirm: form.propFirm, amount: parseFloat(form.amount) });
    onClose();
  }

  return (
    <Overlay onClose={onClose}>
      <ModalBox title="Add Payout" onClose={onClose}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Date" type="date" value={form.date} onChange={v => set('date', v)} />
            <Input label="Amount ($)" type="number" value={form.amount} onChange={v => set('amount', v)} placeholder="0.00" />
          </div>
          <Input label="Account name" value={form.account} onChange={v => set('account', v)} placeholder="e.g. FTMO Funded" />
          <Input label="Prop firm" value={form.propFirm} onChange={v => set('propFirm', v)} placeholder="e.g. FTMO" />
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <button onClick={submit} disabled={!form.account || !form.amount} style={{
              flex: 1, padding: '10px', borderRadius: 12, border: 'none', fontFamily: 'inherit',
              background: form.account && form.amount ? t.accent : t.rowBg,
              color: form.account && form.amount ? '#000' : t.textSec,
              fontSize: 14, fontWeight: 600, cursor: form.account && form.amount ? 'pointer' : 'not-allowed',
            }}>Add Payout</button>
          </div>
        </div>
      </ModalBox>
    </Overlay>
  );
}

function Overlay({ onClose, children }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      {children}
    </div>
  );
}

function ModalBox({ title, onClose, children }) {
  return (
    <div style={{ background: t.card, borderRadius: 20, width: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.65)', overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: t.text }}>{title}</div>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: 20, color: t.textSec, cursor: 'pointer' }}>×</button>
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  );
}

// ─── Metric cards ─────────────────────────────────────────────────────────────

function MetricCard({ label, value, color }) {
  return (
    <div style={{ background: t.card, borderRadius: 18, padding: '18px 20px' }}>
      <div style={{ fontSize: 12, color: t.textSec, marginBottom: 8, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.3px', color: color || t.text }}>{value}</div>
    </div>
  );
}

// ─── Table helpers ────────────────────────────────────────────────────────────

const TH = ({ children, right }) => (
  <th style={{
    textAlign: right ? 'right' : 'left', fontSize: 11, color: t.textTer, fontWeight: 500,
    padding: '0 0 12px', borderBottom: `1px solid ${t.border}`, letterSpacing: '0.04em',
  }}>{children}</th>
);

const TD = ({ children, right, color }) => (
  <td style={{
    padding: '11px 0', fontSize: 13, color: color || t.text, fontWeight: 500,
    textAlign: right ? 'right' : 'left',
  }}>{children}</td>
);

function TableWrap({ children }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      {children}
    </table>
  );
}

// ─── Top Payouts scoreboard ───────────────────────────────────────────────────

const MEDAL = [
  { rank: 1, label: '1st', color: '#FFD700' },
  { rank: 2, label: '2nd', color: '#C0C0C0' },
  { rank: 3, label: '3rd', color: '#CD7F32' },
];

function TopPayouts({ payouts }) {
  const top3 = [...payouts].sort((a, b) => b.amount - a.amount).slice(0, 3);
  if (!top3.length) {
    return (
      <div style={{ background: t.card, borderRadius: 18, padding: '24px 24px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 16 }}>Top Payouts</div>
        <div style={{ fontSize: 13, color: t.textTer, textAlign: 'center', padding: '24px 0' }}>No payouts recorded yet.</div>
      </div>
    );
  }
  return (
    <div style={{ background: t.card, borderRadius: 18, padding: '24px 24px' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 18 }}>Top Payouts</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {top3.map((p, i) => {
          const medal = MEDAL[i];
          return (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: t.cardInner, borderRadius: 12, padding: '14px 16px',
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: medal.color, width: 28, textAlign: 'center', flexShrink: 0 }}>
                {medal.label}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{p.account}</div>
                <div style={{ fontSize: 11, color: t.textSec, marginTop: 2 }}>{p.propFirm} · {p.date}</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: t.accent }}>{fmtUSD(p.amount)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab: Subscriptions & Fees ────────────────────────────────────────────────

function CostsTab({ costs, onDelete }) {
  const sorted = [...costs].sort((a, b) => b.date.localeCompare(a.date));
  if (!sorted.length) {
    return <div style={{ fontSize: 13, color: t.textTer, padding: '32px 0', textAlign: 'center' }}>No cost entries yet. Click + Add Cost to get started.</div>;
  }
  return (
    <TableWrap>
      <thead>
        <tr>
          <TH>Date</TH>
          <TH>Name</TH>
          <TH>Category</TH>
          <TH>Recurring</TH>
          <TH right>Amount</TH>
        </tr>
      </thead>
      <tbody>
        {sorted.map((c, i) => (
          <tr key={c.id} style={{ borderBottom: i < sorted.length - 1 ? `1px solid ${t.border}` : 'none' }}>
            <TD><span style={{ color: t.textSec }}>{c.date}</span></TD>
            <TD>{c.name}</TD>
            <TD><span style={{ fontSize: 11, color: t.textSec }}>{categoryLabel(c.category)}</span></TD>
            <TD>
              {c.recurring
                ? <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'rgba(100,210,255,0.1)', color: '#64D2FF' }}>{c.recurringPeriod}</span>
                : <span style={{ color: t.textTer, fontSize: 12 }}>—</span>}
            </TD>
            <TD right color={t.red}>{fmtUSD(c.amount)}</TD>
          </tr>
        ))}
      </tbody>
    </TableWrap>
  );
}

// ─── Tab: Payouts ─────────────────────────────────────────────────────────────

function PayoutsTab({ payouts }) {
  const sorted = [...payouts].sort((a, b) => b.date.localeCompare(a.date));
  if (!sorted.length) {
    return <div style={{ fontSize: 13, color: t.textTer, padding: '32px 0', textAlign: 'center' }}>No payouts recorded yet. Click + Add Payout to get started.</div>;
  }
  return (
    <TableWrap>
      <thead>
        <tr>
          <TH>Date</TH>
          <TH>Account</TH>
          <TH>Prop Firm</TH>
          <TH right>Amount</TH>
        </tr>
      </thead>
      <tbody>
        {sorted.map((p, i) => (
          <tr key={p.id} style={{ borderBottom: i < sorted.length - 1 ? `1px solid ${t.border}` : 'none' }}>
            <TD><span style={{ color: t.textSec }}>{p.date}</span></TD>
            <TD>{p.account}</TD>
            <TD><span style={{ color: t.textSec }}>{p.propFirm}</span></TD>
            <TD right color={t.accent}>{fmtUSD(p.amount)}</TD>
          </tr>
        ))}
      </tbody>
    </TableWrap>
  );
}

// ─── Tab: Monthly Overview ────────────────────────────────────────────────────

function MonthlyTab({ costs, payouts }) {
  const months = useMemo(() => {
    const map = {};
    costs.forEach(c => {
      const k = c.date.slice(0, 7);
      map[k] = map[k] || { costs: 0, payouts: 0 };
      map[k].costs += c.amount;
    });
    payouts.forEach(p => {
      const k = p.date.slice(0, 7);
      map[k] = map[k] || { costs: 0, payouts: 0 };
      map[k].payouts += p.amount;
    });
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, d]) => ({ month, ...d, net: d.payouts - d.costs }));
  }, [costs, payouts]);

  if (!months.length) {
    return <div style={{ fontSize: 13, color: t.textTer, padding: '32px 0', textAlign: 'center' }}>No data yet.</div>;
  }
  return (
    <TableWrap>
      <thead>
        <tr>
          <TH>Month</TH>
          <TH right>Costs</TH>
          <TH right>Payouts</TH>
          <TH right>Net</TH>
        </tr>
      </thead>
      <tbody>
        {months.map((m, i) => (
          <tr key={m.month} style={{ borderBottom: i < months.length - 1 ? `1px solid ${t.border}` : 'none' }}>
            <TD>{fmtMonth(m.month)}</TD>
            <TD right color={t.red}>{fmtUSD(m.costs)}</TD>
            <TD right color={t.accent}>{fmtUSD(m.payouts)}</TD>
            <TD right color={m.net >= 0 ? t.accent : t.red}>{m.net >= 0 ? '+' : ''}{fmtUSD(m.net)}</TD>
          </tr>
        ))}
      </tbody>
    </TableWrap>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TABS = ['Subscriptions & Fees', 'Payouts', 'Monthly Overview'];

export default function Costs() {
  const [costs, setCosts]     = useState(DUMMY_COSTS);
  const [payouts, setPayouts] = useState(DUMMY_PAYOUTS);
  const [showAddCost, setShowAddCost]     = useState(false);
  const [showAddPayout, setShowAddPayout] = useState(false);
  const [activeTab, setActiveTab]         = useState(0);

  const totalCosts    = useMemo(() => costs.reduce((s, c) => s + c.amount, 0), [costs]);
  const monthlySubs   = useMemo(() => costs.filter(c => c.recurring && c.recurringPeriod === 'monthly').reduce((s, c) => s + c.amount, 0), [costs]);
  const totalEarned   = useMemo(() => payouts.reduce((s, p) => s + p.amount, 0), [payouts]);
  const netResult     = totalEarned - totalCosts;

  return (
    <div style={{ padding: '32px 36px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: t.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 4 }}>Costs</h1>
          <p style={{ fontSize: 13, color: t.textSec, margin: 0 }}>Track challenge fees, subscriptions, and prop firm payouts</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowAddCost(true)} style={{
            padding: '9px 16px', borderRadius: 10, border: `1px solid ${t.border}`,
            background: 'transparent', color: t.text, fontFamily: 'inherit',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}>+ Add Cost</button>
          <button onClick={() => setShowAddPayout(true)} style={{
            padding: '9px 16px', borderRadius: 10, border: 'none',
            background: t.accent, color: '#000', fontFamily: 'inherit',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>+ Add Payout</button>
        </div>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <MetricCard label="Total Costs" value={fmtUSD(totalCosts)} color={t.red} />
        <MetricCard label="Monthly Subscriptions" value={fmtUSD(monthlySubs)} />
        <MetricCard label="Total Earned" value={fmtUSD(totalEarned)} color={t.accent} />
        <MetricCard label="Net Result" value={(netResult >= 0 ? '+' : '') + fmtUSD(netResult)} color={netResult >= 0 ? t.accent : t.red} />
      </div>

      {/* Top Payouts scoreboard */}
      <div style={{ marginBottom: 24 }}>
        <TopPayouts payouts={payouts} />
      </div>

      {/* Detailed breakdown */}
      <div style={{ background: t.card, borderRadius: 18, padding: '20px 24px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${t.border}`, paddingBottom: 0 }}>
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)} style={{
              padding: '8px 16px', border: 'none', background: 'transparent', fontFamily: 'inherit',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              color: activeTab === i ? t.text : t.textSec,
              borderBottom: `2px solid ${activeTab === i ? t.accent : 'transparent'}`,
              marginBottom: -1, borderRadius: 0,
            }}>{tab}</button>
          ))}
        </div>

        {activeTab === 0 && <CostsTab costs={costs} />}
        {activeTab === 1 && <PayoutsTab payouts={payouts} />}
        {activeTab === 2 && <MonthlyTab costs={costs} payouts={payouts} />}
      </div>

      {showAddCost && (
        <AddCostModal
          onClose={() => setShowAddCost(false)}
          onAdd={entry => setCosts(prev => [...prev, entry])}
        />
      )}
      {showAddPayout && (
        <AddPayoutModal
          onClose={() => setShowAddPayout(false)}
          onAdd={entry => setPayouts(prev => [...prev, entry])}
        />
      )}
    </div>
  );
}
