import { useMemo, type ReactNode } from 'react';

interface DialProps {
  /** Filled fraction, 0–1. */
  progress: number;
  /** CSS colour of the progress arc. */
  color: string;
  /** Spins a short arc instead of showing progress (latency phase). */
  indeterminate?: boolean;
  children?: ReactNode;
}

const SIZE = 200;
const CENTER = SIZE / 2;
const STROKE = 7;
const RADIUS = CENTER - STROKE / 2 - 6;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TICK_COUNT = 48;
const TICK_OUTER = RADIUS - STROKE / 2 - 8;

/** Full-circle dial, ported from the mobile app's speed test screen. */
export default function Dial({ progress, color, indeterminate = false, children }: DialProps) {
  const ticks = useMemo(
    () =>
      Array.from({ length: TICK_COUNT }, (_, i) => {
        const major = i % 8 === 0;
        const angle = (i / TICK_COUNT) * 2 * Math.PI - Math.PI / 2;
        const inner = TICK_OUTER - (major ? 8 : 4);
        return {
          major,
          x1: CENTER + TICK_OUTER * Math.cos(angle),
          y1: CENTER + TICK_OUTER * Math.sin(angle),
          x2: CENTER + inner * Math.cos(angle),
          y2: CENTER + inner * Math.sin(angle),
        };
      }),
    [],
  );

  const p = indeterminate ? 0.16 : Math.max(0, Math.min(1, progress));
  const endAngle = p * 2 * Math.PI - Math.PI / 2;
  const dotX = CENTER + RADIUS * Math.cos(endAngle);
  const dotY = CENTER + RADIUS * Math.sin(endAngle);
  // Ticks the arc has swept past light up, so the scale reads as filled.
  const litTicks = Math.round(p * TICK_COUNT);

  return (
    <div className="dial">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="dial-svg" aria-hidden="true">
        <circle cx={CENTER} cy={CENTER} r={RADIUS} className="dial-track" strokeWidth={STROKE} fill="none" />
        <g>
          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              className={`dial-tick${t.major ? ' major' : ''}`}
              style={!indeterminate && i < litTicks ? { stroke: color, opacity: t.major ? 1 : 0.7 } : undefined}
            />
          ))}
        </g>
        <g className={indeterminate ? 'dial-spin' : undefined} style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}>
          {p > 0 && (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - p)}
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
            />
          )}
          {p > 0 && <circle cx={dotX} cy={dotY} r={6.5} fill={color} className="dial-dot" />}
        </g>
      </svg>
      <div className="dial-center">{children}</div>
    </div>
  );
}
