import { useEffect, useState } from 'react';
import {
  formatIsp,
  formatLocation,
  getIpInfo,
  onConnectionChange,
  parseCoordinates,
  readConnection,
  type ConnectionInfo,
} from '../utils/network';

export const DETECTING = 'Detecting…';
export const UNAVAILABLE = 'Unavailable';
export const NOT_AVAILABLE = 'Not available';

/** Values that are placeholders rather than a real address. */
export const PLACEHOLDERS = new Set([DETECTING, UNAVAILABLE, NOT_AVAILABLE]);

export interface NetworkInfo {
  isp: string;
  ipv4: string;
  ipv6: string;
  location: string;
  coordinates: [number, number] | null;
  /** Cloudflare edge colo the speed test talks to, e.g. "BOM". */
  colo: string | null;
  /** Country code the edge reports for this client. */
  edgeCountry: string | null;
  edgeResolved: boolean;
  /** How this browser's connection to Cloudflare was negotiated, from /cdn-cgi/trace. */
  trace: EdgeTrace | null;
  connection: ConnectionInfo | null;
}

export interface EdgeTrace {
  /** e.g. "http/3", "http/2". */
  http?: string;
  /** e.g. "TLSv1.3". */
  tls?: string;
  /** TLS key exchange group, e.g. "X25519MLKEM768" (post-quantum hybrid). */
  kex?: string;
  /** "encrypted" when Encrypted Client Hello hid the server name. */
  sni?: string;
  warp?: string;
  /** The address the edge saw, which tells IPv4 from IPv6. */
  ip?: string;
}

const parseTrace = (text: string): EdgeTrace => {
  const fields = Object.fromEntries(
    text
      .split('\n')
      .map((line) => line.split('='))
      .filter((pair) => pair.length === 2),
  ) as Record<string, string>;
  return { http: fields.http, tls: fields.tls, kex: fields.kex, sni: fields.sni, warp: fields.warp, ip: fields.ip };
};

export const describeConnection = (connection: ConnectionInfo | null): string | null => {
  if (!connection) return null;
  const parts: string[] = [];
  if (connection.effectiveType) parts.push(connection.effectiveType.toUpperCase());
  if (typeof connection.downlink === 'number' && connection.downlink > 0) {
    parts.push(`~${connection.downlink} Mbps`);
  }
  return parts.length ? parts.join(' · ') : null;
};

export function useNetworkInfo(): NetworkInfo {
  const [info, setInfo] = useState<Omit<NetworkInfo, 'connection'>>({
    isp: DETECTING,
    ipv4: DETECTING,
    ipv6: DETECTING,
    location: DETECTING,
    coordinates: null,
    colo: null,
    edgeCountry: null,
    edgeResolved: false,
    trace: null,
  });
  const [connection, setConnection] = useState<ConnectionInfo | null>(() => readConnection());

  useEffect(() => onConnectionChange(() => setConnection(readConnection())), []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const fetchJson = async <T,>(url: string): Promise<T | null> => {
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`${url} responded with ${res.status}`);
        return (await res.json()) as T;
      } catch (err) {
        if (!controller.signal.aborted) console.error('Network lookup failed:', err);
        return null;
      }
    };

    // ISP, city and coordinates (shared/cached lookup — also used by the history writer).
    getIpInfo()
      .then((data) => {
        if (!active) return;
        setInfo((prev) => ({
          ...prev,
          isp: formatIsp(data.org),
          location: formatLocation(data) || UNAVAILABLE,
          coordinates: parseCoordinates(data.loc),
        }));
      })
      .catch((err) => {
        if (!active) return;
        console.error('Could not fetch network info:', err);
        setInfo((prev) => ({ ...prev, isp: UNAVAILABLE, location: UNAVAILABLE }));
      });

    // Force an IPv4-only resolver.
    fetchJson<{ ip?: string }>('https://api4.ipify.org?format=json').then((data) => {
      if (!active) return;
      setInfo((prev) => ({ ...prev, ipv4: data?.ip || UNAVAILABLE }));
    });

    // IPv6 is expected to fail on IPv4-only networks.
    fetchJson<{ ip?: string }>('https://api6.ipify.org?format=json').then((data) => {
      if (!active) return;
      setInfo((prev) => ({ ...prev, ipv6: data?.ip || NOT_AVAILABLE }));
    });

    // Which Cloudflare edge colo the speed test will actually talk to.
    fetch('https://cloudflare.com/cdn-cgi/trace', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`trace responded with ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (!active) return;
        setInfo((prev) => ({
          ...prev,
          colo: /colo=([A-Z]+)/.exec(text)?.[1] ?? null,
          edgeCountry: /loc=([A-Z]+)/.exec(text)?.[1] ?? null,
          edgeResolved: true,
          trace: parseTrace(text),
        }));
      })
      .catch(() => {
        if (active) setInfo((prev) => ({ ...prev, edgeResolved: true }));
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  return { ...info, connection };
}
