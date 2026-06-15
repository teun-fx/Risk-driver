import { allTrades } from '../data/dummy';
import { useTheme } from '../ThemeContext';

export default function Trades() {
  const t = useTheme();
  return (
    <div style={{ padding: '36px 40px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: t.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 4 }}>
          Trades
        </h1>
        <p style={{ fontSize: 14, color: t.textSec, margin: 0 }}>Overview of all executed trades</p>
      </div>

      <div style={{
        background: t.card,
        border: `1px solid ${t.cardBorder}`,
        borderRadius: 18,
        padding: '24px',
        boxShadow: t.cardShadow,
        transition: 'background 0.35s ease, border-color 0.35s ease',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Date', 'Setup', 'Instrument', 'R:R', 'Result', '+/- in R', 'Costs'].map(col => (
                <th key={col} style={{
                  textAlign: 'left',
                  fontSize: 12,
                  color: t.textTer,
                  fontWeight: 500,
                  padding: '0 0 14px',
                  borderBottom: `1px solid ${t.dividerLight}`,
                  letterSpacing: '0.02em',
                }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allTrades.map((trade, i) => (
              <tr key={i}>
                <td style={{ padding: '13px 0', fontSize: 13, color: '#6E6E73', borderBottom: i < allTrades.length - 1 ? '1px solid #F5F5F7' : 'none' }}>{trade.datum}</td>
                <td style={{ padding: '13px 0', fontSize: 13, color: '#1D1D1F', fontWeight: 500, borderBottom: i < allTrades.length - 1 ? '1px solid #F5F5F7' : 'none' }}>{trade.setup}</td>
                <td style={{ padding: '13px 0', fontSize: 13, color: '#6E6E73', borderBottom: i < allTrades.length - 1 ? '1px solid #F5F5F7' : 'none' }}>{trade.instrument}</td>
                <td style={{ padding: '13px 0', fontSize: 13, color: '#6E6E73', borderBottom: i < allTrades.length - 1 ? '1px solid #F5F5F7' : 'none' }}>{trade.rr}</td>
                <td style={{ padding: '13px 0', borderBottom: i < allTrades.length - 1 ? '1px solid #F5F5F7' : 'none' }}>
                  <span style={{
                    fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 99,
                    background: trade.resultaat === 'Win' ? '#F0F9E0' : '#FEF0F0',
                    color: trade.resultaat === 'Win' ? '#3D7A00' : '#C0392B',
                  }}>{trade.resultaat}</span>
                </td>
                <td style={{ padding: '13px 0', fontSize: 13, fontWeight: 500, color: trade.r.startsWith('+') ? '#A1D533' : '#C0392B', borderBottom: i < allTrades.length - 1 ? '1px solid #F5F5F7' : 'none' }}>{trade.r}</td>
                <td style={{ padding: '13px 0', fontSize: 13, color: '#6E6E73', borderBottom: i < allTrades.length - 1 ? '1px solid #F5F5F7' : 'none' }}>{trade.kosten}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
