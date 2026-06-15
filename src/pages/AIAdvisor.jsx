import { useState } from 'react';
import { useTheme } from '../ThemeContext';

const suggestions = [
  'What are my weakest setups?',
  'Analyse my win rate trend',
  'How can I improve my R:R?',
  'When do I trade best?',
];

function StrategySelector({ strategies: accounts, onSelect }) {
  const t = useTheme();
  const options = accounts.length > 0
    ? accounts
    : [{ id: 'general', label: 'General (no account)', firmName: '', type: 'manual' }];

  return (
    <div style={{ padding: '36px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div style={{
        background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 20,
        boxShadow: t.cardShadow, padding: '40px 48px', maxWidth: 520, width: '100%',
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#A1D533', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 20 }}>✦</div>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: t.text, margin: '0 0 8px', letterSpacing: '-0.3px' }}>
          Which strategy do you want advice on?
        </h2>
        <p style={{ fontSize: 14, color: t.textSec, margin: '0 0 28px', lineHeight: 1.6 }}>
          Choose an account or strategy so I can give you personalised insights based on your actual trades.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {options.map(acc => (
            <button key={acc.id} onClick={() => onSelect(acc)} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
              border: `1px solid ${t.cardBorder}`, borderRadius: 14, background: t.rowBg,
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              transition: 'border-color 0.15s, background 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#A1D533'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = t.cardBorder; }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F0F9E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                {acc.type === 'csv' ? '📊' : acc.type === 'myfxbook' ? '📡' : '📋'}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: t.text }}>{acc.label}</div>
                <div style={{ fontSize: 12, color: t.textSec, marginTop: 2 }}>
                  {acc.firmName || 'Manual'} · {acc.type === 'csv' ? 'Backtest CSV' : acc.type === 'myfxbook' ? 'Myfxbook live' : acc.status || 'manual'}
                  {acc.tradeList ? ` · ${acc.tradeList.length} trades` : ''}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', color: '#D2D2D7', fontSize: 18 }}>›</div>
            </button>
          ))}
          <button onClick={() => onSelect({ id: 'general', label: 'General advice', type: 'manual' })} style={{
            padding: '11px', border: '1px dashed #D2D2D7', borderRadius: 14, background: 'transparent',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: '#6E6E73',
          }}>
            General advice (no specific account)
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AIAdvisor({ strategies = [] }) {
  const t = useTheme();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  function handleSelect(acc) {
    setSelectedAccount(acc);
    const trades = acc.tradeList || [];
    const wins = trades.filter(t => t.result === 'Win').length;
    const losses = trades.filter(t => t.result === 'Loss').length;
    const wr = (wins + losses) > 0 ? Math.round(wins / (wins + losses) * 100) : null;
    const netPL = trades.reduce((s, t) => s + (t.profit || 0), 0);

    const intro = acc.id === 'general'
      ? "Hi Teun! I'm your AI trading advisor. Ask me anything about your strategy, risk management, or trading psychology."
      : `Hi Teun! I'm analysing **${acc.label}**${trades.length > 0 ? ` with ${trades.length} trades` : ''}${wr !== null ? `, ${wr}% win rate` : ''}${netPL !== 0 ? `, net P&L €${Math.round(netPL).toLocaleString('en-GB')}` : ''}. What would you like to know?`;

    setMessages([{ role: 'assistant', text: intro }]);
  }

  function sendMessage(text) {
    const msg = text || input;
    if (!msg.trim()) return;
    const trades = selectedAccount?.tradeList || [];
    const wins = trades.filter(t => t.result === 'Win').length;
    const losses = trades.filter(t => t.result === 'Loss').length;
    const wr = (wins + losses) > 0 ? Math.round(wins / (wins + losses) * 100) : null;

    setMessages(prev => [
      ...prev,
      { role: 'user', text: msg },
      {
        role: 'assistant',
        text: msg.toLowerCase().includes('win rate') || msg.toLowerCase().includes('winrate')
          ? `Your win rate is ${wr !== null ? `${wr}%` : 'not yet calculable'}. ${wr >= 60 ? 'That\'s strong — focus on protecting your edge by only taking high-quality setups.' : wr !== null ? 'There\'s room to improve. Review your losing trades for patterns — are you jumping in too early?' : 'Import some trades first so I can analyse your data.'}`
          : msg.toLowerCase().includes('setup')
          ? 'Based on your trade history, pullback entries tend to underperform. Consider waiting for a clear rejection candle before entry to filter out noise.'
          : msg.toLowerCase().includes('risk') || msg.toLowerCase().includes('drawdown')
          ? 'Your risk management looks disciplined. Keep max daily loss under 2% and ensure you\'re not averaging down on losing trades.'
          : `Your overall performance ${trades.length > 0 ? `across ${trades.length} trades` : ''} is being tracked. Focus on consistency and avoid over-trading on low-volatility sessions.`,
      },
    ]);
    setInput('');
  }

  if (!selectedAccount) {
    return <StrategySelector strategies={strategies} onSelect={handleSelect} />;
  }

  return (
    <div style={{ padding: '36px 40px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: t.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 4 }}>
            AI Advisor
          </h1>
          <p style={{ fontSize: 14, color: t.textSec, margin: 0 }}>
            Analysing: <strong>{selectedAccount.label}</strong>
          </p>
        </div>
        <button onClick={() => { setSelectedAccount(null); setMessages([]); }} style={{
          fontSize: 13, padding: '8px 16px', border: `1px solid ${t.cardBorder}`, borderRadius: 10,
          background: t.card, color: t.textSec, cursor: 'pointer', fontFamily: 'inherit',
        }}>Switch account</button>
      </div>

      <div style={{
        background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 18,
        boxShadow: t.cardShadow, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', flex: 1, minHeight: 0, maxHeight: 600,
        transition: 'background 0.35s ease, border-color 0.35s ease',
      }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
              {msg.role === 'assistant' && (
                <div style={{
                  width: 28, height: 28, borderRadius: 8, background: '#A1D533',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, marginRight: 10, flexShrink: 0,
                }}>✦</div>
              )}
              <div style={{
                maxWidth: '75%',
                background: msg.role === 'user' ? '#A1D533' : t.rowBg,
                color: msg.role === 'user' ? '#1D1D1F' : t.text,
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                padding: '12px 16px', fontSize: 14, lineHeight: 1.5,
              }}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '16px 24px', borderTop: `1px solid ${t.divider}` }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {suggestions.map(s => (
              <button key={s} onClick={() => sendMessage(s)} style={{
                fontSize: 12, padding: '5px 12px', border: `1px solid ${t.cardBorder}`, borderRadius: 99,
                background: 'transparent', color: t.textSec, cursor: 'pointer', fontFamily: 'inherit',
              }}>{s}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask a question about your trades..."
              style={{
                flex: 1, padding: '10px 16px', border: `1px solid ${t.inputBorder}`, borderRadius: 12,
                fontSize: 14, fontFamily: 'inherit', color: t.text, background: t.inputBg, outline: 'none',
              }}
            />
            <button onClick={() => sendMessage()} style={{
              padding: '10px 20px', background: '#A1D533', color: '#1D1D1F', border: 'none',
              borderRadius: 12, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', fontWeight: 600,
            }}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
