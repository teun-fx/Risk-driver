import React, { useState } from 'react';
import { propFirms } from '../../data/mockData';
import { AccountTypeIcon } from '../AccountTypeIcon';

const accountTypes = {
  'CFD / FOREX': ['Prop Firm Challenge', 'Prop Firm Funded', 'CFD Funded'],
  FUTURES: ['Futures Evaluation', 'Futures Funded'],
  OTHER: ['Private Broker Account', 'Demo Account', 'Backtest Data'],
};

const dataSources = [
  { key: 'csv', label: 'CSV upload', desc: 'Upload a CSV file' },
  { key: 'mt', label: 'MT4/MT5', desc: 'Connect via API', soon: true },
  { key: 'ctrader', label: 'cTrader', desc: 'Connect via API', soon: true },
  { key: 'tradelocker', label: 'TradeLocker', desc: 'Connect via API', soon: true },
  { key: 'manual', label: 'Manual entry', desc: 'Enter trades manually' },
];

const steps = ['Account type', 'Details', 'Trade data'];

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${checked ? 'bg-brand-500' : 'bg-gray-200'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-4' : ''
        }`}
      />
    </button>
  );
}

function StepIndicator({ step }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-400">
      {steps.map((label, i) => (
        <React.Fragment key={label}>
          <div className="flex items-center gap-1">
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                i < step ? 'bg-brand-500 text-white' : i === step ? 'border border-brand-500 text-brand-600' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {i < step ? '✓' : i + 1}
            </span>
            <span className={i === step ? 'text-gray-900 font-medium' : ''}>{label}</span>
          </div>
          {i < steps.length - 1 && <span className="text-gray-300">›</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

const defaultForm = {
  type: '',
  firm: '',
  name: '',
  size: 100000,
  dailyDrawdown: 5,
  drawdownType: 'Balance',
  maxTotalDrawdown: 10,
  profitTarget: 10,
  profitSplit: 80,
  minTradingDays: 5,
  maxTradingDays: '',
  consistencyRule: false,
  newsTrading: false,
  weekendHolding: false,
  overnightHolding: false,
  expertAdvisors: false,
  leverage: '1:100',
  startDate: new Date().toISOString().slice(0, 10),
  activationCost: 0,
  monthlyFee: 0,
  dataSource: '',
  linkedStrategyId: '',
};

const inputClass = 'w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400';

export default function AddAccountModal({ strategies, onClose, onCreate }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(defaultForm);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleFinish = () => {
    onCreate({
      id: `acc-${Date.now()}`,
      name: form.firm || form.type,
      type: form.type,
      firm: form.firm || form.type,
      size: Number(form.size) || 0,
      currency: 'USD',
      startDate: form.startDate,
      notes: '',
      profitSplit: Number(form.profitSplit) || 0,
      activationCost: Number(form.activationCost) || 0,
      monthlyFee: Number(form.monthlyFee) || 0,
      tradesLoaded: 0,
      status: 'Active',
      dailyDrawdown: Number(form.dailyDrawdown) || null,
      drawdownType: form.drawdownType,
      maxTotalDrawdown: Number(form.maxTotalDrawdown) || null,
      profitTarget: Number(form.profitTarget) || null,
      minTradingDays: Number(form.minTradingDays) || null,
      maxTradingDays: form.maxTradingDays ? Number(form.maxTradingDays) : null,
      leverage: form.leverage,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-5 pt-4 pb-3 border-b border-gray-100 z-10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-gray-900">Add Account</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">
              ×
            </button>
          </div>
          <StepIndicator step={step} />
        </div>

        <div className="px-5 py-4 space-y-4">
          {step === 0 && (
            <div className="space-y-4">
              {Object.entries(accountTypes).map(([group, items]) => (
                <div key={group}>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{group}</div>
                  <div className="grid grid-cols-3 gap-2">
                    {items.map((key) => (
                      <button
                        key={key}
                        onClick={() => set('type', key)}
                        className={`flex flex-col items-start gap-1.5 rounded-lg border px-2.5 py-2.5 text-left text-xs ${
                          form.type === key ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <AccountTypeIcon type={key} className="w-3.5 h-3.5" />
                        <span className="font-medium leading-tight">{key}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Select firm</div>
                <div className="flex flex-wrap gap-1.5">
                  {propFirms.map((f) => (
                    <button
                      key={f}
                      onClick={() => set('firm', f)}
                      className={`px-2.5 py-1 rounded-full border text-xs ${
                        form.firm === f ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Firm name">
                  <input value={form.firm} onChange={(e) => set('firm', e.target.value)} placeholder="e.g. FTMO" className={inputClass} />
                </Field>
                <Field label="Account size ($)">
                  <input type="number" value={form.size} onChange={(e) => set('size', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Daily drawdown limit (%)">
                  <input type="number" value={form.dailyDrawdown} onChange={(e) => set('dailyDrawdown', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Max total drawdown (%)">
                  <input type="number" value={form.maxTotalDrawdown} onChange={(e) => set('maxTotalDrawdown', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Profit target (%)">
                  <input type="number" value={form.profitTarget} onChange={(e) => set('profitTarget', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Profit split (%)">
                  <input type="number" value={form.profitSplit} onChange={(e) => set('profitSplit', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Min trading days">
                  <input type="number" value={form.minTradingDays} onChange={(e) => set('minTradingDays', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Max trading days">
                  <input type="number" value={form.maxTradingDays} onChange={(e) => set('maxTradingDays', e.target.value)} className={inputClass} placeholder="Optional" />
                </Field>
                <Field label="Leverage">
                  <input value={form.leverage} onChange={(e) => set('leverage', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Start date">
                  <input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Activation cost ($)">
                  <input type="number" value={form.activationCost} onChange={(e) => set('activationCost', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Monthly fee ($)">
                  <input type="number" value={form.monthlyFee} onChange={(e) => set('monthlyFee', e.target.value)} className={inputClass} placeholder="Optional" />
                </Field>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Drawdown type</div>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden w-fit">
                  {['Balance', 'Trailing'].map((t) => (
                    <button
                      key={t}
                      onClick={() => set('drawdownType', t)}
                      className={`px-3 py-1 text-xs font-medium ${form.drawdownType === t ? 'bg-brand-500 text-white' : 'bg-white text-gray-600'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Rules</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {[
                    ['consistencyRule', 'Consistency rule'],
                    ['newsTrading', 'News trading'],
                    ['weekendHolding', 'Weekend holding'],
                    ['overnightHolding', 'Overnight holding'],
                    ['expertAdvisors', 'Expert Advisors'],
                  ].map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-700">{label}</span>
                      <Toggle checked={form[key]} onChange={(v) => set(key, v)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Data source</div>
                <div className="grid grid-cols-2 gap-2">
                  {dataSources.map((ds) => (
                    <button
                      key={ds.key}
                      disabled={ds.soon}
                      onClick={() => set('dataSource', ds.key)}
                      className={`text-left rounded-lg border px-2.5 py-2 text-xs ${
                        ds.soon
                          ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                          : form.dataSource === ds.key
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="font-medium flex items-center gap-1.5">
                        {ds.label} {ds.soon && <span className="text-[9px] uppercase bg-gray-100 text-gray-400 px-1 py-0.5 rounded">soon</span>}
                      </div>
                      <div className="text-[11px] text-gray-400">{ds.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              {form.dataSource === 'csv' && (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center text-xs text-gray-400">
                  Drag and drop your CSV file here, or click to browse.
                </div>
              )}
              <div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Link an existing strategy (optional)</div>
                <select
                  value={form.linkedStrategyId}
                  onChange={(e) => set('linkedStrategyId', e.target.value)}
                  className={inputClass}
                >
                  <option value="">No strategy</option>
                  {strategies.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white px-5 py-3 border-t border-gray-100 flex justify-between">
          <button
            onClick={() => (step === 0 ? onClose() : setStep(step - 1))}
            className="border border-gray-200 text-gray-700 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            ← Back
          </button>
          <button
            onClick={() => (step === 2 ? handleFinish() : setStep(step + 1))}
            disabled={step === 0 && !form.type}
            className="bg-brand-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {step === 2 ? 'Finish' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-xs text-gray-700 mb-1">{label}</div>
      {children}
    </div>
  );
}
