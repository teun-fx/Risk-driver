import { useState } from 'react';
import { DARK as t } from '../theme';

const suggestions = [
  'What are my weakest setups?',
  'Analyse my win rate trend',
  'How can I improve my R:R?',
  'When do I trade best?',
];

function StrategySelector({ strategies, onSelect }) {
  const options = strategies.length > 0
    ? strategies
    : [{ id: 'general', label: 'General (no strategy)', type: 'manual' }];

  return (
    <div style={{ padding: '36px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div style={{ background: t.card, borderRadius: 20, padding: '40px 48px', maxWidth: 520, width: '100%' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: t.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21h6M12 3a6 6 0 016 6c0 2.5-1.5 4.5-3 5.5V17H9v-2.5C7.5 13.5 6 11.5 6 9a6 6 0 016-6z" />
          </svg>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: t.text, margin: '0 0 8px', letterSpacing: '-0.3px' }}>
          Which strategy do you want advice on?
        </h2>
        <p style={{ fontSize: 14, color: t.textSec, margin: '0 0 28px', lineHeight: 1.6 }}>
          Choose a strategy so I can give you personalised insights based on your actual trades.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {options.map(s => (
            <button key={s.id} onClick={() => onSelect(s)} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
              border: `1px solid ${t.cardBorder}`, borderRadius: 14, background: t.rowBg,
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = t.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = t.cardBorder}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(161,213,51,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.textSec} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3,17 9,11 13,14 21,6" />
                  <polyline points="15,6 21,6 21,12" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: t.text }}>{s.label}</div>
                <div style={{ fontSize: 12, color: t.textSec, marginTop: 2 }}>
                  {s.tradeList ? `${s.tradeList.length} trades` : 'No trades yet'}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', color: t.textTer, fontSize: 18 }}>›</div>
            </button>
          ))}
          <button onClick={() => onSelect({ id: 'general', label: 'General advice', type: 'manual' })} style={{
            padding: '11px', border: `1px dashed ${t.border}`, borderRadius: 14, background: 'transparent',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: t.textSec,
          }}>
            General advice (no specific strategy)
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Insights({ strategies = [] }) {
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  function handleSelect(s) {
    setSelectedStrategy(s);
    const trades = s.tradeList || [];
    const wins = trades.filter(tr => (tr.profit || 0) > 0).length;
    const losses = trades.filter(tr => (tr.profit || 0) < 0).length;
    const wr = (wins + losses) > 0 ? Math.round(wins / (wins + losses) * 100) : null;
    const intro = s.id === 'general'
      ? "Hi Teun! I'm your AI trading advisor. Ask me anything about your strategy, risk management, or trading psychology."
      : `Hi Teun! I'm analysing **${s.label}**${trades.length > 0 ? ` with ${trades.length} trades` : ''}${wr !== null ? `, ${wr}% win rate` : ''}. What would you like to know?`;
    setMessages([{ role: 'assistant', text: intro }]);
  }

  function sendMessage(text) {
    const msg = text || input;
    if (!msg.trim()) return;
    const trades = selectedStrategy?.tradeList || [];
    const wins = trades.filter(tr => (tr.profit || 0) > 0).length;
    const losses = trades.filter(tr => (tr.profit || 0) < 0).length;
    const wr = (wins + losses) > 0 ? Math.round(wins / (wins + losses) * 100) : null;
    setMessages(prev => [
      ...prev,
      { role: 'user', text: msg },
      {
        role: 'assistant',
        text: msg.toLowerCase().includes('win rate') || msg.toLowerCase().includes('winrate')
          ? `Your win rate is ${wr !== null ? `${wr}%` : 'not yet calculable'}. ${wr >= 60 ? 'That\'s strong — focus on protecting your edge by only taking high-quality setups.' : wr !== null ? 'There\'s room to improve. Review your losing trades for patterns.' : 'Import some trades first so I can analyse your data.'}`
          : msg.toLowerCase().includes('setup')
          ? 'Based on your trade history, pullback entries tend to underperform. Consider waiting for a clear rejection candle before entry to filter out noise.'
          : msg.toLowerCase().includes('risk') || msg.toLowerCase().includes('drawdown')
          ? 'Your risk management looks disciplined. Keep max daily loss under 2% and ensure you\'re not averaging down on losing trades.'
          : `Your overall performance ${trades.length > 0 ? `across ${trades.length} trades` : ''} is being tracked. Focus on consistency and avoid over-trading on low-volatility sessions.`,
      },
    ]);
    setInput('');
  }

  if (!selectedStrategy) {
    return <StrategySelector strategies={strategies} onSelect={handleSelect} />;
  }

  return (
    <div style={{ padding: '36px 40px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: t.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 4 }}>Insights</h1>
          <p style={{ fontSize: 13, color: t.textSec, margin: 0 }}>
            Analysing: <strong style={{ color: t.text }}>{selectedStrategy.label}</strong>
          </p>
        </div>
        <button onClick={() => { setSelectedStrategy(null); setMessages([]); }} style={{
          fontSize: 13, padding: '8px 16px', border: `1px solid ${t.cardBorder}`, borderRadius: 10,
          background: t.card, color: t.textSec, cursor: 'pointer', fontFamily: 'inherit',
        }}>Switch strategy</button>
      </div>

      <div style={{
        background: t.card, borderRadius: 18, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', flex: 1, minHeight: 0, maxHeight: 600,
      }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
              {msg.role === 'assistant' && (
                <div style={{
                  width: 28, height: 28, borderRadius: 8, background: t.brand,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginRight: 10, flexShrink: 0, color: '#000',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21h6M12 3a6 6 0 016 6c0 2.5-1.5 4.5-3 5.5V17H9v-2.5C7.5 13.5 6 11.5 6 9a6 6 0 016-6z" />
                  </svg>
                </div>
              )}
              <div style={{
                maxWidth: '75%',
                background: msg.role === 'user' ? t.brand : t.rowBg,
                color: msg.role === 'user' ? '#1D1D1F' : t.text,
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                padding: '12px 16px', fontSize: 14, lineHeight: 1.5,
              }}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '16px 24px', borderTop: `1px solid ${t.cardBorder}` }}>
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
                flex: 1, padding: '10px 16px', border: `1px solid ${t.cardBorder}`, borderRadius: 12,
                fontSize: 14, fontFamily: 'inherit', color: t.text, background: t.rowBg, outline: 'none',
              }}
            />
            <button onClick={() => sendMessage()} style={{
              padding: '10px 20px', background: t.brand, color: '#1D1D1F', border: 'none',
              borderRadius: 12, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', fontWeight: 600,
            }}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
