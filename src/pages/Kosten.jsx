import { allTrades } from '../data/dummy';
import { useTheme } from '../ThemeContext';

const totalKosten = allTrades.reduce((sum, t) => sum + parseFloat(t.kosten.replace('€', '').replace(',', '.')), 0);

export default function Kosten() {
  const t = useTheme();
  return (
    <div style={{ padding: '36px 40px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: t.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 4 }}>
          Costs
        </h1>
        <p style={{ fontSize: 14, color: t.textSec, margin: 0 }}>Transaction costs and commissions</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 28 }}>
        {[
          { label: 'Costs this month', value: `€${totalKosten.toFixed(2)}` },
          { label: 'Avg. per trade', value: `€${(totalKosten / allTrades.length).toFixed(2)}` },
          { label: 'Costs as % of equity', value: `${((totalKosten / 24340) * 100).toFixed(3)}%` },
        ].map(item => (
          <div key={item.label} style={{
            background: '#FFFFFF',
            border: '1px solid #D2D2D7',
            borderRadius: 18,
            padding: '20px 24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: 13, color: '#6E6E73', marginBottom: 8 }}>{item.label}</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#1D1D1F', letterSpacing: '-0.3px' }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{
        background: '#FFFFFF',
        border: '1px solid #D2D2D7',
        borderRadius: 18,
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: '#1D1D1F', marginBottom: 20 }}>Cost detail per trade</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Date', 'Setup', 'Instrument', 'Result', 'Costs'].map(col => (
                <th key={col} style={{
                  textAlign: 'left',
                  fontSize: 12,
                  color: '#AEAEB2',
                  fontWeight: 500,
                  padding: '0 0 14px',
                  borderBottom: '1px solid #F5F5F7',
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
                <td style={{ padding: '13px 0', borderBottom: i < allTrades.length - 1 ? '1px solid #F5F5F7' : 'none' }}>
                  <span style={{
                    fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 99,
                    background: trade.resultaat === 'Win' ? '#F0F9E0' : '#FEF0F0',
                    color: trade.resultaat === 'Win' ? '#3D7A00' : '#C0392B',
                  }}>{trade.resultaat}</span>
                </td>
                <td style={{ padding: '13px 0', fontSize: 13, color: '#1D1D1F', fontWeight: 500, borderBottom: i < allTrades.length - 1 ? '1px solid #F5F5F7' : 'none' }}>{trade.kosten}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
