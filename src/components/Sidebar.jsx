import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

function Icon({ path, className = 'w-[18px] h-[18px]' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {path}
    </svg>
  );
}

const icons = {
  dashboard: <Icon path={<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>} />,
  strategies: <Icon path={<><path d="M3 17l5-5 4 4 8-9" /><path d="M15 7h5v5" /></>} />,
  accounts: <Icon path={<><rect x="2.5" y="5.5" width="19" height="13" rx="2" /><path d="M2.5 9.5h19" /></>} />,
  costs: <Icon path={<><path d="M6 2.5h9l4 4v15H6z" /><path d="M14.5 2.5v4.5H19" /><path d="M9 12h6M9 15.5h6" /></>} />,
  roadmap: <Icon path={<><path d="M3 11l4-6 5 4 4-6 5 7" /><path d="M3 20h18" /></>} />,
};

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: icons.dashboard, end: true },
  { to: '/dashboard/strategies', label: 'Strategies', icon: icons.strategies },
  { to: '/dashboard/accounts', label: 'Accounts', icon: icons.accounts },
  { to: '/dashboard/costs', label: 'Costs', icon: icons.costs },
  { to: '/dashboard/roadmap', label: 'Roadmap', icon: icons.roadmap },
];

function SidebarContent({ onNavigate }) {
  return (
    <div className="flex flex-col h-full bg-[#1c1c1f] w-[220px]">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="w-7 h-7 rounded-md bg-brand-500 text-white flex items-center justify-center font-bold text-sm">
          R
        </div>
        <span className="font-semibold text-white tracking-tight">Risk Driver</span>
      </div>
      <nav className="flex-1 px-3 space-y-0.5 pt-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] font-medium transition-colors ${
                isActive
                  ? 'bg-white/[0.07] text-brand-400'
                  : 'text-zinc-300 hover:bg-white/[0.04] hover:text-zinc-200'
              }`
            }
          >
            <span className="shrink-0">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-white/[0.06] flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold text-zinc-200">
          T
        </div>
        <div>
          <div className="text-sm font-medium text-zinc-100">Teun</div>
          <div className="text-xs text-zinc-500">Pro plan</div>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block">
        <SidebarContent />
      </div>

      {/* Mobile hamburger */}
      <div className="md:hidden flex items-center justify-between bg-[#1c1c1f] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-brand-500 text-white flex items-center justify-center font-bold text-sm">
            R
          </div>
          <span className="font-semibold text-white tracking-tight">Risk Driver</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-md text-zinc-300 hover:bg-white/[0.06]"
          aria-label="Open menu"
        >
          <Icon path={<><path d="M4 6h16M4 12h16M4 18h16" /></>} />
        </button>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-[220px] h-full shadow-xl">
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
