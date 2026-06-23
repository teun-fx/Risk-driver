import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Strategies from './pages/Strategies';
import Accounts from './pages/Accounts';
import Statistics from './pages/Statistics';
import Costs from './pages/Costs';
import Roadmap from './pages/Roadmap';
import Insights from './pages/Insights';
import { ThemeContext } from './ThemeContext';
import { DARK } from './theme';

// ─── Generate demo trade list ─────────────────────────────────────────────────

function generateDemoTrades() {
  const instruments = ['NQ', 'ES', 'GC', 'CL', 'EURUSD', 'GBPUSD', 'XAUUSD', 'NQ', 'ES', 'NQ'];
  const setups      = ['Breakout Retest', 'Fair Value Gap', 'Liquidity Sweep', 'Order Block', 'VWAP Reclaim', 'Market Structure Shift'];
  const sessions    = ['London', 'New York', 'Asian', 'New York'];
  const trades      = [];
  let   date        = new Date('2024-01-08');
  const endDate     = new Date('2026-06-20');
  let   id          = 1;

  while (date <= endDate) {
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) { date.setDate(date.getDate() + 1); continue; }

    // 2-4 trades per day, ~3 days per week active
    if (Math.random() < 0.55) { date.setDate(date.getDate() + 1); continue; }

    const tradesPerDay = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < tradesPerDay; i++) {
      const wr        = 0.62;
      const isWin     = Math.random() < wr;
      const isBE      = !isWin && Math.random() < 0.15;
      const rMultiple = isWin
        ? parseFloat((Math.random() * 2.5 + 0.5).toFixed(2))
        : isBE ? 0 : parseFloat(-(Math.random() * 0.8 + 0.2).toFixed(2));
      const riskPct   = 1;
      const BASE      = 100000;
      const profit    = parseFloat(((rMultiple * riskPct / 100) * BASE).toFixed(2));
      const result    = isWin ? 'Win' : isBE ? 'Break-even' : 'Loss';
      const dateStr   = date.toISOString().slice(0, 10);
      const inst      = instruments[Math.floor(Math.random() * instruments.length)];

      trades.push({
        id:         id++,
        date:       dateStr,
        closeDate:  dateStr,
        instrument: inst,
        direction:  Math.random() < 0.55 ? 'Long' : 'Short',
        setup:      setups[Math.floor(Math.random() * setups.length)],
        session:    sessions[Math.floor(Math.random() * sessions.length)],
        profit,
        rMultiple:  String(rMultiple),
        rr:         rMultiple > 0 ? `1:${rMultiple.toFixed(1)}` : '—',
        result,
        lots:       parseFloat((Math.random() * 3 + 0.5).toFixed(2)),
        notes:      '',
      });
    }
    date.setDate(date.getDate() + 1);
  }
  return trades;
}

const DEMO_TRADES = generateDemoTrades();

const DUMMY_ACCOUNTS = [
  {
    id: 0,
    type: 'demo',
    group: 'other',
    brokerName: 'Demo Account',
    broker: 'Risk Driver',
    accountType: 'Demo Account',
    accountSize: 100000,
    currency: 'USD',
    status: 'active',
    startDate: '2024-01-08',
    startingBalance: 100000,
    profitSplit: 100,
    activationCost: 0,
    monthlyCost: 0,
    tradeList: DEMO_TRADES,
    notes: 'Auto-generated demo account with realistic random trades.',
  },
  {
    id: 1,
    type: 'prop_challenge',
    brokerName: 'FTMO',
    accountType: 'Prop Firm Challenge',
    accountSize: 100000,
    status: 'active',
    startDate: '2026-01-15',
    dailyDDLimit: 5,
    totalDDLimit: 10,
    profitTarget: 10,
    consistencyRule: 'No single day > 30% of total profit',
    maxPositionSize: '2 lots',
    leverage: '1:100',
    overnightHold: false,
    weekendHold: false,
    newsTrading: false,
    profitSplit: 80,
    payoutSchedule: 'Monthly',
    activationCost: 540,
    monthlyCost: 0,
    tradeList: [],
  },
  {
    id: 2,
    type: 'futures_funded',
    brokerName: 'Topstep',
    accountType: 'Futures Funded',
    accountSize: 50000,
    status: 'active',
    startDate: '2025-11-01',
    dailyDDLimit: 2000,
    totalDDLimit: 2500,
    profitTarget: null,
    consistencyRule: 'None',
    maxPositionSize: '5 contracts',
    leverage: 'Futures standard',
    overnightHold: false,
    weekendHold: false,
    newsTrading: true,
    profitSplit: 90,
    payoutSchedule: 'Weekly',
    activationCost: 165,
    monthlyCost: 0,
    tradeList: [],
  },
  {
    id: 3,
    type: 'private',
    brokerName: 'IC Markets',
    accountType: 'Private Broker Account',
    accountSize: 25000,
    status: 'active',
    startDate: '2024-06-01',
    dailyDDLimit: null,
    totalDDLimit: null,
    profitTarget: null,
    consistencyRule: 'None',
    maxPositionSize: 'No limit',
    leverage: '1:500',
    overnightHold: true,
    weekendHold: true,
    newsTrading: true,
    profitSplit: 100,
    payoutSchedule: 'On demand',
    activationCost: 0,
    monthlyCost: 0,
    tradeList: [],
  },
];

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [strategies, setStrategies] = useState([]);
  const [accounts, setAccounts] = useState(DUMMY_ACCOUNTS);

  function renderPage() {
    switch (activePage) {
      case 'dashboard':   return <Dashboard strategies={strategies} accounts={accounts} onNav={setActivePage} />;
      case 'strategies':  return <Strategies strategies={strategies} setStrategies={setStrategies} />;
      case 'accounts':    return <Accounts accounts={accounts} setAccounts={setAccounts} />;
      case 'costs':       return <Costs />;
      case 'roadmap':     return <Roadmap accounts={accounts} strategies={strategies} />;
      case 'insights':    return <Insights strategies={strategies} />;
      default:            return <Dashboard strategies={strategies} accounts={accounts} onNav={setActivePage} />;
    }
  }

  return (
    <ThemeContext.Provider value={DARK}>
      <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: DARK.appBg }}>
        <Sidebar active={activePage} onNav={setActivePage} />
        <main style={{ flex: 1, overflowY: 'auto', background: DARK.appBg }}>
          {renderPage()}
        </main>
      </div>
    </ThemeContext.Provider>
  );
}
