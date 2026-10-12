import { pathFor } from '../site/pages';
import { copyrightLine } from '../utils/site';
import PlayStoreLink from './PlayStoreLink';

const LINKS = [
  { label: 'Home', href: pathFor('home') },
  { label: 'About', href: pathFor('about') },
  { label: 'Contact', href: pathFor('contact') },
  { label: 'Privacy policy', href: pathFor('privacy') },
  { label: 'Terms', href: pathFor('terms') },
];

/** Wide screens only; on phones the website is reached from the top bar. */
export default function Footer() {
  return (
    <footer className="footer">
      <span className="footer-copy">{copyrightLine()}</span>
      <nav className="footer-links" aria-label="Website and legal">
        <PlayStoreLink variant="inline" />
        {LINKS.map(({ label, href }) => (
          <a key={label} href={href}>
            {label}
          </a>
        ))}
      </nav>
    </footer>
  );
}
