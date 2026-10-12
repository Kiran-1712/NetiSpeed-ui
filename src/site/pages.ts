import { APP_PATH } from '../utils/site';

export type SitePageId = 'home' | 'features' | 'about' | 'contact' | 'privacy' | 'terms' | 'notFound';

export interface SitePage {
  id: SitePageId;
  path: string;
  title: string;
  description: string;
  /** Listed in sitemap.xml. */
  indexed: boolean;
}

/**
 * Every public page and its head tags. The prerender step writes one HTML file
 * per entry from this list, and the sitemap is generated from it too.
 */
export const SITE_PAGES: SitePage[] = [
  {
    id: 'home',
    path: '/',
    title: 'NetiSpeed — Internet Speed Test & Network Diagnostics',
    description:
      'Measure download and upload speed, latency, jitter and latency under load, see how fast popular services respond, and diagnose your connection. Free, in your browser and on Android.',
    indexed: true,
  },
  {
    id: 'features',
    path: '/features',
    title: 'Features — NetiSpeed',
    description:
      'Everything NetiSpeed measures today on the web and on Android: speed, latency, jitter, bufferbloat, service latency, connection details, history and network tools.',
    indexed: true,
  },
  {
    id: 'about',
    path: '/about',
    title: 'About NetiSpeed',
    description:
      'NetiSpeed makes internet performance easy to understand and troubleshoot. What it is, who it is for and where the product stands today.',
    indexed: true,
  },
  {
    id: 'contact',
    path: '/contact',
    title: 'Contact — NetiSpeed',
    description: 'Get in touch with NetiSpeed for support, bug reports, privacy requests and partnership enquiries.',
    indexed: true,
  },
  {
    id: 'privacy',
    path: '/privacy-policy',
    title: 'Privacy Policy — NetiSpeed',
    description:
      'What NetiSpeed processes on the web and in the Android app, which services your device contacts, what stays on your device, and your choices.',
    indexed: true,
  },
  {
    id: 'terms',
    path: '/terms',
    title: 'Terms of Service — NetiSpeed',
    description: 'The terms for using the NetiSpeed website, speed test, network tools and Android app.',
    indexed: true,
  },
  {
    id: 'notFound',
    path: '/404',
    title: 'Page not found — NetiSpeed',
    description: 'This page does not exist on NetiSpeed.',
    indexed: false,
  },
];

/** Head tags for the speed test dashboard, which is client-rendered. */
export const APP_PAGE = {
  path: APP_PATH,
  title: 'Speed Test — NetiSpeed',
  description:
    'Run a free internet speed test: download, upload, latency, jitter and bufferbloat against Cloudflare’s network, with live latency and service response times.',
};

const normalise = (path: string) => path.replace(/\/+$/, '') || '/';

export const pageForPath = (path: string): SitePage =>
  SITE_PAGES.find((p) => p.path === normalise(path)) ?? SITE_PAGES[SITE_PAGES.length - 1];

export const pathFor = (id: SitePageId) => SITE_PAGES.find((p) => p.id === id)!.path;
