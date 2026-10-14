import { Menu } from 'lucide-react';
import netispeedLogo from '@shared/netispeed-logo.svg';
import { pathFor, type SitePageId } from './pages';
import { StartTestButton } from './ui';

const LINKS: { id: SitePageId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'features', label: 'Features' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
];

export default function SiteHeader({ current }: { current: SitePageId }) {
  const links = LINKS.map(({ id, label }) => (
    <a key={id} href={pathFor(id)} aria-current={current === id ? 'page' : undefined}>
      {label}
    </a>
  ));

  return (
    <header className="s-header">
      <div className="s-wrap s-header-row">
        <a className="s-brand" href="/" aria-label="NetiSpeed home">
          <img src={netispeedLogo} alt="" width={30} height={30} />
          <span>NetiSpeed</span>
        </a>

        <nav className="s-nav" aria-label="Main">
          {links}
        </nav>

        <div className="s-header-actions">
          <StartTestButton
            small
            label={
              <>
                <span className="s-cta-long">Start speed test</span>
                <span className="s-cta-short">Speed test</span>
              </>
            }
          />

          {/* A plain <details> so the menu works before the page has hydrated. */}
          <details className="s-menu">
            <summary aria-label="Menu">
              <Menu size={18} aria-hidden="true" />
            </summary>
            <nav className="s-menu-panel" aria-label="Main">
              {links}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
