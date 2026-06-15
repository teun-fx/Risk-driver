export default function MetricCard({ label, value, sub, subColor }) {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #D2D2D7',
      borderRadius: 18,
      padding: '20px 24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}>
      <div style={{ fontSize: 13, color: '#6E6E73', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, color: '#1D1D1F', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 13, color: subColor || '#6E6E73', marginTop: 6 }}>{sub}</div>
      )}
    </div>
  );
}
