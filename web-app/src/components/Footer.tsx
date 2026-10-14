import { WEBSITE_ORIGIN, WEBSITE_PATHS, copyrightLine } from '@shared/site';
import PlayStoreLink from '@shared/PlayStoreLink';

const LINKS = [
  { label: 'Home', href: WEBSITE_ORIGIN + WEBSITE_PATHS.home },
  { label: 'About', href: WEBSITE_ORIGIN + WEBSITE_PATHS.about },
  { label: 'Contact', href: WEBSITE_ORIGIN + WEBSITE_PATHS.contact },
  { label: 'Privacy policy', href: WEBSITE_ORIGIN + WEBSITE_PATHS.privacy },
  { label: 'Terms', href: WEBSITE_ORIGIN + WEBSITE_PATHS.terms },
];

/** Wide screens only; on phones the website is reached from the top bar. Links go to the website's own origin. */
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
