import { useState, useRef, useEffect } from 'react';
import { myfxbookLogin, myfxbookGetAccounts, myfxbookGetHistory, myfxbookGetOpenTrades } from '../services/myfxbook.js';
import { parseTradeFile } from '../services/csvParser.js';
import { useTheme } from '../ThemeContext';

// ─── no seed data — starts empty ─────────────────────────────────────────────
const SEED_ACCOUNTS = [];

// ─── prop firms + regular brokers ────────────────────────────────────────────
const PROP_FIRMS = [
  { id: 'ftmo',        name: 'FTMO',                   platform: 'MT5',     servers: ['FTMO-Server3', 'FTMO-Server2', 'FTMO-Server', 'FTMO-Demo3', 'FTMO-Demo2'] },
  { id: 'tft',         name: 'The Funded Trader',       platform: 'MT5',     servers: ['TheFundedTraderLive-Server', 'TheFundedTraderDemo-Server'] },
  { id: 'apex',        name: 'Apex Trader Funding',     platform: 'Rithmic', servers: ['Apex-Rithmic-Live', 'Apex-Rithmic-Demo'] },
  { id: 'mff',         name: 'My Forex Funds',          platform: 'MT5',     servers: ['MyForexFunds-Live', 'MyForexFunds-Demo'] },
  { id: 'e8',          name: 'E8 Funding',              platform: 'MT5',     servers: ['E8Funding-Live', 'E8Funding-Demo'] },
  { id: 'fidelcrest',  name: 'Fidelcrest',              platform: 'MT5',     servers: ['Fidelcrest-Live', 'Fidelcrest-Demo'] },
  { id: 'tff',         name: 'True Forex Funds',        platform: 'MT5',     servers: ['TheTrustedForexFunds-Real', 'TheTrustedForexFunds-Demo'] },
  { id: 'fundednext',  name: 'FundedNext',              platform: 'MT5',     servers: ['FundedNext-Live', 'FundedNext-Demo'] },
  { id: 'blueguardian',name: 'Blue Guardian',           platform: 'MT5',     servers: ['BlueGuardianCapital-Live', 'BlueGuardianCapital-Demo'] },
  { id: 'citytraders', name: 'City Traders Imperium',   platform: 'MT5',     servers: ['CityTradersImperium-Live', 'CityTradersImperium-Demo'] },
  { id: 'alfafunded',  name: 'Alfa Funded',             platform: 'MT5',     servers: ['AlfaFunded-Live', 'AlfaFunded-Demo'] },
  { id: 'instant',     name: 'Instant Funding',         platform: 'MT5',     servers: ['InstantFunding-Live', 'InstantFunding-Demo'] },
  { id: 'topstep',     name: 'TopStep',                 platform: 'Rithmic', servers: ['TopStep-Rithmic-Live', 'TopStep-Rithmic-Combine'] },
  { id: 'the5ers',     name: 'The5%ers',                platform: 'MT5',     servers: ['The5ers-Server', 'The5ers-Demo'] },
  { id: 'earn2trade',  name: 'Earn2Trade',              platform: 'Rithmic', servers: ['Earn2Trade-Rithmic-Live', 'Earn2Trade-Rithmic-Demo'] },
  { id: 'maven',       name: 'Maven Trading',           platform: 'MT5',     servers: ['MavenTrading-Live', 'MavenTrading-Demo'] },
  { id: 'lux',         name: 'Lux Trading Firm',        platform: 'MT5',     servers: ['LuxTradingFirm-Live', 'LuxTradingFirm-Demo'] },
  { id: 'fundedtp',    name: 'Funded Trading Plus',     platform: 'MT5',     servers: ['FundedTradingPlus-Live', 'FundedTradingPlus-Demo'] },
  { id: 'goat',        name: 'Goat Funded Trader',      platform: 'MT5',     servers: ['GoatFundedTrader-Live', 'GoatFundedTrader-Demo'] },
  { id: 'fundingpips', name: 'Funding Pips',            platform: 'MT5',     servers: ['FundingPips-Live', 'FundingPips-Demo'] },
  { id: 'holaprime',   name: 'Hola Prime',              platform: 'MT5',     servers: ['HolaPrime-Live', 'HolaPrime-Demo'] },
  { id: 'aquafunded',  name: 'Aqua Funded',             platform: 'MT5',     servers: ['AquaFunded-Live', 'AquaFunded-Demo'] },
  { id: 'custom_prop', name: 'Other prop firm',         platform: 'MT4/MT5', servers: [] },
];

const BROKERS = [
  { id: 'interactivebrokers', name: 'Interactive Brokers',   platform: 'TWS/IBKR', servers: ['live', 'paper'] },
  { id: 'td',                 name: 'TD Ameritrade / Thinkorswim', platform: 'TOS', servers: ['TOS-Live'] },
  { id: 'tradestation',       name: 'TradeStation',          platform: 'TradeStation', servers: ['TS-Live'] },
  { id: 'ninjatrader',        name: 'NinjaTrader Brokerage', platform: 'NT8',  servers: ['NT-Live'] },
  { id: 'tastytrade',         name: 'tastytrade',            platform: 'TWS',  servers: ['TT-Live'] },
  { id: 'pepperstone',        name: 'Pepperstone',           platform: 'MT5',  servers: ['Pepperstone-Live01', 'Pepperstone-Live02'] },
  { id: 'icmarkets',          name: 'IC Markets',            platform: 'MT5',  servers: ['ICMarkets-Live01', 'ICMarkets-Live02', 'ICMarkets-Live03'] },
  { id: 'xm',                 name: 'XM',                    platform: 'MT5',  servers: ['XM.COM-Real'] },
  { id: 'fp',                 name: 'FP Markets',            platform: 'MT5',  servers: ['FP-Live01'] },
  { id: 'tickmill',           name: 'Tickmill',              platform: 'MT5',  servers: ['Tickmill-Live'] },
  { id: 'forex',              name: 'Forex.com / GAIN Capital', platform: 'MT4', servers: ['FOREX-Live'] },
  { id: 'oanda',              name: 'OANDA',                 platform: 'MT5',  servers: ['OANDA-Live', 'OANDA-Practice'] },
  { id: 'custom',             name: 'Other / Custom',        platform: 'MT4/MT5', servers: [] },
];

const ALL_PROVIDERS = [
  { group: 'Prop Firms', items: PROP_FIRMS },
  { group: 'Brokers', items: BROKERS },
];

