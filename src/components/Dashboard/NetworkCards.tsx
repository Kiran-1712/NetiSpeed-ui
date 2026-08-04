import { Globe, Shield, MapPin, Database, Activity, Copy, Maximize2, Minimize2, Check } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  formatIsp,
  formatLocation,
  getIpInfo,
  onConnectionChange,
  parseCoordinates,
  readConnection,
  type ConnectionInfo,
} from '../../utils/network';

const dotIcon = L.divIcon({
  className: 'custom-map-marker',
  html: '<div style="width: 12px; height: 12px; background: #ff4b4b; border-radius: 50%; box-shadow: 0 0 10px #ff4b4b, 0 0 20px #ff4b4b; border: 2px solid #fff;"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const DETECTING = 'Detecting...';
const UNAVAILABLE = 'Unavailable';
const NOT_AVAILABLE = 'Not Available';

interface NetworkCardsProps {
  /** Unloaded latency in ms from the most recent speed test; 0 before one runs. */
  latency?: number;
  /** Jitter in ms from the most recent speed test; 0 before one runs. */
  jitter?: number;
}

const describeConnection = (connection: ConnectionInfo | null): string | null => {
  if (!connection) return null;
  const parts: string[] = [];
  if (connection.effectiveType) parts.push(connection.effectiveType.toUpperCase());
  if (typeof connection.downlink === 'number' && connection.downlink > 0) {
    parts.push(`~${connection.downlink} Mbps`);
  }
  return parts.length ? parts.join(' · ') : null;
};

export default function NetworkCards({ latency = 0, jitter = 0 }: NetworkCardsProps) {
  const [networkInfo, setNetworkInfo] = useState<{
    isp: string;
    ipv4: string;
    ipv6: string;
    location: string;
    coordinates: [number, number] | null;
  }>({
    isp: DETECTING,
    ipv4: DETECTING,
    ipv6: DETECTING,
    location: DETECTING,
    coordinates: null,
  });
  const [serverLocation, setServerLocation] = useState(DETECTING);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedType, setCopiedType] = useState<'v4' | 'v6' | null>(null);
  const [isLightTheme, setIsLightTheme] = useState(() => document.body.classList.contains('light-theme'));
  const [connection, setConnection] = useState<ConnectionInfo | null>(() => readConnection());

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLightTheme(document.body.classList.contains('light-theme'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    // The theme class is applied by an effect in App, which may land after this
    // component mounts — resync once on mount.
    setIsLightTheme(document.body.classList.contains('light-theme'));
    return () => observer.disconnect();
  }, []);

  useEffect(() => onConnectionChange(() => setConnection(readConnection())), []);

  const copyableIps = useMemo(
    () => new Set([DETECTING, UNAVAILABLE, NOT_AVAILABLE]),
    [],
  );

  const handleCopyIp = useCallback(
    async (ip: string, type: 'v4' | 'v6') => {
      if (!ip || copyableIps.has(ip)) return;
      try {
        await navigator.clipboard.writeText(ip);
        setCopiedType(type);
      } catch (err) {
        // Clipboard access needs a secure context and can be denied by policy.
        console.error('Could not copy to clipboard', err);
      }
    },
    [copyableIps],
  );

  useEffect(() => {
    if (!copiedType) return;
    const timer = setTimeout(() => setCopiedType(null), 2000);
    return () => clearTimeout(timer);
  }, [copiedType]);

  // When expanding/collapsing, tell Leaflet to resize its internal canvas
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 50);
    return () => clearTimeout(timer);
  }, [isExpanded]);

  // The fullscreen map is a fixed overlay with no other way out on keyboard.
  useEffect(() => {
    if (!isExpanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExpanded(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isExpanded]);

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
        setNetworkInfo((prev) => ({
          ...prev,
          isp: formatIsp(data.org),
          location: formatLocation(data) || UNAVAILABLE,
          coordinates: parseCoordinates(data.loc),
        }));
      })
      .catch((err) => {
        if (!active) return;
        console.error('Could not fetch network info:', err);
        setNetworkInfo((prev) => ({ ...prev, isp: UNAVAILABLE, location: UNAVAILABLE }));
      });

    // Force an IPv4-only resolver.
    fetchJson<{ ip?: string }>('https://api4.ipify.org?format=json').then((data) => {
      if (!active) return;
      setNetworkInfo((prev) => ({ ...prev, ipv4: data?.ip || UNAVAILABLE }));
    });

    // IPv6 is expected to fail on IPv4-only networks.
    fetchJson<{ ip?: string }>('https://api6.ipify.org?format=json').then((data) => {
      if (!active) return;
      setNetworkInfo((prev) => ({ ...prev, ipv6: data?.ip || NOT_AVAILABLE }));
    });

    // Which Cloudflare edge colo the speed test will actually talk to.
    fetch('https://cloudflare.com/cdn-cgi/trace', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`trace responded with ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (!active) return;
        const colo = /colo=([A-Z]+)/.exec(text)?.[1];
        setServerLocation(colo ? `Cloudflare Edge (${colo})` : 'Cloudflare Edge');
      })
      .catch(() => {
        if (active) setServerLocation('Cloudflare Edge');
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const mapUrl = isLightTheme
    ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const mapAttribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

  const ipv6Available = networkInfo.ipv6 !== NOT_AVAILABLE && networkInfo.ipv6 !== DETECTING;
  const connectionLabel = describeConnection(connection);
  const coordinates = networkInfo.coordinates;

  return (
    <div>
      <div className="terminal-header">
        <Globe size={14} color="var(--text-secondary)" /> TERMINAL_NODES
      </div>

      <div className="terminal-card">
        <div className="terminal-node-label">
          <Globe size={12} color="var(--accent-color)" /> SERVICE PROVIDER
        </div>
        <div className="terminal-node-value">
          {networkInfo.isp}
        </div>
        <div className="terminal-status">
          <div className={`status-dot ${networkInfo.isp !== UNAVAILABLE ? 'active' : ''}`}></div>
          {networkInfo.isp !== UNAVAILABLE ? 'ACTIVE_STREAM' : 'LOOKUP_FAILED'}
        </div>
      </div>

      {/* IPv4 Card */}
      <div className="terminal-card">
        <button
          onClick={() => void handleCopyIp(networkInfo.ipv4, 'v4')}
          disabled={copyableIps.has(networkInfo.ipv4)}
          style={{
            position: 'absolute',
            right: '16px',
            top: '24px',
            background: copiedType === 'v4' ? '#00e676' : 'var(--text-primary)',
            border: 'none',
            color: 'var(--card-bg)',
            borderRadius: '4px',
            padding: '6px',
            cursor: copyableIps.has(networkInfo.ipv4) ? 'default' : 'pointer',
            opacity: copyableIps.has(networkInfo.ipv4) ? 0.5 : 1,
            display: 'flex',
            transition: 'all 0.2s'
          }}
          title={copiedType === 'v4' ? 'Copied!' : 'Copy IPv4'}
          aria-label="Copy IPv4 address"
        >
          {copiedType === 'v4' ? <Check size={16} /> : <Copy size={16} />}
        </button>
        <div className="terminal-node-label">
          <Shield size={12} color="#00e676" /> IPV4 ADDRESS
        </div>
        <div className="terminal-node-value">
          {networkInfo.ipv4}
        </div>
        <div className="terminal-status">
          <div className={`status-dot ${networkInfo.ipv4 !== UNAVAILABLE ? 'active' : ''}`}></div>
          {networkInfo.ipv4 !== UNAVAILABLE ? 'ACTIVE_STREAM' : 'INACTIVE'}
        </div>
      </div>

      {/* IPv6 Card */}
      <div className="terminal-card">
        <button
          onClick={() => void handleCopyIp(networkInfo.ipv6, 'v6')}
          style={{
            position: 'absolute',
            right: '16px',
            top: '24px',
            background: copiedType === 'v6' ? '#00e676' : 'var(--text-primary)',
            border: 'none',
            color: 'var(--card-bg)',
            borderRadius: '4px',
            padding: '6px',
            cursor: ipv6Available ? 'pointer' : 'default',
            display: 'flex',
            transition: 'all 0.2s',
            opacity: ipv6Available ? 1 : 0.5
          }}
          disabled={!ipv6Available}
          title={copiedType === 'v6' ? 'Copied!' : 'Copy IPv6'}
          aria-label="Copy IPv6 address"
        >
          {copiedType === 'v6' ? <Check size={16} /> : <Copy size={16} />}
        </button>
        <div className="terminal-node-label">
          <Shield size={12} color="#a371f7" /> IPV6 ADDRESS
        </div>
        <div className="terminal-node-value" style={{ fontSize: '12px', wordBreak: 'break-all' }}>
          {networkInfo.ipv6}
        </div>
        <div className="terminal-status">
          <div className={`status-dot ${ipv6Available ? 'active' : ''}`}></div>
          {ipv6Available ? 'ACTIVE_STREAM' : 'INACTIVE'}
        </div>
      </div>

      <div className="terminal-card" style={{ paddingBottom: '32px' }}>
        {/* Browsers cannot read radio signal strength, so this reports the
            Network Information API's estimate and is hidden where unsupported. */}
        {connectionLabel && (
          <div
            style={{ position: 'absolute', right: '16px', top: '16px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '10px', fontWeight: 'bold' }}
            title="Connection type estimated by the browser"
          >
            <Activity size={10} /> {connectionLabel}
          </div>
        )}
        <div className="terminal-node-label">
          <MapPin size={12} color="#ff4b4b" /> CURRENT LOCATION
        </div>
        <div className="terminal-node-value" style={{ marginBottom: '12px' }}>
          {networkInfo.location}
        </div>

        {coordinates && (
          <div style={{ height: '160px', width: '100%', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--panel-border)', position: 'relative', zIndex: 1 }}>
            <button
              onClick={() => setIsExpanded(true)}
              title="Expand Map to Fullscreen"
              aria-label="Expand map to fullscreen"
              style={{
                position: 'absolute', right: '8px', top: '8px', zIndex: 1000,
                background: 'var(--card-bg)', border: '1px solid var(--panel-border)',
                color: 'var(--text-primary)', borderRadius: '4px', padding: '6px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(4px)',
                opacity: 0.8
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
            >
              <Maximize2 size={16} />
            </button>
            <MapContainer center={coordinates} zoom={10} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false}>
              <TileLayer url={mapUrl} attribution={mapAttribution} />
              <Marker position={coordinates} icon={dotIcon} />
            </MapContainer>
          </div>
        )}
      </div>

      <div className="terminal-card">
        {/* Real unloaded latency to the test server, measured by the last run. */}
        <div style={{ position: 'absolute', right: '16px', bottom: '16px', display: 'flex', alignItems: 'center', gap: '4px', color: '#a371f7', fontSize: '10px', fontWeight: 'bold' }}>
          {latency > 0 ? `${latency}ms${jitter > 0 ? ` ±${jitter}` : ''}` : '-- ms'}
        </div>
        <div className="terminal-node-label">
          <Database size={12} color="#a371f7" /> TESTING SERVER
        </div>
        <div className="terminal-node-value">
          {serverLocation}
        </div>
        <div className="terminal-status">
          <div className={`status-dot ${latency > 0 ? 'active' : ''}`}></div>
          {latency > 0 ? 'ACTIVE_STREAM' : 'AWAITING_TEST'}
        </div>
      </div>

      {isExpanded && coordinates && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'var(--bg-color)', backdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px' }}>
            <button onClick={() => setIsExpanded(false)} style={{
              background: 'var(--panel-bg)', border: '1px solid var(--panel-border)',
              color: 'var(--text-primary)', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '12px',
              transition: 'all 0.2s'
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--card-hover-bg)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--panel-bg)')}
            >
              <Minimize2 size={14} /> COLLAPSE MAP
            </button>
          </div>
          <div style={{ flex: 1, padding: '0 16px 16px 16px', display: 'flex' }}>
            <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--accent-color)', boxShadow: 'var(--glass-shadow)' }}>
              <MapContainer center={coordinates} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={true} dragging={true}>
                <TileLayer url={mapUrl} attribution={mapAttribution} />
                <Marker position={coordinates} icon={dotIcon} />
              </MapContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
