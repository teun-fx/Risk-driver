import { DARK as t } from '../theme';

const navItems = [
  { id: 'dashboard',   label: 'Dashboard' },
  { id: 'strategies',  label: 'Strategies' },
  { id: 'accounts',    label: 'Accounts' },
  { id: 'statistics',  label: 'Statistics' },
  { id: 'costs',       label: 'Costs' },
  { id: 'ai-advisor',  label: 'AI Advisor' },
];

export default function Sidebar({ active, onNav }) {
  return (
    <aside style={{
      width: 220, minHeight: '100vh',
      background: t.sidebar,
      borderRight: `1px solid ${t.sidebarBorder}`,
      display: 'flex', flexDirection: 'column', padding: '28px 0', flexShrink: 0,
    }}>
      <div style={{ padding: '0 24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: t.brand, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1D1D1F' }}>R</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: t.text, letterSpacing: '-0.3px' }}>Risk Driver</span>
        </div>
      </div>

      <nav style={{ flex: 1 }}>
        {navItems.map(item => {
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => onNav(item.id)} style={{
              display: 'flex', alignItems: 'center',
              width: '100%', padding: '10px 20px', margin: '1px 0',
              border: 'none', borderRadius: 0,
              background: isActive ? t.navActive : 'transparent',
              color: isActive ? t.navActiveText : t.navText,
              fontSize: 14, fontWeight: isActive ? 500 : 400,
              fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
              position: 'relative',
            }}>
              {isActive && (
                <div style={{
                  position: 'absolute', left: 0, top: '15%', height: '70%', width: 3,
                  borderRadius: '0 2px 2px 0', background: t.brand,
                }} />
              )}
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '16px 24px', borderTop: `1px solid ${t.sidebarBorder}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: t.rowBg, border: `1px solid ${t.cardBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 500, color: t.text,
          }}>T</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: t.text }}>Teun</div>
            <div style={{ fontSize: 11, color: t.textTer }}>Pro plan</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