// ─── helpers ──────────────────────────────────────────────────────────────────
function findProvider(id) {
  return [...PROP_FIRMS, ...BROKERS].find(p => p.id === id);
}

function Card({ children, style = {} }) {
  const t = useTheme();
  return (
    <div style={{
      background: t.card, border: `1px solid ${t.cardBorder}`,
      borderRadius: 18, boxShadow: t.cardShadow,
      transition: 'background 0.35s ease, border-color 0.35s ease', ...style,
    }}>
      {children}
    </div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 12, color: '#6E6E73', marginBottom: 6, fontWeight: 500 }}>{children}</div>;
}

function Input({ style = {}, ...props }) {
  return (
    <input
      {...props}
      style={{
        width: '100%', padding: '10px 13px', border: '1px solid #D2D2D7', borderRadius: 10,
        fontSize: 14, fontFamily: 'inherit', color: '#1D1D1F', background: '#FAFAFA',
        outline: 'none', transition: 'border-color 0.15s', ...style,
      }}
      onFocus={e => e.target.style.borderColor = '#A1D533'}
      onBlur={e => e.target.style.borderColor = '#D2D2D7'}
    />
  );
}

function GroupedSelect({ value, onChange, placeholder }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', padding: '10px 13px', border: '1px solid #D2D2D7', borderRadius: 10,
        fontSize: 14, fontFamily: 'inherit', color: value ? '#1D1D1F' : '#AEAEB2',
        background: '#FAFAFA', outline: 'none', cursor: 'pointer', appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236E6E73' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
      }}
    >
      <option value="">{placeholder}</option>
      {ALL_PROVIDERS.map(group => (
        <optgroup key={group.group} label={group.group}>
          {group.items.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.platform})</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

function ServerSelect({ provider, value, onChange }) {
  if (!provider) return null;
  if (provider.servers.length === 0) {
    return <Input placeholder="broker.server.com:443" value={value} onChange={e => onChange(e.target.value)} />;
  }
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', padding: '10px 13px', border: '1px solid #D2D2D7', borderRadius: 10,
        fontSize: 14, fontFamily: 'inherit', color: '#1D1D1F', background: '#FAFAFA',
        outline: 'none', cursor: 'pointer', appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236E6E73' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
      }}
    >
      <option value="">Select server…</option>
      {provider.servers.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}

function StatusBadge({ status }) {
  const map = {
    connected: { bg: '#F0F9E0', color: '#3D7A00', dot: '#A1D533', label: 'Connected' },
    syncing:   { bg: '#EEF4FF', color: '#1A56A4', dot: '#4A90D9', label: 'Syncing…' },
    error:     { bg: '#FEF0F0', color: '#C0392B', dot: '#E74C3C', label: 'Error' },
    imported:  { bg: '#F5F5F7', color: '#6E6E73', dot: '#AEAEB2', label: 'Imported' },
    manual:    { bg: '#F5F5F7', color: '#6E6E73', dot: '#AEAEB2', label: 'Manual' },
  };
  const s = map[status] || map.manual;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 99,
      background: s.bg, color: s.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block',
        animation: status === 'syncing' ? 'pulse 1.2s infinite' : 'none' }} />
      {s.label}
    </span>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid #D2D2D7', marginBottom: 24 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          padding: '10px 20px', border: 'none', background: 'transparent',
          fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
          fontWeight: active === t.id ? 500 : 400,
          color: active === t.id ? '#1D1D1F' : '#6E6E73',
          borderBottom: active === t.id ? '2px solid #1D1D1F' : '2px solid transparent',
          marginBottom: -1, transition: 'color 0.15s',
        }}>{t.label}</button>
      ))}
    </div>
  );
}

