import { DARK as t } from '../theme';

const navItems = [
  { id: 'dashboard',  label: 'Dashboard' },
  { id: 'strategies', label: 'Strategies' },
  { id: 'accounts',   label: 'Accounts' },
  { id: 'costs',      label: 'Costs' },
  { id: 'roadmap',    label: 'Roadmap' },
  { id: 'insights',   label: 'Insights' },
];

function NavIcon({ id }) {
  const props = {
    width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  switch (id) {
    case 'dashboard':
      return <svg {...props}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;
    case 'strategies':
      return <svg {...props}><polyline points="3,17 9,11 13,14 21,6"/><polyline points="15,6 21,6 21,12"/></svg>;
    case 'accounts':
      return <svg {...props}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="15" x2="9" y2="15"/></svg>;
    case 'costs':
      return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5C9.5 8.1 10.6 7 12 7c1.4 0 2.5 1 2.5 2.2 0 1.3-1.1 2-2.5 2s-2.5.8-2.5 2.3c0 1.3 1.1 2.5 2.5 2.5s2.5-1 2.5-2.5"/></svg>;
    case 'roadmap':
      return <svg {...props}><path d="M3 17l4-8 4 4 4-6 4 2"/><circle cx="3" cy="17" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="9" r="1.5" fill="currentColor" stroke="none"/></svg>;
    case 'insights':
      return <svg {...props}><path d="M9 21h6"/><path d="M12 3a6 6 0 016 6c0 2.2-1.2 4.2-3 5.4V17H9v-2.6A6 6 0 0112 3z"/></svg>;
    default: return null;
  }
}

export default function Sidebar({ active, onNav }) {
  return (
    <aside style={{
      width: 200, minHeight: '100vh',
      background: t.sidebar,
      borderRight: `1px solid ${t.sidebarBorder}`,
      display: 'flex', flexDirection: 'column',
      padding: '24px 0', flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: t.brand, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#000' }}>R</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: t.text, letterSpacing: '-0.3px' }}>Risk Driver</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(item => {
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => onNav(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              width: '100%', height: 38, padding: '0 12px',
              border: 'none', borderRadius: 8,
              borderLeft: isActive ? `2px solid ${t.brand}` : '2px solid transparent',
              background: isActive ? t.navActive : 'transparent',
              color: isActive ? t.navActiveText : t.navText,
              fontSize: 13, fontWeight: 500,
              fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
              transition: 'background 120ms ease, color 120ms ease',
            }}>
              <NavIcon id={item.id} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: '16px 20px', borderTop: `1px solid ${t.sidebarBorder}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: t.rowBg, border: `1px solid ${t.cardBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600, color: t.text,
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
