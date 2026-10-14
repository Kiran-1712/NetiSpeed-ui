declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Which app sent the page view. Both share one GA property, and GA's Page path
 * drops the hostname, so both home pages would otherwise report as "/". Sent as
 * GA4's built-in content_group, so reports can split by it without any setup.
 */
export type AnalyticsSection = 'Website' | 'Speed test';

/**
 * GA drops the URL fragment, so every hash route would report as "/". Send the
 * route as a real path instead, e.g. #/tools -> /tools.
 */
export const trackPageView = (section: AnalyticsSection, path: string, title: string) => {
  window.gtag?.('event', 'page_view', {
    page_title: title,
    page_location: window.location.origin + path,
    content_group: section,
  });
};
