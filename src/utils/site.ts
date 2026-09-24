/** Who the site belongs to, shown in the copyright line and the legal pages. */
export const SITE_OWNER = 'NetiSpeed';

/** Where privacy questions go. The policy's contact section is hidden while this is empty. */
export const CONTACT_EMAIL = '';

/** The Android app's Play Store listing, from its applicationId (com.netispeed). */
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.netispeed';

/** Bump when the privacy policy text changes. */
export const POLICY_UPDATED = '25 September 2026';

export const copyrightLine = () => `© ${new Date().getFullYear()} ${SITE_OWNER}. All rights reserved.`;
