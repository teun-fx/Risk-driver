import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import TopBar from '../../components/TopBar';
import { accounts as initialAccounts, strategies as initialStrategies } from '../../data/mockData';

// Strategies/accounts live here (not inside the page components) so they
// survive navigating away and back — the page components remount on every
// route change, which was silently discarding anything added in them.
export default function DashboardLayout() {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [strategies, setStrategies] = useState(initialStrategies);
  const [selectedAccountId, setSelectedAccountId] = useState(initialAccounts[0].id);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar accounts={accounts} selectedAccountId={selectedAccountId} onSelectAccount={setSelectedAccountId} />
        <div className="flex-1 p-4 md:p-8">
          <Outlet context={{ selectedAccountId, accounts, setAccounts, strategies, setStrategies }} />
        </div>
      </div>
    </div>
  );
}
