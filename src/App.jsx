import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Strategies from './pages/Strategies';
import Statistieken from './pages/Statistieken';
import Kosten from './pages/Kosten';
import AIAdvisor from './pages/AIAdvisor';
import Tools from './pages/Tools';
import { ThemeContext } from './ThemeContext';
import { LIGHT } from './theme';

export default function App() {
  const [activePage, setActivePage] = useState('strategies');
  const [strategies, setStrategies] = useState([]);

  function renderPage() {
    switch (activePage) {
      case 'dashboard':    return <Dashboard strategies={strategies} onNav={setActivePage} />;
      case 'propfirm':     return <Strategies strategies={strategies} setStrategies={setStrategies} />;
      case 'insights':     return <Dashboard strategies={strategies} onNav={setActivePage} initialTab="insights" />;
      case 'analytics':    return <Dashboard strategies={strategies} onNav={setActivePage} initialTab="analytics" />;
      case 'strategies':   return <Strategies strategies={strategies} setStrategies={setStrategies} />;
      case 'statistieken': return <Statistieken strategies={strategies} />;
      case 'kosten':       return <Kosten strategies={strategies} />;
      case 'ai-advisor':   return <AIAdvisor strategies={strategies} />;
      case 'tools':        return <Tools />;
      default:             return <Strategies strategies={strategies} setStrategies={setStrategies} />;
    }
  }

  return (
    <ThemeContext.Provider value={LIGHT}>
      <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: LIGHT.appBg }}>
        <Sidebar active={activePage} onNav={setActivePage} />
        <main style={{ flex: 1, overflowY: 'auto', background: LIGHT.appBg }}>
          {renderPage()}
        </main>
      </div>
    </ThemeContext.Provider>
  );
}
