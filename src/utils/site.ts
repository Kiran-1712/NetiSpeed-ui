/** Who the site belongs to, shown in the copyright line and the legal pages. */
export const SITE_OWNER = 'NetiSpeed';

/** Production origin, used for canonical URLs, Open Graph tags and the sitemap. */
export const SITE_URL = 'https://netispeed.in';

/** Where support, privacy and legal questions go. */
export const CONTACT_EMAIL = 'support@netispeed.in';

/** The Android app's Play Store listing, from its applicationId (com.netispeed). */
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.netispeed';

/** The speed test dashboard. Everything else under the origin is the website. */
export const APP_PATH = '/speed-test';

/** Bump when the privacy policy text changes. */
export const POLICY_UPDATED = '13 October 2026';

/** Bump when the terms of service text change. */
export const TERMS_UPDATED = '13 October 2026';

declare const __BUILD_YEAR__: number;

// Fixed at build time rather than read from the clock, so the prerendered
// HTML and the hydrated page always agree.
export const copyrightLine = () => `© ${__BUILD_YEAR__} ${SITE_OWNER}. All rights reserved.`;
