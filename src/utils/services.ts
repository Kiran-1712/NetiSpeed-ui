import {
  siCloudflare,
  siDiscord,
  siDropbox,
  siEpicgames,
  siFacebook,
  siGithub,
  siGoogle,
  siInstagram,
  siNetflix,
  siPlaystation,
  siReddit,
  siSpotify,
  siSteam,
  siTelegram,
  siTwitch,
  siValorant,
  siWhatsapp,
  siX,
  siYoutube,
  siZoom,
  type SimpleIcon,
} from 'simple-icons';

export type ServiceCategory = 'Streaming' | 'Calls & chat' | 'Gaming' | 'Social' | 'Cloud';

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  /** Probe URL, or null for AWS, whose region is chosen at runtime. */
  url: string | null;
  /** Logo from Simple Icons (CC0). AWS has none: Amazon asked for it to be removed. */
  icon: SimpleIcon | null;
  /** Brand colour as #rrggbb. */
  color: string;
}

const brand = (icon: SimpleIcon) => ({ icon, color: `#${icon.hex}` });

/**
 * Each URL is a small static file on the service's own CDN edge, picked by
 * measuring warm round trips in Chrome. Main-site favicons often come from an
 * application origin that adds 200–300 ms of server time (web.whatsapp.com
 * does), which would read as "latency" when it isn't. Hosts that send
 * Cross-Origin-Resource-Policy (store.epicgames.com) can't be used at all:
 * the browser rejects even an opaque request to them.
 */
export const SERVICES: Service[] = [
  { id: 'netflix', name: 'Netflix', category: 'Streaming', url: 'https://assets.nflxext.com/ffe/siteui/common/icons/nficon2016.png', ...brand(siNetflix) },
  { id: 'youtube', name: 'YouTube', category: 'Streaming', url: 'https://www.youtube.com/favicon.ico', ...brand(siYoutube) },
  { id: 'spotify', name: 'Spotify', category: 'Streaming', url: 'https://www.scdn.co/i/_global/favicon.ico', ...brand(siSpotify) },
  { id: 'twitch', name: 'Twitch', category: 'Streaming', url: 'https://www.twitch.tv/favicon.ico', ...brand(siTwitch) },

  { id: 'zoom', name: 'Zoom', category: 'Calls & chat', url: 'https://st1.zoom.us/zoom.ico', ...brand(siZoom) },
  { id: 'discord', name: 'Discord', category: 'Calls & chat', url: 'https://cdn.discordapp.com/embed/avatars/0.png', ...brand(siDiscord) },
  { id: 'whatsapp', name: 'WhatsApp', category: 'Calls & chat', url: 'https://mmg.whatsapp.net/', ...brand(siWhatsapp) },
  { id: 'telegram', name: 'Telegram', category: 'Calls & chat', url: 'https://telegram.org/favicon.ico', ...brand(siTelegram) },

  { id: 'steam', name: 'Steam', category: 'Gaming', url: 'https://store.steampowered.com/favicon.ico', ...brand(siSteam) },
  { id: 'playstation', name: 'PlayStation', category: 'Gaming', url: 'https://www.playstation.com/favicon.ico', ...brand(siPlaystation) },
  { id: 'epic', name: 'Epic Games', category: 'Gaming', url: 'https://static-assets-prod.epicgames.com/epic-store/static/favicon.ico', ...brand(siEpicgames) },
  { id: 'valorant', name: 'Valorant', category: 'Gaming', url: 'https://playvalorant.com/favicon.ico', ...brand(siValorant) },

  { id: 'instagram', name: 'Instagram', category: 'Social', url: 'https://static.cdninstagram.com/favicon.ico', ...brand(siInstagram) },
  { id: 'facebook', name: 'Facebook', category: 'Social', url: 'https://www.facebook.com/images/fb_icon_325x325.png', ...brand(siFacebook) },
  { id: 'x', name: 'X', category: 'Social', url: 'https://abs.twimg.com/favicons/twitter.3.ico', ...brand(siX) },
  { id: 'reddit', name: 'Reddit', category: 'Social', url: 'https://www.reddit.com/favicon.ico', ...brand(siReddit) },

  { id: 'aws', name: 'AWS', category: 'Cloud', url: null, icon: null, color: '#232F3E' },
  { id: 'google', name: 'Google', category: 'Cloud', url: 'https://www.google.com/favicon.ico', ...brand(siGoogle) },
  { id: 'cloudflare', name: 'Cloudflare', category: 'Cloud', url: 'https://cloudflare.com/cdn-cgi/trace', ...brand(siCloudflare) },
  { id: 'github', name: 'GitHub', category: 'Cloud', url: 'https://github.githubassets.com/favicons/favicon.png', ...brand(siGithub) },
  { id: 'dropbox', name: 'Dropbox', category: 'Cloud', url: 'https://cfl.dropboxstatic.com/static/metaserver/static/images/favicon.ico', ...brand(siDropbox) },
];

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** White or near-black, whichever reads better on the brand colour. */
export const inkOn = (hex: string) => {
  const l = luminance(hex);
  const onWhite = 1.05 / (l + 0.05);
  const onBlack = (l + 0.05) / 0.05;
  return onWhite >= onBlack ? '#FFFFFF' : '#111111';
};
