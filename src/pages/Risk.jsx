import { useTheme } from '../ThemeContext';

function RiskBar({ label, value, max, unit = '%', color = '#1D1D1F' }) {
  const pct = Math.min((value / max) * 100, 100);
  const isWarning = pct > 75;
  const barColor = isWarning ? '#E8A400' : color;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 14, color: '#6E6E73' }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#1D1D1F' }}>
          {value}{unit} / {max}{unit}
        </span>
      </div>
      <div style={{ height: 8, background: '#F5F5F7', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: barColor,
          borderRadius: 99,
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );
}

export default function Risk() {
  const t = useTheme();
  return (
    <div style={{ padding: '36px 40px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: t.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 4 }}>
          Risk
        </h1>
        <p style={{ fontSize: 14, color: t.textSec, margin: 0 }}>Risk management and limits</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #D2D2D7',
          borderRadius: 18,
          padding: '28px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#1D1D1F', marginBottom: 24 }}>Daily limits</div>
          <RiskBar label="Daily drawdown" value={1.2} max={3} color="#A1D533" />
          <RiskBar label="Max loss per trade" value={0.8} max={2} color="#A1D533" />
          <RiskBar label="Number of trades" value={2} max={5} unit="" color="#1D1D1F" />
        </div>

        <div style={{
          background: '#FFFFFF',
          border: '1px solid #D2D2D7',
          borderRadius: 18,
          padding: '28px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#1D1D1F', marginBottom: 24 }}>Weekly limits</div>
          <RiskBar label="Weekly drawdown" value={2.1} max={6} color="#A1D533" />
          <RiskBar label="Max weekly loss" value={1.8} max={5} color="#A1D533" />
          <RiskBar label="Trades this week" value={8} max={25} unit="" color="#1D1D1F" />
        </div>

        <div style={{
          background: '#FFFFFF',
          border: '1px solid #D2D2D7',
          borderRadius: 18,
          padding: '28px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          gridColumn: 'span 2',
        }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#1D1D1F', marginBottom: 8 }}>Position size calculator</div>
          <div style={{ fontSize: 13, color: '#AEAEB2', marginBottom: 24 }}>Calculate ideal position size based on your risk tolerance</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { label: 'Account size', value: '€24,340' },
              { label: 'Risk per trade', value: '1%' },
              { label: 'Ideal position size', value: '€243' },
            ].map(item => (
              <div key={item.label} style={{ background: '#F5F5F7', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 12, color: '#6E6E73', marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#1D1D1F', letterSpacing: '-0.3px' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
