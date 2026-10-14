import { useEffect, useState } from 'react';
import { trackPageView } from '@shared/analytics';

export type Route = 'dashboard' | 'history' | 'tools';

const TITLES: Record<Route, string> = {
  dashboard: 'Speed Test — NetiSpeed',
  history: 'History — NetiSpeed',
  tools: 'Tools — NetiSpeed',
};

const ROUTES = Object.keys(TITLES) as Route[];

// Hash routes need no server rewrites on static hosting and keep the back
// button working between pages.
const parse = (): Route => {
  const path = window.location.hash.replace(/^#\/?/, '').split(/[?/]/)[0];
  return (ROUTES as string[]).includes(path) ? (path as Route) : 'dashboard';
};

export const hrefFor = (route: Route) => (route === 'dashboard' ? '#/' : `#/${route}`);

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parse);

  useEffect(() => {
    const onChange = () => setRoute(parse());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  useEffect(() => {
    document.title = TITLES[route];
    // GA drops the fragment, so #/tools is reported as /tools.
    trackPageView('Speed test', route === 'dashboard' ? '/' : `/${route}`, TITLES[route]);
  }, [route]);

  return route;
}
