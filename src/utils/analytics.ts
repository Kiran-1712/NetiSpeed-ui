declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * GA drops the URL fragment, so every hash route would report as "/". Send the
 * route as a real path instead, e.g. #/tools -> /tools.
 */
export const trackPageView = (path: string, title: string) => {
  window.gtag?.('event', 'page_view', {
    page_title: title,
    page_location: window.location.origin + path,
  });
};
