export default function Card({ children, style }) {
  return (
    <div style={{ background: '#1C1C1E', borderRadius: 18, padding: '20px 22px', ...style }}>
      {children}
    </div>
  );
}
