/* eslint-disable react-refresh/only-export-components -- build-time entry, never hot-reloaded */
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import Site from './Site';
import { pageForPath } from './pages';

/** Used only by scripts/prerender.mjs at build time. */
export const render = (path: string) =>
  renderToString(
    <StrictMode>
      <Site page={pageForPath(path)} />
    </StrictMode>,
  );

export { SITE_PAGES, APP_PAGE } from './pages';
export { SITE_URL, CONTACT_EMAIL, PLAY_STORE_URL, SITE_OWNER } from '../utils/site';
