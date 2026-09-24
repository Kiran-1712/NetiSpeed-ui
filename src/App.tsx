import { useEffect, useState } from 'react';
import TopBar from './components/TopBar';
import Footer from './components/Footer';
import TabBar, { type Tab } from './components/TabBar';
import DashboardPage, { type DashboardSub } from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import ToolsPage from './pages/ToolsPage';
import InfoPage from './pages/InfoPage';
import { useSpeedTest } from './hooks/useSpeedTest';
import { useNetworkInfo } from './hooks/useNetworkInfo';
import { useHistory } from './hooks/useHistory';
import { useServiceLatency } from './hooks/useServiceLatency';
import { hrefFor, useRoute } from './hooks/useRoute';

type ThemeType = 'dark' | 'light';

const THEME_KEY = 'theme';
const DARK_CLASS = 'dark';

const applyTheme = (theme: ThemeType) => {
  document.body.classList.toggle(DARK_CLASS, theme === 'dark');
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
  const [theme, setTheme] = useState<ThemeType>(initialTheme);
  const route = useRoute();
  // On a phone the dashboard is split across three tabs; wider screens show it all.
  const [dashboardSub, setDashboardSub] = useState<DashboardSub>('test');

  // These live at the root so leaving the dashboard never interrupts a running
  // test or repeats the lookups.
  const test = useSpeedTest();
  const net = useNetworkInfo();
  const history = useHistory();
  // Paused while a speed test runs so the two measurements don't skew each other.
  const latency = useServiceLatency(test.isRunning);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Preference simply won't persist across reloads.
    }
  }, [theme]);

  // About and Privacy have no tab of their own.
  const activeTab: Tab | null =
    route === 'dashboard' ? dashboardSub : route === 'history' || route === 'tools' ? route : null;

  const selectTab = (tab: Tab) => {
    if (tab === 'test' || tab === 'network' || tab === 'insights') {
      setDashboardSub(tab);
      window.location.hash = hrefFor('dashboard');
    } else {
      window.location.hash = hrefFor(tab);
    }
  };

  const runFromHistory = () => {
    setDashboardSub('test');
    window.location.hash = hrefFor('dashboard');
    test.start();
  };

  return (
    <div className="app">
      <TopBar
        route={route}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        testRunning={test.isRunning}
      />

      <main className="main">
        {route === 'dashboard' && <DashboardPage test={test} net={net} history={history} latency={latency} sub={dashboardSub} />}
        {route === 'history' && (
          <HistoryPage history={history} onRunTest={runFromHistory} isRunning={test.isRunning} />
        )}
        {route === 'tools' && <ToolsPage net={net} />}
        {(route === 'about' || route === 'privacy') && <InfoPage page={route} />}
      </main>

      <Footer route={route} />

      <TabBar active={activeTab} onSelect={selectTab} />
    </div>
  );
}

export default App;
