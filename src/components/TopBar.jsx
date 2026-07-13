import React from 'react';
import { useLocation } from 'react-router-dom';

const titles = {
  '/dashboard': 'Dashboard',
  '/dashboard/strategies': 'Strategies',
  '/dashboard/accounts': 'Accounts',
  '/dashboard/costs': 'Costs',
  '/dashboard/roadmap': 'Roadmap',
};

export default function TopBar({ accounts, selectedAccountId, onSelectAccount }) {
  const location = useLocation();
  const title = titles[location.pathname] || 'Dashboard';

  return (
    <div className="hidden md:flex items-center justify-between px-8 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <h1 className="text-[15px] font-semibold text-gray-900 tracking-tight">{title}</h1>
      <div className="flex items-center gap-2.5">
        <span className="text-xs text-gray-400 font-medium">Account</span>
        <div className="relative">
          <select
            value={selectedAccountId}
            onChange={(e) => onSelectAccount && onSelectAccount(e.target.value)}
            className="appearance-none rounded-md border border-gray-200 pl-3 pr-8 py-1.5 text-sm text-gray-700 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400 transition-colors cursor-pointer"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.type})
              </option>
            ))}
          </select>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
}
