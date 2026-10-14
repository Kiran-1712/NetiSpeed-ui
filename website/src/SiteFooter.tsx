import type { CSSProperties } from 'react';
import { ArrowUp } from 'lucide-react';
import netispeedLogo from '@shared/netispeed-logo.svg';
import PlayStoreLink from '@shared/PlayStoreLink';
import { CONTACT_EMAIL, copyrightLine } from '@shared/site';
import { pathFor, type SitePageId } from './pages';

// What a test measures, in the order a test runs. Colours are the dashboard's
// dark-zone series colours, as on the home page's spec sheet.
const MEASURES: { text: string; color: string }[] = [
  { text: 'Download speed', color: 'var(--dl-b)' },
  { text: 'Upload speed', color: 'var(--ul-b)' },
  { text: 'Latency', color: 'var(--ping-b)' },
  { text: 'Jitter', color: 'var(--coral)' },
  { text: 'Bufferbloat', color: 'var(--warn)' },
  { text: 'Packet loss', color: 'var(--bad)' },
];

const LEGAL: { id: SitePageId; label: string }[] = [
  { id: 'privacy', label: 'Privacy policy' },
  { id: 'terms', label: 'Terms of service' },
];

/**
 * A sign-off rather than a second menu (the header already links every page).
 * The six things a test measures are set large, and a highlight runs through
 * them in turn, the way a test steps through its phases.
 */
export default function SiteFooter({ current }: { current: SitePageId }) {
  return (
    <footer className="s-footer">
      <div className="s-wrap">
        <div className="s-fmeasures">
          <p className="s-label">What every test measures</p>
          <ul className="s-fwords">
            {MEASURES.map((m, i) => (
              <li key={m.text} style={{ '--c': m.color, '--i': i } as CSSProperties}>
                {m.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="s-fmeta">
          <a className="s-brand" href="/" aria-label="NetiSpeed home">
            <img src={netispeedLogo} alt="" width={30} height={30} loading="lazy" />
            <span>NetiSpeed</span>
          </a>
          <p className="s-fmeta-about">Internet speed test and network diagnostics for the web and Android.</p>
          <a className="s-footer-mail" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          <PlayStoreLink />
        </div>

        <div className="s-footer-bottom">
          <p>{copyrightLine()}</p>
          <nav className="s-footer-legal" aria-label="Legal">
            {LEGAL.map((l) => (
              <a key={l.id} href={pathFor(l.id)} aria-current={l.id === current ? 'page' : undefined}>
                {l.label}
              </a>
            ))}
          </nav>
          <a className="s-footer-up" href="#top">
            Back to top
            <ArrowUp size={15} aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
