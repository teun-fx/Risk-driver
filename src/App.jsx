import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './pages/dashboard/DashboardLayout.jsx';
import Dashboard from './pages/dashboard/Dashboard.jsx';
import Strategies from './pages/dashboard/Strategies.jsx';
import Accounts from './pages/dashboard/Accounts.jsx';
import Costs from './pages/dashboard/Costs.jsx';
import Roadmap from './pages/dashboard/Roadmap.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="strategies" element={<Strategies />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="costs" element={<Costs />} />
        <Route path="roadmap" element={<Roadmap />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
