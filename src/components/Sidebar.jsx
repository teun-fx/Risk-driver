import { useState } from 'react';
import { DARK as t } from '../theme';

const navItems = [
  { id: 'dashboard',   label: 'Dashboard' },
  { id: 'strategies',  label: 'Strategies' },
  { id: 'propfirm',    label: 'Prop Firm Analysis' },
  { id: 'breach',      label: 'Breach Calculator' },
  { id: 'accounts',    label: 'Accounts' },
  { id: 'costs',       label: 'Costs' },
  { id: 'roadmap',     label: 'Roadmap' },
  { id: 'insights',    label: 'Insights' },
];

function NavIcon({ id }) {
  const props = {
    width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none',
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
    case 'propfirm':
      return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/></svg>;
    case 'breach':
      return <svg {...props}><path d="M12 2L2 7v5c0 5.25 4.25 10.15 10 11.35C17.75 22.15 22 17.25 22 12V7L12 2z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    case 'roadmap':
      return <svg {...props}><path d="M3 17l4-8 4 4 4-6 4 2"/><circle cx="3" cy="17" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="9" r="1.5" fill="currentColor" stroke="none"/></svg>;
    case 'insights':
      return <svg {...props}><path d="M9 21h6"/><path d="M12 3a6 6 0 016 6c0 2.2-1.2 4.2-3 5.4V17H9v-2.6A6 6 0 0112 3z"/></svg>;
    default: return null;
  }
}

function ChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15,18 9,12 15,6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9,18 15,12 9,6" />
    </svg>
  );
}

export default function Sidebar({ active, onNav }) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar-collapsed') === 'true'; }
    catch { return false; }
  });

  function toggle() {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('sidebar-collapsed', String(next)); } catch {}
      return next;
    });
  }

  const w = collapsed ? 52 : 200;

  return (
    <aside style={{
      width: w,
      minHeight: '100vh',
      background: t.sidebar,
      borderRight: `1px solid ${t.sidebarBorder}`,
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      flexShrink: 0,
      transition: 'width 200ms ease',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Logo */}
      <div style={{ padding: collapsed ? '0 0 28px' : '0 20px 28px', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 8, minWidth: 0 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: t.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#000' }}>F</span>
          </div>
          {!collapsed && (
            <span style={{ fontSize: 15, fontWeight: 700, color: t.text, letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>FundIQ</span>
          )}
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={toggle}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          position: 'absolute', top: 24, right: collapsed ? '50%' : 10,
          transform: collapsed ? 'translateX(50%)' : 'none',
          width: 22, height: 22, borderRadius: 6,
          border: `1px solid ${t.border}`,
          background: t.card,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: t.textTer,
          padding: 0, transition: 'right 200ms ease, transform 200ms ease',
          zIndex: 10,
        }}
      >
        {collapsed ? <ChevronRight /> : <ChevronLeft />}
      </button>

      {/* Nav */}
      <nav style={{ flex: 1, padding: collapsed ? '0 6px' : '0 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(item => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex', alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: collapsed ? 0 : 9,
                width: '100%', height: 38,
                padding: collapsed ? '0' : '0 12px',
                border: 'none', borderRadius: 8,
                borderLeft: isActive ? `2px solid ${t.brand}` : '2px solid transparent',
                background: isActive ? t.navActive : 'transparent',
                color: isActive ? t.navActiveText : t.navText,
                fontSize: 13, fontWeight: 500,
                fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
                transition: 'background 120ms ease, color 120ms ease',
                whiteSpace: 'nowrap', overflow: 'hidden',
              }}
            >
              <NavIcon id={item.id} />
              {!collapsed && item.label}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div style={{
        padding: collapsed ? '16px 0' : '16px 20px',
        borderTop: `1px solid ${t.sidebarBorder}`,
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: collapsed ? 0 : 10,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: t.rowBg, border: `1px solid ${t.cardBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 600, color: t.text, flexShrink: 0,
        }}>T</div>
        {!collapsed && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: t.text }}>Teun</div>
            <div style={{ fontSize: 11, color: t.textTer }}>Pro plan</div>
          </div>
        )}
      </div>
    </aside>
  );
}
