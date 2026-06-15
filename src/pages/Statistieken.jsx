import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { monthlyStats } from '../data/dummy';
import { useTheme } from '../ThemeContext';

export default function Statistieken() {
  const t = useTheme();
  return (
    <div style={{ padding: '36px 40px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: t.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 4 }}>
          Statistics
        </h1>
        <p style={{ fontSize: 14, color: t.textSec, margin: 0 }}>Detailed performance analysis</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 28 }}>
        {[
          { label: 'Total trades', value: '114', sub: 'All time' },
          { label: 'Best month', value: '+18.4%', sub: 'April 2026' },
          { label: 'Max drawdown', value: '-4.2%', sub: 'All time' },
          { label: 'Profit factor', value: '2.3', sub: '30 trades' },
          { label: 'Avg. win', value: '+2.1R', sub: '30 trades' },
          { label: 'Avg. loss', value: '-1.0R', sub: '30 trades' },
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
            <div style={{ fontSize: 12, color: '#AEAEB2', marginTop: 4 }}>{item.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #D2D2D7',
          borderRadius: 18,
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#1D1D1F', marginBottom: 4 }}>Win rate per month</div>
          <div style={{ fontSize: 13, color: '#AEAEB2', marginBottom: 20 }}>%</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyStats} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="0" stroke="#F5F5F7" vertical={false} />
              <XAxis dataKey="maand" tick={{ fontSize: 11, fill: '#AEAEB2' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#AEAEB2' }} axisLine={false} tickLine={false} domain={[50, 70]} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #D2D2D7', borderRadius: 10, fontSize: 13 }} labelStyle={{ color: '#6E6E73' }} />
              <Bar dataKey="winrate" fill="#1D1D1F" radius={[4, 4, 0, 0]} name="Win rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{
          background: '#FFFFFF',
          border: '1px solid #D2D2D7',
          borderRadius: 18,
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#1D1D1F', marginBottom: 4 }}>Expectancy per month</div>
          <div style={{ fontSize: 13, color: '#AEAEB2', marginBottom: 20 }}>R per trade</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyStats} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="0" stroke="#F5F5F7" vertical={false} />
              <XAxis dataKey="maand" tick={{ fontSize: 11, fill: '#AEAEB2' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#AEAEB2' }} axisLine={false} tickLine={false} domain={[0.3, 0.6]} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #D2D2D7', borderRadius: 10, fontSize: 13 }} labelStyle={{ color: '#6E6E73' }} />
              <Line type="monotone" dataKey="expectancy" stroke="#A1D533" strokeWidth={2} dot={{ r: 4, fill: '#A1D533', strokeWidth: 0 }} name="Expectancy R" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
