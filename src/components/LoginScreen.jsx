import { useState } from 'react';
import { useAuth } from '../AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const result = login(password);
    if (!result) {
      setError('Incorrect password');
      setPassword('');
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F4F6F8', fontFamily: 'inherit',
    }}>
      <div style={{
        background: '#FFFFFF', border: '1px solid #E8ECF0', borderRadius: 20,
        padding: '40px 36px', width: 360, boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#A1D533', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#000' }}>F</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#0F1728', letterSpacing: '-0.3px' }}>FundIQ</span>
        </div>

        <div style={{ fontSize: 20, fontWeight: 600, color: '#0F1728', marginBottom: 6 }}>Welcome back</div>
        <div style={{ fontSize: 13, color: '#5A6478', marginBottom: 28 }}>Enter your password to continue</div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#5A6478', marginBottom: 6 }}>Password</div>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="Enter password"
              autoFocus
              style={{
                width: '100%', height: 40, border: `1px solid ${error ? '#F03D3D' : '#E8ECF0'}`,
                borderRadius: 8, background: '#F4F6F8', fontSize: 13, color: '#0F1728',
                padding: '0 12px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                transition: 'border-color 120ms ease',
              }}
            />
            {error && (
              <div style={{ fontSize: 12, color: '#F03D3D', marginTop: 6 }}>{error}</div>
            )}
          </div>

          <button
            type="submit"
            disabled={!password}
            style={{
              width: '100%', height: 40, border: 'none', borderRadius: 8,
              background: password ? '#A1D533' : '#E8ECF0',
              color: password ? '#000' : '#9AA3B2',
              fontSize: 13, fontWeight: 600, cursor: password ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', transition: 'background 120ms ease',
            }}
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
