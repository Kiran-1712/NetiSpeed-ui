import { Mail } from 'lucide-react';
import netispeedLogo from '../assets/netispeed-logo.svg';
import PlayStoreLink from '../components/PlayStoreLink';
import { APP_PATH, CONTACT_EMAIL, PLAY_STORE_URL, copyrightLine } from '../utils/site';
import { pathFor } from './pages';

const COLUMNS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Home', href: pathFor('home') },
      { label: 'Speed test', href: APP_PATH },
      { label: 'Features', href: pathFor('features') },
      { label: 'Android app', href: PLAY_STORE_URL, external: true },
    ],
  },
  {
    title: 'NetiSpeed',
    links: [
      { label: 'About', href: pathFor('about') },
      { label: 'Contact', href: pathFor('contact') },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy policy', href: pathFor('privacy') },
      { label: 'Terms of service', href: pathFor('terms') },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="s-footer">
      <div className="s-wrap">
        <div className="s-footer-grid">
          <div className="s-footer-brand">
            <a className="s-brand" href="/" aria-label="NetiSpeed home">
              <img src={netispeedLogo} alt="" width={32} height={32} loading="lazy" />
              <span>NetiSpeed</span>
            </a>
            <p>Internet speed test and network diagnostics for the web and Android.</p>
            <a className="s-footer-mail" href={`mailto:${CONTACT_EMAIL}`}>
              <Mail size={15} aria-hidden="true" />
              {CONTACT_EMAIL}
            </a>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} className="s-footer-col" aria-label={col.title}>
              <p className="s-kicker">{col.title}</p>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.external ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer">
                        {l.label}
                        <span className="s-sr"> (opens Google Play)</span>
                      </a>
                    ) : (
                      <a href={l.href}>{l.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="s-footer-bottom">
          <p>{copyrightLine()}</p>
          <PlayStoreLink />
        </div>
      </div>
    </footer>
  );
}
