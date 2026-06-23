import { DARK as t } from '../theme';

const DUMMY_TRADES = [
  { datum: '2026-06-14', setup: 'Breakout Retest', instrument: 'NQ',  resultaat: 'Win',  kosten: '$4.20'  },
  { datum: '2026-06-13', setup: 'Fair Value Gap',  instrument: 'ES',  resultaat: 'Loss', kosten: '$3.80'  },
  { datum: '2026-06-12', setup: 'Liquidity Sweep', instrument: 'NQ',  resultaat: 'Win',  kosten: '$4.20'  },
  { datum: '2026-06-11', setup: 'Order Block',     instrument: 'GC',  resultaat: 'Win',  kosten: '$2.90'  },
  { datum: '2026-06-10', setup: 'Breakout Retest', instrument: 'ES',  resultaat: 'Loss', kosten: '$3.80'  },
  { datum: '2026-06-09', setup: 'Fair Value Gap',  instrument: 'NQ',  resultaat: 'Win',  kosten: '$4.20'  },
  { datum: '2026-06-08', setup: 'Order Block',     instrument: 'CL',  resultaat: 'Win',  kosten: '$1.60'  },
];

const totalKosten = DUMMY_TRADES.reduce((sum, t) => sum + parseFloat(t.kosten.replace('$', '')), 0);

export default function Kosten() {
  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: t.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 4 }}>Costs</h1>
        <p style={{ fontSize: 13, color: t.textSec, margin: 0 }}>Transaction costs and commissions</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Costs this month', value: `$${totalKosten.toFixed(2)}` },
          { label: 'Avg. per trade',   value: `$${(totalKosten / DUMMY_TRADES.length).toFixed(2)}` },
          { label: 'Costs as % of equity', value: `${((totalKosten / 103420) * 100).toFixed(4)}%` },
        ].map(item => (
          <div key={item.label} style={{ background: t.card, borderRadius: 18, padding: '18px 20px' }}>
            <div style={{ fontSize: 12, color: t.textSec, marginBottom: 8 }}>{item.label}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: t.text, letterSpacing: '-0.3px' }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: t.card, borderRadius: 18, padding: '20px 22px' }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: t.text, marginBottom: 16 }}>Cost detail per trade</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Date', 'Setup', 'Instrument', 'Result', 'Costs'].map(col => (
                <th key={col} style={{
                  textAlign: 'left', fontSize: 11, color: t.textTer, fontWeight: 500,
                  padding: '0 0 12px', borderBottom: `1px solid ${t.cardBorder}`, letterSpacing: '0.04em',
                }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DUMMY_TRADES.map((trade, i) => (
              <tr key={i}>
                <td style={{ padding: '12px 0', fontSize: 13, color: t.textSec, borderBottom: i < DUMMY_TRADES.length - 1 ? `1px solid ${t.cardBorder}` : 'none' }}>{trade.datum}</td>
                <td style={{ padding: '12px 0', fontSize: 13, color: t.text, fontWeight: 500, borderBottom: i < DUMMY_TRADES.length - 1 ? `1px solid ${t.cardBorder}` : 'none' }}>{trade.setup}</td>
                <td style={{ padding: '12px 0', fontSize: 13, color: t.textSec, borderBottom: i < DUMMY_TRADES.length - 1 ? `1px solid ${t.cardBorder}` : 'none' }}>{trade.instrument}</td>
                <td style={{ padding: '12px 0', borderBottom: i < DUMMY_TRADES.length - 1 ? `1px solid ${t.cardBorder}` : 'none' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 99,
                    background: trade.resultaat === 'Win' ? 'rgba(48,209,88,0.15)' : 'rgba(255,69,58,0.15)',
                    color: trade.resultaat === 'Win' ? t.accent : t.red,
                  }}>{trade.resultaat}</span>
                </td>
                <td style={{ padding: '12px 0', fontSize: 13, color: t.text, fontWeight: 500, borderBottom: i < DUMMY_TRADES.length - 1 ? `1px solid ${t.cardBorder}` : 'none' }}>{trade.kosten}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
