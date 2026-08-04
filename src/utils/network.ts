export interface IpInfo {
  ip?: string;
  org?: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string;
  timezone?: string;
  bogon?: boolean;
}

export const IPINFO_BASE = 'https://ipinfo.io';

let pending: Promise<IpInfo> | null = null;

/**
 * Looks up the current client's IP metadata. The result is cached for the
 * lifetime of the page so the dashboard and the history writer share a single
 * request (ipinfo.io rate-limits unauthenticated callers).
 */
export const getIpInfo = (): Promise<IpInfo> => {
  if (!pending) {
    pending = fetch(`${IPINFO_BASE}/json`)
      .then((res) => {
        if (!res.ok) throw new Error(`ipinfo.io responded with ${res.status}`);
        return res.json() as Promise<IpInfo>;
      })
      .catch((err) => {
        pending = null; // let the next caller retry instead of caching the failure
        throw err;
      });
  }
  return pending;
};

/** Strips the leading `AS####` from an ipinfo `org` field. */
export const formatIsp = (org?: string) =>
  org ? org.replace(/^AS\d+\s+/, '').trim() || 'Unknown ISP' : 'Unknown ISP';

export const formatLocation = (info: IpInfo) =>
  [info.city, info.region, info.country].filter(Boolean).join(', ');

/** Parses ipinfo's `"lat,lon"` string. Returns null when it is missing or malformed. */
export const parseCoordinates = (loc?: string): [number, number] | null => {
  if (!loc) return null;
  const parts = loc.split(',');
  if (parts.length !== 2) return null;
  const lat = Number.parseFloat(parts[0]);
  const lon = Number.parseFloat(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return [lat, lon];
};

interface NetworkInformation extends EventTarget {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  type?: string;
}

export interface ConnectionInfo {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  type?: string;
}

const getConnectionApi = (): NetworkInformation | undefined =>
  (navigator as Navigator & { connection?: NetworkInformation }).connection;

/**
 * Reads the Network Information API. Returns null where it is unsupported
 * (Safari, Firefox) so callers can hide the indicator rather than invent one.
 * Browsers cannot read radio signal strength, so there is no dBm value to show.
 */
export const readConnection = (): ConnectionInfo | null => {
  const connection = getConnectionApi();
  if (!connection) return null;
  const { effectiveType, downlink, rtt, type } = connection;
  if (!effectiveType && !downlink && !type) return null;
  return { effectiveType, downlink, rtt, type };
};

/** Subscribes to connection changes. Returns an unsubscribe function. */
export const onConnectionChange = (listener: () => void): (() => void) => {
  const connection = getConnectionApi();
  if (!connection) return () => {};
  connection.addEventListener('change', listener);
  return () => connection.removeEventListener('change', listener);
};

/**
 * Normalises free-form user input into a bare hostname plus an optional port,
 * dropping any scheme, path, credentials or query string.
 */
export const parseHostTarget = (raw: string): { host: string; port?: number } | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (!url.hostname) return null;

    // `URL.port` is empty when the port matches the scheme's default (:80 for
    // http, :443 for https), which would silently discard a port the user asked
    // for explicitly. Read it back off the authority instead.
    const authority = withScheme.slice(withScheme.indexOf('://') + 3).split(/[/?#]/)[0];
    // Drop a bracketed IPv6 literal first so its inner colons can't be mistaken
    // for a port separator.
    const portMatch = /:(\d+)$/.exec(authority.replace(/^\[[^\]]*\]/, ''));

    let port: number | undefined;
    if (portMatch) {
      port = Number.parseInt(portMatch[1], 10);
      if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
    }

    // `hostname` keeps the brackets around an IPv6 literal, which is what callers
    // need in order to build a valid `https://[::1]:8080` URL from it.
    return { host: url.hostname, port };
  } catch {
    return null;
  }
};