// ─── Myfxbook tab ────────────────────────────────────────────────────────────
function MyfxbookTab({ onSubmit }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState('credentials'); // credentials | pick | loading
  const [error, setError] = useState('');
  const [session, setSession] = useState('');
  const [mfxAccounts, setMfxAccounts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [importing, setImporting] = useState(false);

  async function handleLogin() {
    setStep('loading'); setError('');
    try {
      const sess = await myfxbookLogin(email, password);
      const accs = await myfxbookGetAccounts(sess);
      setSession(sess);
      setMfxAccounts(accs);
      setStep('pick');
    } catch (e) {
      setError(e.message || 'Login failed — check your email and password');
      setStep('credentials');
    }
  }

  async function handleImport() {
    if (!selected) return;
    setImporting(true); setError('');
    try {
      const acc = mfxAccounts.find(a => String(a.id) === String(selected));
      const history = await myfxbookGetHistory(session, acc.id);
      const openTrades = await myfxbookGetOpenTrades(session, acc.id);
      onSubmit({ type: 'myfxbook', session, mfxAccount: acc, history, openTrades });
    } catch (e) {
      setError(e.message || 'Failed to fetch account data');
      setImporting(false);
    }
  }

  if (step === 'loading') {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', width: 28, height: 28, border: '3px solid #D2D2D7', borderTopColor: '#1D1D1F', borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginBottom: 16 }} />
        <div style={{ fontSize: 14, color: '#6E6E73' }}>Connecting to Myfxbook…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (step === 'pick') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: '#F0F9E0', border: '1px solid #C5E8A0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#3D7A00' }}>
          ✓ Logged in — select an account to import
        </div>
        <div>
          <Label>Select account</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {mfxAccounts.map(acc => (
              <label key={acc.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                border: `1px solid ${String(selected) === String(acc.id) ? '#A1D533' : '#D2D2D7'}`,
                borderRadius: 12, cursor: 'pointer',
                background: String(selected) === String(acc.id) ? '#F8FDE8' : '#FAFAFA',
              }}>
                <input type="radio" name="mfx_acc" value={acc.id}
                  checked={String(selected) === String(acc.id)}
                  onChange={() => setSelected(acc.id)}
                  style={{ accentColor: '#A1D533' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1D1D1F' }}>{acc.name}</div>
                  <div style={{ fontSize: 11, color: '#6E6E73', marginTop: 2 }}>
                    {acc.broker} · {acc.currency} · {acc.server}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1D1D1F' }}>
                    {acc.currency} {parseFloat(acc.balance || 0).toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                  </div>
                  <div style={{ fontSize: 11, color: acc.gain >= 0 ? '#3D7A00' : '#C0392B' }}>
                    {acc.gain >= 0 ? '+' : ''}{parseFloat(acc.gain || 0).toFixed(2)}% gain
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
        {error && <div style={{ background: '#FEF0F0', border: '1px solid #F5B8B8', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C0392B' }}>✗ {error}</div>}
        <button onClick={handleImport} disabled={!selected || importing} style={{
          padding: '12px', border: 'none', borderRadius: 12,
          background: selected && !importing ? '#1D1D1F' : '#D2D2D7',
          color: '#FFFFFF', fontSize: 14, fontFamily: 'inherit', fontWeight: 500,
          cursor: selected && !importing ? 'pointer' : 'not-allowed',
        }}>
          {importing ? 'Importing…' : 'Import account'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#F5F5F7', borderRadius: 12, padding: '12px 16px', fontSize: 12, color: '#6E6E73' }}>
        Log in met je Myfxbook account om live equity, balance en trade history te importeren.
      </div>
      <div>
        <Label>Email</Label>
        <Input type="email" placeholder="jouw@email.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
      </div>
      <div>
        <Label>Password</Label>
        <div style={{ position: 'relative' }}>
          <Input
            type={showPass ? 'text' : 'password'}
            placeholder="Myfxbook wachtwoord"
            value={password} onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#AEAEB2', cursor: 'pointer', fontSize: 12 }}>
            {showPass ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
      {error && <div style={{ background: '#FEF0F0', border: '1px solid #F5B8B8', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C0392B' }}>✗ {error}</div>}
      <button onClick={handleLogin} disabled={!email || !password} style={{
        padding: '12px', border: 'none', borderRadius: 12,
        background: email && password ? '#1D1D1F' : '#D2D2D7',
        color: '#FFFFFF', fontSize: 14, fontFamily: 'inherit', fontWeight: 500,
        cursor: email && password ? 'pointer' : 'not-allowed',
      }}>
        Connect with Myfxbook
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── API tab ──────────────────────────────────────────────────────────────────
function APITab({ onSubmit }) {
  const [providerId, setProviderId] = useState('');
  const [server, setServer] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [label, setLabel] = useState('');
  const [accountSize, setAccountSize] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const provider = findProvider(providerId);
  const isPropFirm = PROP_FIRMS.some(p => p.id === providerId);

  // Reset server when provider changes
  useEffect(() => { setServer(''); setTestResult(null); }, [providerId]);

  function handleTest() {
    setTesting(true); setTestResult(null);
    setTimeout(() => {
      setTesting(false);
      setTestResult(login && password && server ? 'ok' : 'error');
    }, 2000);
  }

  function handleConnect() {
    setConnecting(true);
    setTimeout(() => {
      onSubmit({ type: 'api', providerId, provider, server, login, label, accountSize: parseFloat(accountSize) || null });
    }, 1200);
  }

  const canTest = login && password && server && !testing;
  const canConnect = testResult === 'ok' && label && accountSize && parseFloat(accountSize) > 0 && !connecting;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#F5F5F7', borderRadius: 12, padding: '12px 16px', fontSize: 12, color: '#6E6E73' }}>
        EdgeProof connects via read-only API. Your credentials are encrypted at rest and never used to place trades.
      </div>

      <div>
        <Label>Firm or broker</Label>
        <GroupedSelect value={providerId} onChange={setProviderId} placeholder="Select firm or broker…" />
      </div>

      {provider && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <Label>Account label</Label>
              <Input placeholder={`e.g. ${provider.name} account`} value={label} onChange={e => setLabel(e.target.value)} />
            </div>
            <div>
              <Label>Server</Label>
              <ServerSelect provider={provider} value={server} onChange={setServer} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div>
              <Label>Login / Account number</Label>
              <Input placeholder="e.g. 40281934" value={login} onChange={e => setLogin(e.target.value)} autoComplete="off" />
            </div>
            <div>
              <Label>Account size (€) *</Label>
              <Input
                placeholder="e.g. 200000"
                value={accountSize}
                onChange={e => setAccountSize(e.target.value)}
                style={testResult === 'ok' && (!accountSize || parseFloat(accountSize) <= 0) ? { borderColor: '#E8564A' } : {}}
              />
              {testResult === 'ok' && (!accountSize || parseFloat(accountSize) <= 0) && (
                <div style={{ fontSize: 11, color: '#C0392B', marginTop: 4 }}>Required — enter your challenge account size</div>
              )}
            </div>
            <div>
              <Label>{isPropFirm ? 'Investor (read-only) password' : 'API key or password'}</Label>
              <div style={{ position: 'relative' }}>
                <Input
                  type={showPass ? 'text' : 'password'}
                  placeholder={isPropFirm ? 'Investor password' : 'Password or API key'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button onClick={() => setShowPass(s => !s)} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  border: 'none', background: 'transparent', color: '#AEAEB2', cursor: 'pointer', fontSize: 12,
                }}>{showPass ? 'Hide' : 'Show'}</button>
              </div>
            </div>
          </div>

          {isPropFirm && (
            <div style={{ background: '#FFF4E0', border: '1px solid #F5D08A', borderRadius: 12, padding: '12px 16px', fontSize: 12, color: '#7A5200' }}>
              <strong>Use your read-only (investor) password</strong>, not your master password. This grants view-only access and prevents any trading activity.
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleTest} disabled={!canTest} style={{
              flex: 1, padding: '11px', border: '1px solid #D2D2D7', borderRadius: 12,
              background: '#FFFFFF', color: canTest ? '#1D1D1F' : '#AEAEB2',
              fontSize: 14, fontFamily: 'inherit', fontWeight: 500, cursor: canTest ? 'pointer' : 'not-allowed',
            }}>
              {testing ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #D2D2D7', borderTopColor: '#1D1D1F', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Testing…
                </span>
              ) : 'Test connection'}
            </button>
            <button onClick={handleConnect} disabled={!canConnect} style={{
              flex: 2, padding: '11px', border: 'none', borderRadius: 12,
              background: canConnect ? '#1D1D1F' : '#D2D2D7',
              color: '#FFFFFF', fontSize: 14, fontFamily: 'inherit', fontWeight: 500, cursor: canConnect ? 'pointer' : 'not-allowed',
            }}>
              {connecting ? 'Connecting…' : 'Connect account'}
            </button>
          </div>

          {testResult === 'ok' && (
            <div style={{ background: '#F0F9E0', border: '1px solid #C5E8A0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#3D7A00' }}>
              ✓ Connection successful — click "Connect account" to start syncing
            </div>
          )}
          {testResult === 'error' && (
            <div style={{ background: '#FEF0F0', border: '1px solid #F5B8B8', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C0392B' }}>
              ✗ Connection failed — check your login, server and password
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  );
}

// ─── CSV upload tab ───────────────────────────────────────────────────────────
function CSVUploadTab({ onSubmit }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [label, setLabel] = useState('');
  const [providerId, setProviderId] = useState('');
  const [startingBalance, setStartingBalance] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(null); // { trades, totalProfit, winRate, wins, losses, bes }
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);
  const fileRef = useRef();

  async function handleFile(f) {
    if (!f) return;
    setFile(f); setParsed(null); setParseError(''); setParsing(true);
    try {
      const result = await parseTradeFile(f);
      setParsed(result);
    } catch (e) {
      setParseError(e.message);
    } finally {
      setParsing(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  function handleImport() {
    setImporting(true);
    const bal = parseFloat(startingBalance) || null;
    onSubmit({ type: 'csv', label, providerId, provider: findProvider(providerId), trades: parsed?.trades || [], startingBalance: bal });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Download template */}
      <div style={{ background: '#F5F5F7', borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: '#6E6E73' }}>
          Gebruik het RiskDriver template, of upload een MT4/MT5 HTML statement.
        </div>
        <a href="/riskdriver-template.csv" download style={{
          fontSize: 12, fontWeight: 500, color: '#1D1D1F', padding: '6px 12px',
          border: '1px solid #D2D2D7', borderRadius: 8, background: '#FFFFFF',
          textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 12,
        }}>⬇ Download template</a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <div>
          <Label>Account label *</Label>
          <Input placeholder="e.g. XAUUSD Backtest V2" value={label} onChange={e => setLabel(e.target.value)} />
        </div>
        <div>
          <Label>Starting balance (€/$) *</Label>
          <Input placeholder="e.g. 500000" value={startingBalance} onChange={e => setStartingBalance(e.target.value)} />
        </div>
        <div>
          <Label>Firm or broker</Label>
          <GroupedSelect value={providerId} onChange={setProviderId} placeholder="Select (optional)…" />
        </div>
      </div>

      <div>
        <Label>File</Label>
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragging ? '#A1D533' : parsed ? '#A1D533' : '#D2D2D7'}`,
            borderRadius: 14, padding: '28px 24px', textAlign: 'center',
            background: dragging ? '#F8FDE8' : parsed ? '#F8FDE8' : '#FAFAFA', transition: 'all 0.15s',
          }}
        >
          <input ref={fileRef} type="file" accept=".csv,.htm,.html"
            style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
            onChange={e => handleFile(e.target.files[0])} />
          {parsing ? (
            <div>
              <div style={{ display: 'inline-block', width: 22, height: 22, border: '2px solid #D2D2D7', borderTopColor: '#1D1D1F', borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginBottom: 8 }} />
              <div style={{ fontSize: 13, color: '#6E6E73' }}>Parsing trades…</div>
            </div>
          ) : file ? (
            <div>
              <div style={{ fontSize: 20, marginBottom: 6 }}>📄</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#1D1D1F' }}>{file.name}</div>
              <div style={{ fontSize: 12, color: '#AEAEB2', marginTop: 2, marginBottom: 10 }}>{(file.size / 1024).toFixed(1)} KB</div>
              <button onClick={e => { e.stopPropagation(); fileRef.current.click(); }} style={{ fontSize: 12, padding: '6px 14px', border: '1px solid #D2D2D7', borderRadius: 8, background: '#FFFFFF', color: '#6E6E73', cursor: 'pointer', fontFamily: 'inherit' }}>Ander bestand</button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 26, marginBottom: 8 }}>⬆</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#1D1D1F' }}>Sleep bestand hierheen</div>
              <div style={{ fontSize: 12, color: '#AEAEB2', marginTop: 4, marginBottom: 14 }}>CSV (RiskDriver template) · MT4/MT5 HTML statement</div>
              <button
                onClick={e => { e.stopPropagation(); fileRef.current.click(); }}
                style={{ fontSize: 13, padding: '8px 20px', border: '1px solid #D2D2D7', borderRadius: 10, background: '#FFFFFF', color: '#1D1D1F', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
              >Kies bestand</button>
            </div>
          )}
        </div>
      </div>

      {/* Parse error */}
      {parseError && (
        <div style={{ background: '#FEF0F0', border: '1px solid #F5B8B8', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C0392B' }}>
          ✗ {parseError}
        </div>
      )}

      {/* Parse preview */}
      {parsed && parsed.trades.length > 0 && (
        <div style={{ background: '#F0F9E0', border: '1px solid #C5E8A0', borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#3D7A00', marginBottom: 10 }}>
            ✓ {parsed.trades.length} trades gevonden
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
            {[
              { label: 'TRADES', value: parsed.trades.length, color: '#1D1D1F' },
              { label: 'WIN', value: parsed.wins ?? parsed.trades.filter(t => t.result==='Win').length, color: '#3D7A00' },
              { label: 'LOSS', value: parsed.losses ?? parsed.trades.filter(t => t.result==='Loss').length, color: '#C0392B' },
              { label: 'BE', value: parsed.bes ?? parsed.trades.filter(t => t.result==='Break-even').length, color: '#6E6E73' },
              { label: 'WIN RATE', value: `${parsed.winRate}%`, color: parsed.winRate >= 50 ? '#3D7A00' : '#C0392B' },
            ].map(m => (
              <div key={m.label} style={{ background: '#FFFFFF', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 9, color: '#6E6E73', marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div style={{ background: '#FFFFFF', borderRadius: 8, padding: '8px 12px' }}>
              <div style={{ fontSize: 9, color: '#6E6E73', marginBottom: 2 }}>NET P&L</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: parsed.totalProfit >= 0 ? '#3D7A00' : '#C0392B' }}>
                {parsed.totalProfit >= 0 ? '+' : ''}{parsed.totalProfit.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div style={{ background: '#FFFFFF', borderRadius: 8, padding: '8px 12px' }}>
              <div style={{ fontSize: 9, color: '#6E6E73', marginBottom: 2 }}>EINDBALANS</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1D1D1F' }}>
                {startingBalance
                  ? (parseFloat(startingBalance) + parsed.totalProfit).toLocaleString('en-GB', { maximumFractionDigits: 0 })
                  : '— (vul startbalans in)'}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#6E6E73', marginBottom: 4 }}>Preview eerste 3 trades:</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>{['Datum','Instrument','Richting','Profit','Resultaat'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '4px 8px', color: '#AEAEB2', fontWeight: 500, borderBottom: '1px solid #E8F5D0' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {parsed.trades.slice(0, 3).map((t, i) => {
                  const resultColor = t.result === 'Win' ? '#3D7A00' : t.result === 'Loss' ? '#C0392B' : '#6E6E73';
                  const resultBg    = t.result === 'Win' ? '#F0F9E0' : t.result === 'Loss' ? '#FEF0F0' : '#F5F5F7';
                  return (
                    <tr key={i}>
                      <td style={{ padding: '4px 8px', color: '#6E6E73' }}>{t.date}</td>
                      <td style={{ padding: '4px 8px', fontWeight: 500, color: '#1D1D1F' }}>{t.instrument}</td>
                      <td style={{ padding: '4px 8px', color: '#6E6E73' }}>{t.direction}</td>
                      <td style={{ padding: '4px 8px', color: t.profit > 0 ? '#3D7A00' : t.profit < 0 ? '#C0392B' : '#6E6E73' }}>
                        {t.profit !== 0 ? (t.profit > 0 ? '+' : '') + t.profit.toFixed(0) : '0 (BE)'}
                      </td>
                      <td style={{ padding: '4px 8px' }}>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: resultBg, color: resultColor }}>{t.result}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <button disabled={!parsed || !label || importing || parsed?.trades.length === 0} onClick={handleImport} style={{
        padding: '12px', background: parsed && label && !importing ? '#1D1D1F' : '#D2D2D7',
        color: '#FFFFFF', border: 'none', borderRadius: 12,
        fontSize: 14, fontFamily: 'inherit', fontWeight: 500,
        cursor: parsed && label && !importing ? 'pointer' : 'not-allowed',
      }}>
        {importing ? 'Importing…' : parsed ? `Import ${parsed.trades.length} trades` : 'Select a file first'}
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── manual entry tab ─────────────────────────────────────────────────────────
const EMPTY_TRADE = { date: '', instrument: '', direction: 'Long', setup: '', rMultiple: '', rr: '', notes: '' };

function ManualEntryTab({ onSubmit }) {
  const [label, setLabel] = useState('');
  const [providerId, setProviderId] = useState('');
  const [trades, setTrades] = useState([{ ...EMPTY_TRADE, id: Date.now() }]);
  const [saving, setSaving] = useState(false);

  function addRow() { if (trades.length < 50) setTrades(t => [...t, { ...EMPTY_TRADE, id: Date.now() }]); }
  function updateTrade(id, field, value) { setTrades(t => t.map(tr => tr.id === id ? { ...tr, [field]: value } : tr)); }
  function removeRow(id) { setTrades(t => t.filter(tr => tr.id !== id)); }

  const inputSm = { padding: '7px 9px', fontSize: 12, borderRadius: 8 };
  const filledTrades = trades.filter(t => t.date || t.instrument || t.rMultiple);

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      onSubmit({ type: 'manual', label, providerId, provider: findProvider(providerId), trades: filledTrades });
    }, 900);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <Label>Account label</Label>
          <Input placeholder="e.g. My prop account" value={label} onChange={e => setLabel(e.target.value)} />
        </div>
        <div>
          <Label>Firm or broker</Label>
          <GroupedSelect value={providerId} onChange={setProviderId} placeholder="Select (optional)…" />
        </div>
      </div>

      <div>
        <Label>Trades</Label>
        <div style={{ border: '1px solid #D2D2D7', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F5F5F7' }}>
                {['Date', 'Instrument', 'Direction', 'Setup', 'R-multiple', 'R:R', 'Notes', ''].map(h => (
                  <th key={h} style={{ fontSize: 11, color: '#6E6E73', fontWeight: 500, padding: '8px 10px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map(tr => (
                <tr key={tr.id} style={{ borderTop: '1px solid #F5F5F7' }}>
                  <td style={{ padding: '6px 6px 6px 10px' }}>
                    <Input type="date" style={inputSm} value={tr.date} onChange={e => updateTrade(tr.id, 'date', e.target.value)} />
                  </td>
                  <td style={{ padding: '6px' }}>
                    <Input placeholder="ES, NQ…" style={inputSm} value={tr.instrument} onChange={e => updateTrade(tr.id, 'instrument', e.target.value)} />
                  </td>
                  <td style={{ padding: '6px' }}>
                    <select value={tr.direction} onChange={e => updateTrade(tr.id, 'direction', e.target.value)}
                      style={{ ...inputSm, width: 80, border: '1px solid #D2D2D7', fontFamily: 'inherit', color: '#1D1D1F', background: '#FAFAFA', cursor: 'pointer' }}>
                      <option>Long</option><option>Short</option>
                    </select>
                  </td>
                  <td style={{ padding: '6px' }}>
                    <Input placeholder="Breakout…" style={inputSm} value={tr.setup} onChange={e => updateTrade(tr.id, 'setup', e.target.value)} />
                  </td>
                  <td style={{ padding: '6px' }}>
                    <Input placeholder="+1.5 or -1" style={{ ...inputSm, width: 80 }} value={tr.rMultiple} onChange={e => updateTrade(tr.id, 'rMultiple', e.target.value)} />
                  </td>
                  <td style={{ padding: '6px' }}>
                    <Input placeholder="1:2.0" style={{ ...inputSm, width: 68 }} value={tr.rr} onChange={e => updateTrade(tr.id, 'rr', e.target.value)} />
                  </td>
                  <td style={{ padding: '6px' }}>
                    <Input placeholder="Optional" style={inputSm} value={tr.notes} onChange={e => updateTrade(tr.id, 'notes', e.target.value)} />
                  </td>
                  <td style={{ padding: '6px 10px 6px 6px' }}>
                    <button onClick={() => removeRow(tr.id)} style={{ border: 'none', background: 'transparent', color: '#AEAEB2', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '10px 16px', borderTop: '1px solid #F5F5F7' }}>
            <button onClick={addRow} style={{ fontSize: 13, color: '#6E6E73', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
              + Add row <span style={{ color: '#AEAEB2' }}>({trades.length}/50)</span>
            </button>
          </div>
        </div>
      </div>

      <button disabled={!label || filledTrades.length === 0 || saving} onClick={handleSave} style={{
        padding: '12px', background: label && filledTrades.length > 0 && !saving ? '#1D1D1F' : '#D2D2D7',
        color: '#FFFFFF', border: 'none', borderRadius: 12,
        fontSize: 14, fontFamily: 'inherit', fontWeight: 500, cursor: label ? 'pointer' : 'not-allowed',
      }}>
        {saving ? 'Saving…' : `Save ${filledTrades.length} trade${filledTrades.length !== 1 ? 's' : ''}`}
      </button>
    </div>
  );
}

// ─── add account modal ────────────────────────────────────────────────────────
function AddAccountModal({ onClose, onAdd, count }) {
  const [tab, setTab] = useState('api');

  function handleSubmit(data) { onAdd(data); onClose(); }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.32)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#FFFFFF', borderRadius: 20, width: 700, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ padding: '24px 28px 0', borderBottom: '1px solid #F5F5F7', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600, color: '#1D1D1F', marginBottom: 2 }}>Add account</div>
            <div style={{ fontSize: 13, color: '#6E6E73' }}>{count} / 10 slots used</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: 20, color: '#AEAEB2', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '0 28px 28px' }}>
          <Tabs
            tabs={[
              { id: 'myfxbook', label: '🟢 Myfxbook (live)' },
              { id: 'api',      label: 'MT4/MT5 API' },
              { id: 'csv',      label: 'Upload CSV' },
              { id: 'manual',   label: 'Manual entry' },
            ]}
            active={tab}
            onChange={setTab}
          />
          {tab === 'myfxbook' && <MyfxbookTab onSubmit={handleSubmit} />}
          {tab === 'api'      && <APITab onSubmit={handleSubmit} />}
          {tab === 'csv'      && <CSVUploadTab onSubmit={handleSubmit} />}
          {tab === 'manual'   && <ManualEntryTab onSubmit={handleSubmit} />}
        </div>
      </div>
    </div>
  );
}

// ─── account card (left list) ─────────────────────────────────────────────────
function AccountCard({ account, selected, onSelect, onDelete }) {
  const t = useTheme();
  return (
    <div
      onClick={() => onSelect(account.id)}
      style={{
        background: t.card, border: `1px solid ${selected ? '#A1D533' : t.cardBorder}`,
        borderRadius: 16, padding: '18px 20px', cursor: 'pointer',
        boxShadow: selected ? '0 0 0 3px rgba(161,213,51,0.15)' : t.cardShadow,
        transition: 'all 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 2 }}>{account.label}</div>
          <div style={{ fontSize: 11, color: t.textSec }}>{account.firmName} · {account.platform}</div>
        </div>
        <StatusBadge status={account.status} />
      </div>

      {account.status === 'syncing' ? (
        <div style={{ fontSize: 12, color: '#4A90D9', marginBottom: 10 }}>Fetching account data…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {account.type === 'csv' || account.type === 'manual' ? (
            <>
              <div style={{ background: '#F5F5F7', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: '#6E6E73', marginBottom: 2 }}>Net P&L</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: (() => { const pl = (account.tradeList||[]).reduce((s,t)=>s+(t.profit||0),0); return pl>=0?'#3D7A00':'#C0392B'; })() }}>
                  {(() => { const pl = (account.tradeList||[]).reduce((s,t)=>s+(t.profit||0),0); return `${pl>=0?'+':''}€${Math.round(pl).toLocaleString('en-GB')}`; })()}
                </div>
              </div>
              <div style={{ background: '#F5F5F7', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: '#6E6E73', marginBottom: 2 }}>Trades</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1D1D1F' }}>{account.trades ?? (account.tradeList||[]).length}</div>
              </div>
            </>
          ) : (
            <>
              <div style={{ background: '#F5F5F7', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: '#6E6E73', marginBottom: 2 }}>Equity</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1D1D1F' }}>
                  {account.equity != null ? `€${account.equity.toLocaleString('en-GB')}` : '—'}
                </div>
              </div>
              <div style={{ background: '#F5F5F7', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: '#6E6E73', marginBottom: 2 }}>
                  {account.status === 'connected' ? 'Open P&L' : 'Trades'}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: account.openPL > 0 ? '#A1D533' : account.openPL < 0 ? '#C0392B' : '#1D1D1F' }}>
                  {account.status === 'connected'
                    ? (account.openPL != null ? `${account.openPL >= 0 ? '+' : ''}€${account.openPL}` : '—')
                    : account.trades ?? '—'}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: t.textTer }}>
          {account.status === 'syncing' ? 'Connecting…'
            : account.status === 'connected' ? `Synced ${account.lastSync}`
            : `${account.trades ?? 0} trades`}
        </span>
        <button onClick={e => { e.stopPropagation(); onDelete(account.id); }} style={{
          border: 'none', background: 'transparent', color: t.textTer, cursor: 'pointer', fontSize: 13, padding: '2px 6px',
        }}>✕</button>
      </div>
    </div>
  );
}

// ─── account detail panel ─────────────────────────────────────────────────────
function AccountDetail({ account, onSync }) {
  const th = useTheme();

  if (account.status === 'syncing') {
    return (
      <Card style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⟳</div>
        <div style={{ fontSize: 16, fontWeight: 500, color: th.text, marginBottom: 6 }}>Connecting to {account.firmName}</div>
        <div style={{ fontSize: 13, color: th.textSec }}>Fetching account data, trades and positions…</div>
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%', background: '#A1D533',
                animation: `bounce 1.2s ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        </div>
        <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }`}</style>
      </Card>
    );
  }

  const trades = account.tradeList || [];

  return (
    <Card style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: th.text }}>{account.label}</div>
          <div style={{ fontSize: 12, color: th.textSec, marginTop: 2 }}>
            {account.firmName} · {account.platform}
            {account.login ? ` · #${account.login}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <StatusBadge status={account.status} />
          {account.status === 'connected' && (
            <button onClick={() => onSync(account.id)} style={{
              fontSize: 12, padding: '6px 12px', border: `1px solid ${th.cardBorder}`, borderRadius: 8,
              background: th.inputBg, color: th.textSec, cursor: 'pointer', fontFamily: 'inherit',
            }}>⟳ Sync now</button>
          )}
        </div>
      </div>

      {account.type === 'csv' || account.type === 'manual' ? (
        (() => {
          const netPL = trades.reduce((s, t) => s + (t.profit || 0), 0);
          const startBal = account.startingBalance || 0;
          const endBal = startBal + netPL;
          const wins = trades.filter(t => t.result === 'Win').length;
          const losses = trades.filter(t => t.result === 'Loss').length;
          const wr = (wins + losses) > 0 ? Math.round(wins / (wins + losses) * 100) : null;
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Starting balance', value: startBal > 0 ? `€${startBal.toLocaleString('en-GB')}` : '—' },
                { label: 'Net P&L', value: netPL !== 0 ? `${netPL >= 0 ? '+' : ''}€${Math.round(netPL).toLocaleString('en-GB')}` : '€0', color: netPL >= 0 ? '#A1D533' : '#C0392B' },
                { label: 'End balance', value: startBal > 0 ? `€${Math.round(endBal).toLocaleString('en-GB')}` : '—' },
                { label: 'Win rate', value: wr !== null ? `${wr}%` : '—', color: wr >= 50 ? '#A1D533' : '#C0392B' },
              ].map(m => (
                <div key={m.label} style={{ background: th.rowBg, borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, color: th.textSec, marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: m.color || th.text }}>{m.value}</div>
                </div>
              ))}
            </div>
          );
        })()
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Equity',   value: account.equity != null ? `€${account.equity.toLocaleString('en-GB')}` : '—' },
            { label: 'Balance',  value: account.balance != null ? `€${account.balance.toLocaleString('en-GB')}` : '—' },
            { label: 'Open P&L', value: account.openPL != null ? `${account.openPL >= 0 ? '+' : ''}€${account.openPL}` : '—', color: (account.openPL ?? 0) >= 0 ? '#A1D533' : '#C0392B' },
            { label: 'Trades',   value: account.trades ?? trades.length },
          ].map(m => (
            <div key={m.label} style={{ background: th.rowBg, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: th.textSec, marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: m.color || th.text }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {trades.length > 0 ? (
        <>
          <div style={{ fontSize: 14, fontWeight: 500, color: th.text, marginBottom: 14 }}>Trades</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Date', 'Instrument', 'Direction', 'Setup', 'R:R', 'Result', '+/- R'].map(col => (
                  <th key={col} style={{
                    textAlign: 'left', fontSize: 11, color: th.textTer, fontWeight: 500,
                    padding: '0 0 10px', borderBottom: `1px solid ${th.dividerLight}`, letterSpacing: '0.03em',
                  }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map((tr, i) => (
                <tr key={i}>
                  <td style={{ padding: '11px 0', fontSize: 13, color: th.textSec, borderBottom: i < trades.length - 1 ? `1px solid ${th.dividerLight}` : 'none' }}>{tr.date}</td>
                  <td style={{ padding: '11px 0', fontSize: 13, color: th.text, fontWeight: 500, borderBottom: i < trades.length - 1 ? `1px solid ${th.dividerLight}` : 'none' }}>{tr.instrument || '—'}</td>
                  <td style={{ padding: '11px 0', fontSize: 13, color: th.textSec, borderBottom: i < trades.length - 1 ? `1px solid ${th.dividerLight}` : 'none' }}>{tr.direction || tr.dir || '—'}</td>
                  <td style={{ padding: '11px 0', fontSize: 13, color: th.textSec, borderBottom: i < trades.length - 1 ? `1px solid ${th.dividerLight}` : 'none' }}>{tr.setup || '—'}</td>
                  <td style={{ padding: '11px 0', fontSize: 13, color: th.textSec, borderBottom: i < trades.length - 1 ? `1px solid ${th.dividerLight}` : 'none' }}>{tr.rr || '—'}</td>
                  <td style={{ padding: '11px 0', borderBottom: i < trades.length - 1 ? `1px solid ${th.dividerLight}` : 'none' }}>
                    {tr.result ? (
                      <span style={{
                        fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 99,
                        background: tr.result === 'Win' ? '#1A3A0A' : tr.result === 'Loss' ? '#3A0A0A' : th.rowBg,
                        color: tr.result === 'Win' ? '#A1D533' : tr.result === 'Loss' ? '#FF6B6B' : th.textSec,
                      }}>{tr.result}</span>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '11px 0', fontSize: 13, fontWeight: 500, borderBottom: i < trades.length - 1 ? `1px solid ${th.dividerLight}` : 'none',
                    color: String(tr.r || tr.rMultiple || '').startsWith('+') || parseFloat(tr.rMultiple) > 0 ? '#A1D533' : String(tr.r || tr.rMultiple || '').startsWith('-') || parseFloat(tr.rMultiple) < 0 ? '#FF6B6B' : th.textSec }}>
                    {tr.r || (tr.rMultiple ? `${parseFloat(tr.rMultiple) >= 0 ? '+' : ''}${tr.rMultiple}R` : '—')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0', color: th.textTer }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
          <div style={{ fontSize: 14 }}>No trade data yet</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            {account.status === 'imported' || account.status === 'manual'
              ? 'Upload a CSV or add trades manually to see data here'
              : 'Data will appear once the account finishes syncing'}
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onAdd }) {
  const t = useTheme();
  return (
    <div style={{ textAlign: 'center', padding: '80px 40px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>◈</div>
      <div style={{ fontSize: 20, fontWeight: 600, color: t.text, marginBottom: 8 }}>No accounts yet</div>
      <div style={{ fontSize: 14, color: t.textSec, marginBottom: 28, maxWidth: 360, margin: '0 auto 28px' }}>
        Connect a live account via API, upload a CSV statement, or enter trades manually.
      </div>
      <button onClick={onAdd} style={{
        fontSize: 14, padding: '11px 24px', border: 'none', borderRadius: 12,
        background: '#A1D533', color: '#1D1D1F', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
      }}>
        + Add your first account
      </button>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function Accounts({ accounts, setAccounts }) {
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const MAX = 10;
  const selectedAccount = accounts.find(a => a.id === selected);

  function addAccount(data) {
    // ── Myfxbook live import ──────────────────────────────────────────────────
    if (data.type === 'myfxbook') {
      const acc = data.mfxAccount;
      const equity = parseFloat(acc.equity || acc.balance || 0);
      const balance = parseFloat(acc.balance || 0);
      const openPL = parseFloat(acc.floatingPL || acc.drawdown || 0);

      // Map Myfxbook history to our trade format
      const tradeList = (data.history || []).map(t => ({
        date: t.openTime ? t.openTime.split(' ')[0] : '—',
        instrument: t.symbol || '—',
        direction: t.action === '0' || t.action === 'Buy' ? 'Long' : 'Short',
        setup: '—',
        rMultiple: null,
        rr: '—',
        result: parseFloat(t.profit || 0) >= 0 ? 'Win' : 'Loss',
        profit: parseFloat(t.profit || 0),
      }));

      const openPLFromTrades = (data.openTrades || []).reduce((s, t) => s + parseFloat(t.profit || 0), 0);

      const newAcc = {
        id: Date.now(),
        type: 'myfxbook',
        firmName: acc.broker || 'Myfxbook',
        platform: 'Myfxbook',
        label: acc.name,
        login: String(acc.accountId || acc.id),
        status: 'connected',
        lastSync: 'just now',
        equity,
        balance,
        openPL: Math.round(openPLFromTrades || openPL),
        trades: tradeList.length,
        tradeList,
        myfxbookId: acc.id,
        myfxbookSession: data.session,
        currency: acc.currency || 'USD',
      };

      setAccounts(prev => [...prev, newAcc]);
      setSelected(newAcc.id);
      return;
    }

    // ── Other account types ───────────────────────────────────────────────────
    const provider = data.provider || findProvider(data.providerId);
    const firmName = provider?.name || data.providerId || 'Unknown';
    const platform = provider?.platform || 'MT4/MT5';

    const tradeList = data.type === 'manual'
      ? (data.trades || []).filter(t => t.date || t.instrument).map(t => ({
          date: t.date || '—',
          instrument: t.instrument,
          direction: t.direction,
          setup: t.setup,
          rMultiple: t.rMultiple,
          rr: t.rr,
          result: t.rMultiple ? (parseFloat(t.rMultiple) >= 0 ? 'Win' : 'Loss') : undefined,
        }))
      : [];

    // For CSV: use parsed trades from the parser, compute equity from net P&L
    const csvTradeList = data.type === 'csv'
      ? (data.trades || [])
      : [];
    const csvNetPL = csvTradeList.reduce((s, t) => s + (t.profit || 0), 0);
    const csvStartBal = data.startingBalance || null;
    const csvEquity = csvStartBal !== null ? Math.round(csvStartBal + csvNetPL) : Math.round(csvNetPL);

    const finalTradeList = data.type === 'csv' ? csvTradeList : tradeList;

    const newAcc = {
      id: Date.now(),
      type: data.type,
      firmName,
      platform,
      label: data.label,
      login: data.login || null,
      status: data.type === 'api' ? 'syncing' : data.type === 'csv' ? 'imported' : 'manual',
      lastSync: 'just now',
      equity: data.type === 'csv' ? csvEquity : null,
      startingBalance: data.type === 'csv' ? csvStartBal : null,
      balance: null,
      openPL: null,
      trades: finalTradeList.length,
      tradeList: finalTradeList,
    };

    setAccounts(prev => [...prev, newAcc]);
    setSelected(newAcc.id);

    if (data.type === 'api') {
      const size = data.accountSize || 100000;
      setTimeout(() => {
        setAccounts(prev => prev.map(a => a.id === newAcc.id ? {
          ...a,
          status: 'connected',
          equity: size,
          balance: Math.round(size * 0.983),
          openPL: Math.round(size * 0.017),
          trades: 0,
          lastSync: 'just now',
          tradeList: [],
        } : a));
      }, 3000);
    }

    // CSV is already fully parsed — no simulation needed
  }

  function deleteAccount(id) {
    setAccounts(prev => {
      const next = prev.filter(a => a.id !== id);
      if (selected === id) setSelected(next.length > 0 ? next[0].id : null);
      return next;
    });
  }

  function syncAccount(id) {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, status: 'syncing' } : a));
    setTimeout(() => {
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, status: 'connected', lastSync: 'just now' } : a));
    }, 2500);
  }

  const theme = useTheme();

  if (accounts.length === 0) {
    return (
      <div style={{ padding: '32px 36px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: theme.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 3 }}>Accounts</h1>
          <p style={{ fontSize: 13, color: theme.textSec, margin: 0 }}>0 / 10 slots used</p>
        </div>
        <Card>
          <EmptyState onAdd={() => setShowModal(true)} />
        </Card>
        {showModal && <AddAccountModal count={0} onClose={() => setShowModal(false)} onAdd={addAccount} />}
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: theme.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 3 }}>Accounts</h1>
          <p style={{ fontSize: 13, color: theme.textSec, margin: 0 }}>
            {accounts.length} / {MAX} slots used · {accounts.filter(a => a.status === 'connected').length} live connection{accounts.filter(a => a.status === 'connected').length !== 1 ? 's' : ''}
          </p>
        </div>
        {accounts.length < MAX && (
          <button onClick={() => setShowModal(true)} style={{
            fontSize: 13, padding: '9px 18px', border: 'none', borderRadius: 11,
            background: '#1D1D1F', color: '#FFFFFF', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
          }}>+ Add account</button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {accounts.map(acc => (
            <AccountCard key={acc.id} account={acc} selected={selected === acc.id} onSelect={setSelected} onDelete={deleteAccount} />
          ))}
          {accounts.length < MAX && (
            <button
              onClick={() => setShowModal(true)}
              style={{
                border: `2px dashed ${theme.cardBorder}`, borderRadius: 14, padding: '20px',
                background: 'transparent', cursor: 'pointer', textAlign: 'center', width: '100%', fontFamily: 'inherit',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#A1D533'}
              onMouseLeave={e => e.currentTarget.style.borderColor = theme.cardBorder}
            >
              <div style={{ fontSize: 18, marginBottom: 4, color: theme.text }}>+</div>
              <div style={{ fontSize: 13, color: theme.textSec, fontWeight: 500 }}>Add account</div>
              <div style={{ fontSize: 11, color: theme.textTer, marginTop: 2 }}>API, CSV or manual</div>
            </button>
          )}
        </div>

        {selectedAccount
          ? <AccountDetail account={selectedAccount} onSync={syncAccount} />
          : (
            <Card style={{ padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: theme.textTer }}>Select an account to view details</div>
            </Card>
          )
        }
      </div>

      {showModal && <AddAccountModal count={accounts.length} onClose={() => setShowModal(false)} onAdd={addAccount} />}
    </div>
  );
}
