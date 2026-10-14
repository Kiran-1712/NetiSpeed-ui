import { useMemo, useState } from 'react';
import { useSize } from '../hooks/useSize';
import type { TestResult } from '../utils/history';
import { formatMbps, formatShortDate, niceCeil } from '../utils/format';

const PAD = { top: 10, right: 10, bottom: 8, left: 34 };

interface TrendChartProps {
  /** Results newest first, as history stores them. */
  items: TestResult[];
  limit?: number;
}

/** Download and upload over recent tests on one Mbps axis, with a hover crosshair. */
export default function TrendChart({ items, limit = 30 }: TrendChartProps) {
  const [boxRef, { width, height }] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  // Oldest on the left so the line reads forward in time.
  const points = useMemo(() => items.slice(0, limit).reverse(), [items, limit]);
  const max = niceCeil(Math.max(...points.map((p) => Math.max(p.download, p.upload)), 1));

  const plotW = Math.max(width - PAD.left - PAD.right, 1);
  const plotH = Math.max(height - PAD.top - PAD.bottom, 1);
  const step = points.length > 1 ? plotW / (points.length - 1) : 0;
  const x = (i: number) => PAD.left + (points.length > 1 ? i * step : plotW / 2);
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;

  const path = (key: 'download' | 'upload') =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ');

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - PAD.left;
    const i = points.length > 1 ? Math.round(px / step) : 0;
    setHover(Math.max(0, Math.min(points.length - 1, i)));
  };

  const hovered = hover !== null ? points[hover] : null;
  const tipLeft = hover !== null ? x(hover) : 0;

  return (
    <div className="chart" ref={boxRef}>
      {width > 0 && height > 0 && (
        <svg
          width={width}
          height={height}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          role="img"
          aria-label={`Download and upload speed over the last ${points.length} tests`}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <g key={f}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(max * f)} y2={y(max * f)} className="grid" />
              <text x={PAD.left - 10} y={y(max * f)} className="axis" textAnchor="end" dominantBaseline="middle">
                {Math.round(max * f)}
              </text>
            </g>
          ))}
          {hover !== null && (
            <line x1={tipLeft} x2={tipLeft} y1={PAD.top} y2={PAD.top + plotH} className="crosshair" />
          )}
          {points.length > 1 && (
            <>
              <path d={path('download')} className="series" style={{ stroke: 'var(--dl-b)' }} />
              <path d={path('upload')} className="series" style={{ stroke: 'var(--ul-b)' }} />
            </>
          )}
          {(points.length === 1 ? [0] : hover !== null ? [hover] : []).map((i) => (
            <g key={i}>
              <circle cx={x(i)} cy={y(points[i].download)} r={4.5} className="marker" style={{ fill: 'var(--dl-b)' }} />
              <circle cx={x(i)} cy={y(points[i].upload)} r={4.5} className="marker" style={{ fill: 'var(--ul-b)' }} />
            </g>
          ))}
          {/* Invisible full-height hit area so hover works anywhere in the plot. */}
          <rect x={PAD.left} y={0} width={plotW} height={height} fill="transparent" />
        </svg>
      )}
      {hovered && (
        <div className={`tooltip${tipLeft > width / 2 ? ' left' : ''}`} style={{ left: tipLeft }} role="status">
          <span className="tooltip-date">{formatShortDate(hovered.id, hovered.date)}</span>
          <span className="tooltip-row">
            <span className="swatch" style={{ background: 'var(--dl-b)' }} /> Download
            <b>{formatMbps(hovered.download)} Mbps</b>
          </span>
          <span className="tooltip-row">
            <span className="swatch" style={{ background: 'var(--ul-b)' }} /> Upload
            <b>{formatMbps(hovered.upload)} Mbps</b>
          </span>
          <span className="tooltip-row">
            <span className="swatch hollow" /> Ping <b>{hovered.ping} ms</b>
          </span>
        </div>
      )}
    </div>
  );
}
