import { Gauge, History, Info, Moon, Sun, Wrench, type LucideIcon } from 'lucide-react';
import { hrefFor, type Route } from '../hooks/useRoute';
import netispeedLogo from '@shared/netispeed-logo.svg';
import { WEBSITE_ORIGIN, WEBSITE_PATHS } from '@shared/site';

const LINKS: { id: Route; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Gauge },
  { id: 'history', label: 'History', icon: History },
  { id: 'tools', label: 'Tools', icon: Wrench },
];

interface TopBarProps {
  route: Route;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  /** A speed test is running; flagged on the Dashboard link when you're elsewhere. */
  testRunning: boolean;
}

export default function TopBar({ route, theme, onToggleTheme, testRunning }: TopBarProps) {
  const themeLabel = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <header className="topbar">
      <a className="brand" href={WEBSITE_ORIGIN + WEBSITE_PATHS.home} aria-label="NetiSpeed home">
        <img src={netispeedLogo} alt="" className="brand-logo" />
        <span className="brand-name">NetiSpeed</span>
      </a>

      <nav className="nav" aria-label="Pages">
        {LINKS.map(({ id, label, icon: Icon }) => (
          <a
            key={id}
            href={hrefFor(id)}
            className={route === id ? 'active' : undefined}
            aria-current={route === id ? 'page' : undefined}
          >
            <Icon size={15} />
            {label}
            {id === 'dashboard' && testRunning && route !== 'dashboard' && (
              <span className="nav-live" aria-label="test running" />
            )}
          </a>
        ))}
      </nav>

      <div className="topbar-actions">
        {/* Phones have no footer, so the website's About page is reached from here. */}
        <a className="icon-btn info-btn" href={WEBSITE_ORIGIN + WEBSITE_PATHS.about} aria-label="About NetiSpeed" title="About NetiSpeed">
          <Info size={16} />
        </a>
        <button type="button" className="icon-btn" onClick={onToggleTheme} aria-label={themeLabel} title={themeLabel}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
