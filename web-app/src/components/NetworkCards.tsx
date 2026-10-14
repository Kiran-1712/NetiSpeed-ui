import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, MapPin, Maximize2, Minimize2, Server, Wifi } from 'lucide-react';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PLACEHOLDERS, UNAVAILABLE, describeConnection, type NetworkInfo } from '../hooks/useNetworkInfo';

const dotIcon = L.divIcon({
  className: 'map-marker',
  html: '<span class="map-marker-dot"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// CARTO's basemaps now answer keyless requests with an "API key required"
// tile, so this uses standard OSM tiles and darkens them in CSS instead.
const MAP_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

interface CardProps {
  net: NetworkInfo;
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copyable = !PLACEHOLDERS.has(value);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch (err) {
      // Clipboard access needs a secure context and can be denied by policy.
      console.error('Could not copy to clipboard', err);
    }
  }, [value]);

  return (
    <div className="kv-row">
      <span className="micro">{label}</span>
      <span className={`kv-value mono${copyable ? '' : ' faint'}`} title={value}>
        {value}
      </span>
      <button
        type="button"
        className="ghost-btn"
        onClick={() => void copy()}
        disabled={!copyable}
        aria-label={copied ? `${label} copied` : `Copy ${label}`}
        title={copied ? 'Copied' : `Copy ${label}`}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  );
}

/** Provider details, with a map of the approximate location beside them. */
export function NetworkCard({ net, mapVisible }: CardProps & { mapVisible: boolean }) {
  const link = describeConnection(net.connection);
  const ispPending = PLACEHOLDERS.has(net.isp);

  return (
    <section className="card area-net net-card" data-sub="network" aria-label="Your network">
      <div className="net-info">
        <div className="card-head">
          <span className="micro">Provider</span>
          <span className={`chip${net.isp === UNAVAILABLE ? ' off' : ''}`}>
            <span className="chip-dot" />
            {net.isp === UNAVAILABLE ? 'Offline' : 'Connected'}
          </span>
        </div>
        <p className={`card-title${ispPending ? ' faint' : ''}`} title={net.isp}>
          {net.isp}
        </p>
        <div className="kv">
          <CopyRow label="IPv4" value={net.ipv4} />
          <CopyRow label="IPv6" value={net.ipv6} />
          {/* Browsers cannot read radio signal strength; this is the Network
              Information API's estimate and is hidden where unsupported. */}
          {link && (
            <div className="kv-row">
              <span className="micro">Link</span>
              <span className="kv-value">
                <Wifi size={12} /> {link}
              </span>
            </div>
          )}
        </div>
      </div>

      <LocationMap net={net} visible={mapVisible} />
    </section>
  );
}

export function ServerCard({ net, ping, jitter }: CardProps & { ping: number; jitter: number }) {
  return (
    <section className="card card-accent area-srv" data-sub="network" aria-label="Test server">
      <div className="card-head">
        <span className="micro">Test server</span>
        <span className="icon-disc">
          <Server size={14} />
        </span>
      </div>
      <p className="colo">{net.colo ?? (net.edgeResolved ? 'CF' : '···')}</p>
      <div className="srv-foot">
        <span>Cloudflare edge{net.edgeCountry ? ` · ${net.edgeCountry}` : ''}</span>
        <span className="srv-latency">
          {ping > 0 ? `${ping} ms${jitter > 0 ? ` ±${jitter}` : ''}` : 'Awaiting test'}
        </span>
      </div>
    </section>
  );
}

function LocationMap({ net, visible }: CardProps & { visible: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const coordinates = net.coordinates;

  // Leaflet measures its container once; nudge it whenever the box it lives in
  // appears, disappears or changes size.
  useEffect(() => {
    const timer = setTimeout(() => window.dispatchEvent(new Event('resize')), 60);
    return () => clearTimeout(timer);
  }, [expanded, visible]);

  // The fullscreen map is a fixed overlay with no other way out on keyboard.
  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [expanded]);

  return (
    <div className="net-map" role="group" aria-label="Your location">
      {coordinates ? (
        <MapContainer
          center={coordinates}
          zoom={10}
          className="map"
          zoomControl={false}
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
        >
          <TileLayer url={MAP_TILES} attribution={MAP_ATTRIBUTION} />
          <Marker position={coordinates} icon={dotIcon} />
        </MapContainer>
      ) : (
        <div className="map map-empty">
          <MapPin size={22} />
        </div>
      )}

      <div className="map-label">
        <span className="micro">Location</span>
        <span className={`map-place${PLACEHOLDERS.has(net.location) ? ' faint' : ''}`}>{net.location}</span>
      </div>

      {coordinates && (
        <button
          type="button"
          className="ghost-btn map-expand"
          onClick={() => setExpanded(true)}
          aria-label="Expand map"
          title="Expand map"
        >
          <Maximize2 size={14} />
        </button>
      )}

      {expanded && coordinates && (
        <div className="map-overlay" role="dialog" aria-modal="true" aria-label="Map">
          <button type="button" className="pill-btn map-close" onClick={() => setExpanded(false)} autoFocus>
            <Minimize2 size={14} /> Close map
          </button>
          <MapContainer center={coordinates} zoom={13} className="map">
            <TileLayer url={MAP_TILES} attribution={MAP_ATTRIBUTION} />
            <Marker position={coordinates} icon={dotIcon} />
          </MapContainer>
        </div>
      )}
    </div>
  );
}
