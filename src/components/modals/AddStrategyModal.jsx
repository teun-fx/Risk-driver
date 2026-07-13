import React, { useState, useRef } from 'react';
import { parseMt5ReportHtml } from '../../utils/mt5Report';

const dataSources = [
  { key: 'csv', label: 'CSV upload', desc: 'Upload a CSV file' },
  { key: 'html', label: 'MT5 report (.html)', desc: 'Upload a Strategy Tester or account history report' },
  { key: 'ctrader', label: 'cTrader', desc: 'Connect via API', soon: true },
  { key: 'tradelocker', label: 'TradeLocker', desc: 'Connect via API', soon: true },
  { key: 'manual', label: 'Manual entry', desc: 'Enter trades manually' },
];

const strategyTypes = ['Trend Following', 'Mean Reversion', 'Scalping', 'Swing', 'Other'];

const steps = ['Data source', 'Strategy details', 'Import data'];

function StepIndicator({ step }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      {steps.map((label, i) => (
        <React.Fragment key={label}>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${
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

export default function AddStrategyModal({ onClose, onCreate }) {
  const [step, setStep] = useState(0);
  const [dataSource, setDataSource] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState(strategyTypes[0]);
  const [description, setDescription] = useState('');
  const [parsed, setParsed] = useState(null);
  const [parseError, setParseError] = useState('');
  const [fileName, setFileName] = useState('');
  const fileRef = useRef(null);

  const handleHtmlFile = (file) => {
    if (!file) return;
    setParseError('');
    setParsed(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setParsed(parseMt5ReportHtml(e.target.result));
      } catch (err) {
        setParseError(err.message || 'Could not read this report.');
      }
    };
    reader.onerror = () => setParseError('Could not read this file.');
    reader.readAsText(file);
  };

  const handleFinish = () => {
    const base = {
      id: `strat-${Date.now()}`,
      name: name || 'Untitled Strategy',
      type,
      description,
      linkedAccountId: '',
    };

    if (dataSource === 'html' && parsed) {
      onCreate({ ...base, ...parsed.metrics, trades: parsed.trades });
      return;
    }

    onCreate({
      ...base,
      totalTrades: 0,
      winrate: 0,
      rr: 0,
      profitFactor: 0,
      expectancy: 0,
      maxLosingStreak: 0,
      sharpe: 0,
      sortino: 0,
      totalPnl: 0,
    });
  };

  const canFinish = dataSource !== 'html' || !!parsed;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100 z-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Add Strategy</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
              ×
            </button>
          </div>
          <StepIndicator step={step} />
        </div>

        <div className="px-6 py-6 space-y-6">
          {step === 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Choose data source</div>
              <div className="grid grid-cols-2 gap-3">
                {dataSources.map((ds) => (
                  <button
                    key={ds.key}
                    disabled={ds.soon}
                    onClick={() => setDataSource(ds.key)}
                    className={`text-left rounded-lg border px-3 py-3 text-sm ${
                      ds.soon
                        ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                        : dataSource === ds.key
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="font-medium flex items-center gap-2">
                      {ds.label} {ds.soon && <span className="text-[10px] uppercase bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">soon</span>}
                    </div>
                    <div className="text-xs text-gray-400">{ds.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-700 mb-1">Name</div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Breakout Strategy"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <div className="text-sm text-gray-700 mb-1">Type</div>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:border-gray-400"
                >
                  {strategyTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-sm text-gray-700 mb-1">Description (optional)</div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:border-gray-400"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {dataSource === 'csv' && (
                <>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-sm text-gray-400">
                    Drag and drop your CSV file here, or click to browse.
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Column mapping</div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {['Date', 'Instrument', 'Result', 'R:R'].map((col) => (
                        <div key={col} className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2">
                          <span className="text-gray-500">{col}</span>
                          <span className="text-gray-400">auto-detected</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {dataSource === 'html' && (
                <div className="space-y-3">
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleHtmlFile(e.dataTransfer.files[0]);
                    }}
                    className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-sm text-gray-400 cursor-pointer hover:bg-gray-50"
                  >
                    {fileName || 'Drag and drop your MT5 report (.html) here, or click to browse.'}
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".html,.htm"
                      className="hidden"
                      onChange={(e) => handleHtmlFile(e.target.files[0])}
                    />
                  </div>

                  {parseError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{parseError}</div>
                  )}

                  {parsed && (
                    <div className="border border-brand-200 bg-brand-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-brand-700 mb-3">
                        ✓ Extracted {parsed.trades.length} closed trades
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Win rate</span>
                          <div className="font-semibold text-gray-900">{parsed.metrics.winrate}%</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Profit factor</span>
                          <div className="font-semibold text-gray-900">{parsed.metrics.profitFactor}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">R:R</span>
                          <div className="font-semibold text-gray-900">{parsed.metrics.rr}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Net P&L</span>
                          <div className="font-semibold text-gray-900">
                            {parsed.metrics.totalPnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {dataSource === 'manual' && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Manual trade entry</div>
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Date" type="date" className="rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:border-gray-400" />
                    <input placeholder="Instrument" className="rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:border-gray-400" />
                    <input placeholder="Result ($)" type="number" className="rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:border-gray-400" />
                    <input placeholder="R:R" className="rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:border-gray-400" />
                  </div>
                  <button type="button" className="text-sm text-brand-600 font-medium hover:underline">
                    + Add another trade
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100 flex justify-between">
          <button
            onClick={() => (step === 0 ? onClose() : setStep(step - 1))}
            className="border border-gray-200 text-gray-700 px-5 py-2 rounded-lg font-medium hover:bg-gray-50"
          >
            ← Back
          </button>
          <button
            onClick={() => (step === 2 ? handleFinish() : setStep(step + 1))}
            disabled={(step === 0 && !dataSource) || (step === 2 && !canFinish)}
            className="bg-brand-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {step === 2 ? 'Finish' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
