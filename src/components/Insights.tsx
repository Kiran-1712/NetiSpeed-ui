import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useSize } from '../hooks/useSize';
import type { LoadProfile } from '../hooks/useSpeedTest';
import type { NetworkInfo } from '../hooks/useNetworkInfo';
import { WINDOW, type LiveLatency, type LiveSample } from '../hooks/useLiveLatency';
import type { TestResult } from '../utils/history';
import { formatShortDate, niceCeil } from '../utils/format';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import type { ServiceLatency, ServiceResult } from '../hooks/useServiceLatency';
import { SERVICES, inkOn, type Service } from '../utils/services';

/* ---------- Live connection ---------- */

type Grade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

// Bufferbloat grades by how much latency rises under load, on the scale
// Waveform's widely used bufferbloat test publishes.
const gradeFor = (increase: number): Grade =>
  increase < 5 ? 'A+' : increase < 30 ? 'A' : increase < 60 ? 'B' : increase < 200 ? 'C' : increase < 400 ? 'D' : 'F';

const gradeStatus = (g: Grade) => (g === 'A+' || g === 'A' ? 'good' : g === 'B' || g === 'C' ? 'fair' : 'poor');

const LIVE_PAD = { top: 6, right: 4, bottom: 6, left: 30 };

/** Rolling minute of pings; newest on the right, lost requests as red ticks. */
function LiveChart({ samples }: { samples: LiveSample[] }) {
  const [boxRef, { width, height }] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const replies = samples.map((s) => s.ms).filter((ms): ms is number => ms !== null);
  const maxY = niceCeil(Math.max(...replies, 20));
  const plotW = Math.max(width - LIVE_PAD.left - LIVE_PAD.right, 1);
  const plotH = Math.max(height - LIVE_PAD.top - LIVE_PAD.bottom, 1);
  // Fixed slots for the whole window, so the line scrolls in from the right.
  const offset = WINDOW - samples.length;
  const x = (i: number) => LIVE_PAD.left + ((i + offset) / (WINDOW - 1)) * plotW;
  const y = (v: number) => LIVE_PAD.top + plotH - (Math.min(v, maxY) / maxY) * plotH;

  // Break the line at lost samples rather than bridging the gap.
  let d = '';
  samples.forEach((s, i) => {
    if (s.ms === null) return;
    const prevLost = i === 0 || samples[i - 1].ms === null;
    d += `${prevLost ? 'M' : 'L'}${x(i).toFixed(1)},${y(s.ms).toFixed(1)} `;
  });

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const slot = Math.round(((e.clientX - rect.left - LIVE_PAD.left) / plotW) * (WINDOW - 1)) - offset;
    setHover(slot >= 0 && slot < samples.length ? slot : null);
  };

  const hovered = hover !== null ? samples[hover] : null;
  const hx = hover !== null ? x(hover) : 0;

  return (
    <div className="live-chart" ref={boxRef}>
      {width > 0 && height > 0 && (
        <svg
          width={width}
          height={height}
          onPointerMove={samples.length ? onMove : undefined}
          onPointerLeave={() => setHover(null)}
          role="img"
          aria-label="Latency to Cloudflare over the last minute"
        >
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line x1={LIVE_PAD.left} x2={width - LIVE_PAD.right} y1={y(maxY * f)} y2={y(maxY * f)} className="grid" />
              <text x={LIVE_PAD.left - 8} y={y(maxY * f)} className="axis" textAnchor="end" dominantBaseline="middle">
                {Math.round(maxY * f)}
              </text>
            </g>
          ))}
          {samples.map((s, i) =>
            s.ms === null ? (
              <line key={i} x1={x(i)} x2={x(i)} y1={LIVE_PAD.top + plotH - 8} y2={LIVE_PAD.top + plotH} className="lost" />
            ) : null,
          )}
          {hover !== null && (
            <line x1={hx} x2={hx} y1={LIVE_PAD.top} y2={LIVE_PAD.top + plotH} className="crosshair" />
          )}
          <path d={d} className="series" style={{ stroke: 'var(--ping-b)' }} />
          {hovered?.ms != null && (
            <circle cx={hx} cy={y(hovered.ms)} r={4} className="marker" style={{ fill: 'var(--ping-b)' }} />
          )}
          <rect x={LIVE_PAD.left} y={0} width={plotW} height={height} fill="transparent" />
        </svg>
      )}
      {hovered && hover !== null && (
        <div className={`tooltip compact${hx > width / 2 ? ' left' : ''}`} style={{ left: hx }} role="status">
          <span className="tooltip-date">{samples.length - 1 - hover}s ago</span>
          <span className="tooltip-row">
            <span className="swatch" style={{ background: 'var(--ping-b)' }} /> Latency
            <b>{hovered.ms === null ? 'Lost' : `${hovered.ms} ms`}</b>
          </span>
        </div>
      )}
    </div>
  );
}

