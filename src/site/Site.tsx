import { useEffect, type ComponentType } from 'react';
import { trackPageView } from '../utils/analytics';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import type { SitePage, SitePageId } from './pages';
import Home from './pages/Home';
import Features from './pages/Features';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';
import './site.css';

const VIEWS: Record<SitePageId, ComponentType> = {
  home: Home,
  features: Features,
  about: About,
  contact: Contact,
  privacy: Privacy,
  terms: Terms,
  notFound: NotFound,
};

/**
 * The public website. Each page is prerendered to its own HTML file at build
 * time and hydrated here, so moving between pages is an ordinary page load.
 */
export default function Site({ page }: { page: SitePage }) {
  const View = VIEWS[page.id];

  useEffect(() => {
    document.title = page.title;
    trackPageView(window.location.pathname, page.title);
  }, [page]);

  return (
    <div className="site">
      <a className="s-skip" href="#content">
        Skip to content
      </a>
      <SiteHeader current={page.id} />
      <main id="content" className="s-main">
        <View />
      </main>
      <SiteFooter />
    </div>
  );
}
