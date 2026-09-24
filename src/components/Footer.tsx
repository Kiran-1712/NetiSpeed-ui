import { hrefFor, type Route } from '../hooks/useRoute';
import { copyrightLine } from '../utils/site';
import PlayStoreLink from './PlayStoreLink';

/** Wide screens only; on phones the About page is reached from the top bar. */
export default function Footer({ route }: { route: Route }) {
  return (
    <footer className="footer">
      <span className="footer-copy">{copyrightLine()}</span>
      <nav className="footer-links" aria-label="App, about and legal">
        <PlayStoreLink variant="inline" />
        <a href={hrefFor('about')} aria-current={route === 'about' ? 'page' : undefined}>
          About
        </a>
        <a href={hrefFor('privacy')} aria-current={route === 'privacy' ? 'page' : undefined}>
          Privacy policy
        </a>
      </nav>
    </footer>
  );
}
