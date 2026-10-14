/** Who the site belongs to, shown in the copyright line and the legal pages. */
export const SITE_OWNER = 'NetiSpeed';

/** The website's production origin, used for canonical URLs, Open Graph tags and the sitemap. */
export const SITE_URL = 'https://netispeed.in';

/** The speed test app's production origin. It is a separate site (web-app/). */
export const APP_URL = 'https://app.netispeed.in';

/**
 * Where links from one app to the other point. Each app runs on its own dev
 * server (website :5173, web-app :5174), so in dev they point there instead.
 */
export const WEBSITE_ORIGIN = import.meta.env.DEV ? 'http://localhost:5173' : SITE_URL;
export const APP_ORIGIN = import.meta.env.DEV ? 'http://localhost:5174' : APP_URL;

/** The speed test, for "Run a speed test" links. */
export const APP_HREF = `${APP_ORIGIN}/`;

/** Where support, privacy and legal questions go. */
export const CONTACT_EMAIL = 'support@netispeed.in';

/** The Android app's Play Store listing, from its applicationId (com.netispeed). */
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.netispeed';

/**
 * Where each website page lives. The website builds its pages from these, and
 * the speed test app links to them (from WEBSITE_ORIGIN), so the two can't
 * drift apart.
 */
export const WEBSITE_PATHS = {
  home: '/',
  features: '/features',
  about: '/about',
  contact: '/contact',
  privacy: '/privacy-policy',
  terms: '/terms',
  notFound: '/404',
} as const;

export type WebsitePageId = keyof typeof WEBSITE_PATHS;

/** Bump when the privacy policy text changes. */
export const POLICY_UPDATED = '14 October 2026';

/** Bump when the terms of service text change. */
export const TERMS_UPDATED = '13 October 2026';

declare const __BUILD_YEAR__: number;

// Fixed at build time rather than read from the clock, so the prerendered
// HTML and the hydrated page always agree.
export const copyrightLine = () => `© ${__BUILD_YEAR__} ${SITE_OWNER}. All rights reserved.`;
