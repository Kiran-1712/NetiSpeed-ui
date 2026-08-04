import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import Dashboard from './components/Dashboard';
import HistoryView from './components/HistoryView';
import Diagnostics from './components/Diagnostics';

import netispeedLogo from './assets/netispeed-logo.svg';

type TabType = 'dashboard' | 'history' | 'diagnostics';
type ThemeType = 'dark' | 'light';

const THEME_KEY = 'theme';
const LIGHT_CLASS = 'light-theme';

const TABS: { id: TabType; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'history', label: 'History' },
  { id: 'diagnostics', label: 'Tools' },
];

const applyTheme = (theme: ThemeType) => {
  document.body.classList.toggle(LIGHT_CLASS, theme === 'light');
};

const readStoredTheme = (): ThemeType => {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(THEME_KEY);
  } catch {
    // Storage can be unavailable (private mode, blocked cookies).
  }
  if (stored === 'dark' || stored === 'light') return stored;
  // No stored preference: follow the OS setting.
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const initialTheme = readStoredTheme();
// Applied before the first paint so the wrong palette never flashes.
applyTheme(initialTheme);

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [theme, setTheme] = useState<ThemeType>(initialTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Preference simply won't persist across reloads.
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="app-container">
      <header className="app-header glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0 }}>
        <div className="logo-container">
          <div>
            <img src={netispeedLogo} alt="NetiSpeed" className="logo-icon-img" />
            <div className="logo-glow"></div>
          </div>
        </div>

        <nav className="nav-links">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={toggleTheme}
            className="btn"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            style={{
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              padding: 0,
              background: 'var(--panel-bg)',
              borderColor: 'var(--panel-border)',
              color: 'var(--text-primary)'
            }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      <main className="main-content">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'history' && <HistoryView />}
        {activeTab === 'diagnostics' && <Diagnostics />}
      </main>
    </div>
  );
}

export default App;
