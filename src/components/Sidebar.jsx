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
    width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  switch (id) {
    case 'dashboard':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="8" height="8" rx="1" />
          <rect x="13" y="3" width="8" height="8" rx="1" />
          <rect x="3" y="13" width="8" height="8" rx="1" />
          <rect x="13" y="13" width="8" height="8" rx="1" />
        </svg>
      );
    case 'strategies':
      return (
        <svg {...props}>
          <polyline points="3,17 9,11 13,14 21,6" />
          <polyline points="15,6 21,6 21,12" />
        </svg>
      );
    case 'accounts':
      return (
        <svg {...props}>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
          <line x1="6" y1="15" x2="10" y2="15" />
        </svg>
      );
    case 'costs':
      return (
        <svg {...props}>
          <path d="M20 7H4a2 2 0 00-2 2v8a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
          <path d="M16 3H8L4 7h16l-4-4z" />
          <circle cx="12" cy="14" r="2" />
        </svg>
      );
    case 'roadmap':
      return (
        <svg {...props}>
          <circle cx="5" cy="18" r="2" />
          <circle cx="19" cy="6" r="2" />
          <path d="M5 16C5 10 10 8 14 8" strokeDasharray="3 2" />
          <path d="M14 8l3-3" />
          <line x1="17" y1="5" x2="21" y2="5" />
          <line x1="19" y1="3" x2="19" y2="7" />
        </svg>
      );
    case 'insights':
      return (
        <svg {...props}>
          <path d="M9 21h6M12 3a6 6 0 016 6c0 2.5-1.5 4.5-3 5.5V17H9v-2.5C7.5 13.5 6 11.5 6 9a6 6 0 016-6z" />
        </svg>
      );
    default:
      return null;
  }
}

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
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '9px 18px', margin: '1px 0',
              border: 'none', borderRadius: 0,
              borderLeft: isActive ? '3px solid #1DB954' : '3px solid transparent',
              background: isActive ? '#F0F9F3' : 'transparent',
              color: isActive ? '#1DB954' : t.navText,
              fontSize: 14, fontWeight: isActive ? 500 : 400,
              fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
              boxSizing: 'border-box',
            }}>
              <NavIcon id={item.id} />
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