const protocolLabel = (http?: string) =>
  !http ? null : http === 'http/3' ? 'HTTP/3 (QUIC)' : http === 'http/2' ? 'HTTP/2' : http.toUpperCase();

const tlsLabel = (tls?: string) => (tls ? tls.replace(/^TLSv/, 'TLS ') : null);

// Hybrid groups pair a classical curve with ML-KEM, the NIST post-quantum KEM.
const isPostQuantum = (kex?: string) => !!kex && /MLKEM|KYBER/i.test(kex);

interface DetailRow {
  label: string;
  value: string | null;
  /** Adds a status dot (with the value as its label). */
  status?: 'good' | 'fair';
  title?: string;
}

interface LiveConnectionCardProps {
  net: NetworkInfo;
  live: LiveLatency;
  paused: boolean;
  /** Loaded latency from the current run, when one has finished. */
  load: LoadProfile | null;
  history: TestResult[];
}

export function LiveConnectionCard({ net, live, paused, load, history }: LiveConnectionCardProps) {
  const { trace, connection } = net;

  // Bufferbloat from this run if it finished, else from the newest saved result.
  const last = history[0];
  const bloat =
    load && load.idle !== null && (load.downloading || load.uploading)
      ? { idle: load.idle, down: load.downloading, up: load.uploading, source: 'This test' }
      : last && (last.loadedDown || last.loadedUp)
        ? { idle: last.ping, down: last.loadedDown ?? null, up: last.loadedUp ?? null, source: formatShortDate(last.id, last.date) }
        : null;
  const increase = bloat ? Math.max(bloat.down ?? 0, bloat.up ?? 0) - bloat.idle : 0;
  const grade = bloat ? gradeFor(Math.max(0, increase)) : null;

  const pq = isPostQuantum(trace?.kex);
  const rows: DetailRow[] = [
    { label: 'Protocol', value: protocolLabel(trace?.http) },
    { label: 'Encryption', value: tlsLabel(trace?.tls) },
    {
      label: 'Key exchange',
      value: trace?.kex ? (pq ? 'Post-quantum' : 'Classical') : null,
      status: trace?.kex ? (pq ? 'good' : 'fair') : undefined,
      title: trace?.kex,
    },
    {
      label: 'Server name',
      value: trace?.sni ? (trace.sni === 'encrypted' ? 'Hidden (ECH)' : 'Visible') : null,
      title: 'Whether Encrypted Client Hello hid which site you connected to',
    },
    { label: 'IP version', value: trace?.ip ? (trace.ip.includes(':') ? 'IPv6' : 'IPv4') : null },
    { label: 'WARP', value: trace?.warp ? (trace.warp === 'off' ? 'Off' : 'On') : null },
  ];
  if (connection?.effectiveType) {
    rows.push({
      label: 'Link estimate',
      value: [connection.effectiveType.toUpperCase(), connection.rtt ? `${connection.rtt} ms` : null]
        .filter(Boolean)
        .join(' · '),
      title: 'The browser’s own rough estimate of the link, from the Network Information API',
    });
  }
  if (typeof connection?.saveData === 'boolean') {
    rows.push({ label: 'Data saver', value: connection.saveData ? 'On' : 'Off' });
  }

  const pending = !net.edgeResolved;
  const fmt = (v: number | null, digits = 0) => (v === null ? '—' : v.toFixed(digits));

  return (
    <section className="card area-load" data-sub="insights" aria-label="Live connection">
      <div className="card-head">
        <span className="micro">Live connection</span>
        <span className={`source-tag${paused ? '' : ' live'}`}>
          {paused ? 'Paused during test' : `Pinging ${net.colo ?? 'Cloudflare'} every second`}
        </span>
      </div>

      <div className="live-body">
        <div className="live-left">
          <div className="live-top">
            <span className="live-now">
              <span className={`live-pulse${paused || live.current === null ? ' off' : ''}`} />
              <span className="num">{fmt(live.current)}</span>
              <span className="unit">ms</span>
            </span>
            <span className="live-stats">
              <span>
                <span className="micro">Avg</span> {fmt(live.average)} ms
              </span>
              <span>
                <span className="micro">Jitter</span> {fmt(live.jitter, 1)} ms
              </span>
              <span>
                <span className="micro">Loss</span> {live.loss === null ? '—' : `${Math.round(live.loss * 100)}%`}
              </span>
            </span>
          </div>

          <LiveChart samples={live.samples} />

          <div className="bloat">
            <span className={`grade small ${grade ? gradeStatus(grade) : 'pending'}`}>{grade ?? '—'}</span>
            {bloat && grade ? (
              <span className="bloat-text">
                <span className="use-name">Bufferbloat {grade} · +{Math.round(Math.max(0, increase))} ms under load</span>
                <span className="use-need">
                  Idle {Math.round(bloat.idle)} · Downloading {bloat.down ? Math.round(bloat.down) : '—'} · Uploading{' '}
                  {bloat.up ? Math.round(bloat.up) : '—'} ms · {bloat.source}
                </span>
              </span>
            ) : (
              <span className="bloat-text">
                <span className="use-name">Bufferbloat</span>
                <span className="use-need">Run a speed test to grade how latency holds up under load.</span>
              </span>
            )}
          </div>
        </div>

        <div className="live-right">
          <span className="micro">Connection details</span>
          <ul className="details">
            {rows.map(({ label, value, status, title }) => (
              <li key={label} className="detail-row" title={title}>
                <span className="detail-label">{label}</span>
                <span className={`detail-value${value ? '' : ' faint'}`}>
                  {status && <span className={`status-dot ${status}`} />}
                  {value ?? (pending ? '···' : '—')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------- Service latency ---------- */

/** Auto-scroll speed in px/s: sideways strip on desktop, grid on phones. */
const SPEED_X = 30;
const SPEED_Y = 20;
/** How long auto-scroll waits after the viewer scrolls or pages themselves. */
const RESUME_AFTER_MS = 3000;

/**
 * One seamless loop unit. The phone grid has two columns, so an odd count
 * would put the first clone mid-row and the wrap would visibly jump; doubling
 * the list keeps every copy starting in the first column.
 */
const LOOP = SERVICES.length % 2 === 0 ? SERVICES : [...SERVICES, ...SERVICES];

/** Scale of the latency bars; anything slower pins at full. */
const LATENCY_SCALE_MS = 250;

const rate = (ms: number) => (ms < 60 ? 'good' : ms < 150 ? 'fair' : 'poor');
const RATE_LABEL = { good: 'Fast', fair: 'OK', poor: 'Slow' } as const;

interface ServiceTileProps {
  service: Service;
  result: ServiceResult;
  awsRegion: string;
  /** A loop clone: kept out of the accessibility tree. */
  hidden?: boolean;
}

function ServiceTile({ service, result, awsRegion, hidden = false }: ServiceTileProps) {
  const { name, category, icon, color } = service;
  const measured = result.ms !== null;
  const grade = measured ? rate(result.ms as number) : null;
  const style = { '--svc-bg': color, '--svc-ink': inkOn(color) } as CSSProperties;

  return (
    <li className="svc" style={style} aria-hidden={hidden || undefined}>
      {icon ? (
        <svg className="svc-logo" viewBox="0 0 24 24" aria-hidden="true">
          <path d={icon.path} />
        </svg>
      ) : (
        <span className="svc-logo svc-wordmark" aria-hidden="true">
          {name.toLowerCase()}
        </span>
      )}

      <div className="svc-top">
        <span className="svc-name">{name}</span>
        <span className="svc-cat">{service.id === 'aws' ? awsRegion : category}</span>
      </div>

      <div className="svc-bottom">
        <span className="svc-ms">
          {measured ? result.ms : result.status === 'blocked' ? '—' : '···'}
          {measured && <span className="svc-unit">ms</span>}
        </span>
        <span className="svc-status">
          {grade ? (
            <>
              <span className={`status-dot ${grade}`} /> {RATE_LABEL[grade]}
            </>
          ) : result.status === 'blocked' ? (
            'Unreachable'
          ) : result.status === 'probing' ? (
            'Measuring'
          ) : (
            'Waiting'
          )}
        </span>
      </div>

      <span className="svc-bar" aria-hidden="true">
        <span style={{ width: measured ? `${Math.min((result.ms as number) / LATENCY_SCALE_MS, 1) * 100}%` : 0 }} />
      </span>
    </li>
  );
}

export function LatencyCard({ latency, paused }: { latency: ServiceLatency; paused: boolean }) {
  const { results, awsRegion, probing, refresh } = latency;
  const scrollerRef = useRef<HTMLUListElement | null>(null);

  const measured = SERVICES.filter((s) => results[s.id]?.ms !== null);
  const fastest = measured.reduce<Service | null>(
    (best, s) => (!best || (results[s.id].ms as number) < (results[best.id].ms as number) ? s : best),
    null,
  );

  // Hold off auto-scrolling until this time (ms, performance.now clock) after
  // the viewer scrolls or pages themselves.
  const holdUntilRef = useRef(0);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let frame = 0;
    let last = 0;
    let pos = 0;
    // What this loop last wrote, to notice when something else moved the list.
    let written = 0;
    let hovering = false;
    let focused = false;
    let pressing = false;
    const hold = (ms: number) => {
      holdUntilRef.current = performance.now() + ms;
    };

    // Horizontal strip on wide screens, vertical grid on phones.
    const axis = () =>
      el.scrollWidth > el.clientWidth + 1 ? 'x' : el.scrollHeight > el.clientHeight + 1 ? 'y' : null;

    // Distance from the first tile to its first clone: scrolling that far
    // lands on an identical view, so wrapping there is seamless.
    const loopLength = (a: 'x' | 'y') => {
      const first = el.children[0] as HTMLElement | undefined;
      const clone = el.children[LOOP.length] as HTMLElement | undefined;
      if (!first || !clone) return 0;
      return a === 'x' ? clone.offsetLeft - first.offsetLeft : clone.offsetTop - first.offsetTop;
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = last ? Math.min(now - last, 64) : 0;
      last = now;

      const a = axis();
      if (!a) return;
      const current = a === 'x' ? el.scrollLeft : el.scrollTop;
      if (reduceMotion.matches || hovering || focused || pressing || now < holdUntilRef.current) {
        pos = current; // pick up wherever the viewer left it
        written = current;
        return;
      }
      // Scrolled by something else (keyboard, a scrollbar): continue from there.
      // Browsers round scroll offsets to whole pixels, hence the tolerance.
      if (Math.abs(current - Math.floor(written)) > 2) pos = current;
      const loop = loopLength(a);
      if (loop <= 0) return;
      pos = (((pos + ((a === 'x' ? SPEED_X : SPEED_Y) * dt) / 1000) % loop) + loop) % loop;
      if (a === 'x') el.scrollLeft = pos;
      else el.scrollTop = pos;
      written = pos;
    };
    frame = requestAnimationFrame(tick);

    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') hovering = true;
    };
    const onLeave = () => {
      hovering = false;
    };
    const onDown = () => {
      pressing = true;
    };
    // Listened for on window so a drag that ends outside the list still
    // counts, but only a press that started on the list pauses it.
    const onUp = () => {
      if (!pressing) return;
      pressing = false;
      hold(RESUME_AFTER_MS);
    };
    // Only keyboard focus pauses; a tap or click also focuses the list and
    // would otherwise stop it for good.
    const onFocus = () => {
      focused = el.matches(':focus-visible') || el.querySelector(':focus-visible') !== null;
    };
    const onBlur = () => {
      focused = false;
    };

    // A mouse wheel only scrolls vertically; turn that into sideways travel
    // while the row is a horizontal strip.
    const onWheel = (e: WheelEvent) => {
      hold(RESUME_AFTER_MS);
      if (axis() !== 'x' || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    el.addEventListener('focusin', onFocus);
    el.addEventListener('focusout', onBlur);
    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      el.removeEventListener('focusin', onFocus);
      el.removeEventListener('focusout', onBlur);
      el.removeEventListener('wheel', onWheel);
    };
  }, []);

  const page = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    holdUntilRef.current = performance.now() + RESUME_AFTER_MS;
    const vertical = el.scrollWidth <= el.clientWidth + 1;
    el.scrollBy(
      vertical
        ? { top: direction * el.clientHeight * 0.8, behavior: 'smooth' }
        : { left: direction * el.clientWidth * 0.8, behavior: 'smooth' },
    );
  };

  const summary = paused
    ? 'Paused during test'
    : probing
      ? `Measuring ${measured.length}/${SERVICES.length}…`
      : fastest
        ? `${SERVICES.length} services · fastest ${fastest.name} ${results[fastest.id].ms} ms`
        : `${SERVICES.length} services`;

  return (
    <section className="card area-lat" data-sub="insights" aria-label="Service latency">
      <div className="card-head">
        <span className="micro">Service latency</span>
        <span className="source-tag" title="HTTPS round trip from this browser, median of 3 warm requests">
          {summary}
        </span>
        <span className="lat-nav">
          <button type="button" className="ghost-btn" onClick={() => page(-1)} aria-label="Scroll back">
            <ChevronLeft size={14} />
          </button>
          <button type="button" className="ghost-btn" onClick={() => page(1)} aria-label="Scroll forward">
            <ChevronRight size={14} />
          </button>
        </span>
        <button
          type="button"
          className="ghost-btn"
          onClick={refresh}
          disabled={probing || paused}
          aria-label="Measure again"
          title="Measure again"
        >
          <RefreshCw size={13} className={probing ? 'spin' : undefined} />
        </button>
      </div>

      <ul
        ref={scrollerRef}
        className="svc-scroller"
        aria-label="Latency by service"
        tabIndex={0}
      >
        {/* Two copies of the loop, so the view can wrap without a visible jump.
            Only the first set of services is exposed to assistive tech. */}
        {[...LOOP, ...LOOP].map((service, i) => (
          <ServiceTile
            key={`${service.id}-${i}`}
            service={service}
            result={results[service.id] ?? { status: 'idle', ms: null }}
            awsRegion={awsRegion}
            hidden={i >= SERVICES.length}
          />
        ))}
      </ul>
    </section>
  );
}
