import { useEffect, useState, useMemo, useRef } from 'react';
import { splitNumber } from '../utils/format';

interface SpeedometerProps {
  value: number;
  max?: number;
  currentLabel?: string;
  phase?: string;
  onStart?: () => void;
  isRunning?: boolean;
  downloadResult?: number;
  uploadResult?: number;
}

export default function Gauge({
  value,
  max: maxValue = 100,
  currentLabel: status = 'Idle',
  phase,
  onStart,
  isRunning = false,
  downloadResult = 0,
  uploadResult = 0,
}: SpeedometerProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // The animation's starting point is held in a ref rather than read from state,
  // so re-targeting mid-tween resumes from where the needle actually is without
  // making `animatedValue` an effect dependency (which would restart the tween
  // on every frame).
  const animatedValueRef = useRef(0);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const duration = 1000;
    const initialValue = animatedValueRef.current;
    const target = Number.isFinite(value) ? value : 0;
    let animationFrame = 0;
    let startTimestamp: number | null = null;

    const animate = (timestamp: number) => {
      if (startTimestamp === null) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progressFactor = Math.min(elapsed / duration, 1);

      const easeOutExpo = progressFactor === 1 ? 1 : 1 - Math.pow(2, -12 * progressFactor);
      const currentVal = initialValue + (target - initialValue) * easeOutExpo;

      animatedValueRef.current = currentVal;
      setAnimatedValue(currentVal);

      if (progressFactor < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value]);

  const isMobile = windowWidth < 640;
  const size = isMobile ? Math.min(windowWidth - 48, 380) : 420;
  const strokeWidth = isMobile ? 12 : 14;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const angleRange = 270;
  const startAngle = 135;

  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (r * Math.cos(angleInRadians)),
      y: centerY + (r * Math.sin(angleInRadians))
    };
  };

  const describeArc = (x: number, y: number, r: number, startA: number, endA: number) => {
    const start = polarToCartesian(x, y, r, endA);
    const end = polarToCartesian(x, y, r, startA);
    const largeArcFlag = endA - startA <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y,
      "A", r, r, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  };

  // Guard against a zero/negative max arriving from a caller — it would make
  // fillPercentage Infinity or NaN and produce an invalid arc path.
  const safeMax = maxValue > 0 ? maxValue : 100;
  const clampedValue = Math.min(Math.max(animatedValue, 0), safeMax);
  const fillPercentage = clampedValue / safeMax;
  const endAngle = startAngle + (angleRange * fillPercentage);

  let gaugeColor = 'var(--accent-color)';
  if (phase === 'download') gaugeColor = 'var(--download-color)';
  else if (phase === 'upload') gaugeColor = 'var(--upload-color)';
  else if (phase === 'ping' || phase === 'error') gaugeColor = 'var(--ping-color)';

  // A failed run falls back to the start button so there is always a way to retry.
  const showStartButton = phase === 'idle' || phase === 'error';
  const startButtonColor = phase === 'error' ? 'var(--ping-color)' : 'var(--accent-color)';

  const ticks = useMemo(() => {
    const items = [];
    const ticksCount = 40;
    for (let i = 0; i <= ticksCount; i++) {
      const angle = startAngle + (i * (angleRange / ticksCount));
      const p1 = polarToCartesian(cx, cy, radius - (isMobile ? 10 : 15), angle);
      const p2 = polarToCartesian(cx, cy, radius - (isMobile ? 18 : 25), angle);
      items.push(<line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="currentColor" style={{ opacity: 0.1 }} strokeWidth="1.5" strokeLinecap="round" />);
    }
    return items;
  }, [cx, cy, radius, startAngle, angleRange, isMobile]);

  const { whole: wholePart, decimal: decimalPart } = splitNumber(animatedValue);

  const showDownload = (phase === 'upload' && downloadResult > 0) || phase === 'done';
  const showUpload = phase === 'done';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center', justifyContent: 'center' }}>

      {/* Top Results Section (Above the bar) */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'center' : 'center',
        gap: isMobile ? '24px' : '48px',
        marginBottom: isMobile ? '30px' : '60px',
        minHeight: isMobile ? 'auto' : '80px',
        position: 'relative'
      }}>
        {/* Download HUD Item */}
        <div style={{
          opacity: showDownload ? 1 : 0,
          transform: `translateX(${showDownload ? '0' : (isMobile ? '0' : '-20px')}) translateY(${showDownload ? '0' : (isMobile ? '-10px' : '0')})`,
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isMobile ? 'center' : 'flex-start',
          position: 'relative'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px'
          }}>
            <div style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: 'var(--download-color)',
              boxShadow: '0 0 8px var(--download-color)'
            }} />
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.15em' }}>DOWNLOAD</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{
              fontSize: isMobile ? '32px' : '42px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              fontFamily: 'var(--mono-font)',
              letterSpacing: '-0.02em',
              textShadow: phase === 'done' ? '0 0 20px rgba(41, 121, 255, 0.2)' : 'none'
            }}>
              {downloadResult.toFixed(1)}
            </span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', marginLeft: '8px', letterSpacing: '0.1em' }}>MBPS</span>
          </div>
          <div style={{
            position: 'absolute',
            bottom: '-12px',
            left: isMobile ? '50%' : 0,
            transform: isMobile ? 'translateX(-50%)' : 'none',
            width: isMobile ? '60px' : '100%',
            height: '1px',
            background: `linear-gradient(90deg, transparent, var(--download-color) 50%, transparent)`,
            opacity: 0.4,
            transition: 'width 1s ease'
          }} />
        </div>

        {/* Vertical Divider (Hidden on mobile) */}
        {!isMobile && showDownload && showUpload && (
          <div style={{
            width: '1px',
            height: '40px',
            background: 'var(--panel-border)',
            opacity: 0.5,
            animation: 'fadeIn 1s ease'
          }} />
        )}

        {/* Upload HUD Item */}
        <div style={{
          opacity: showUpload ? 1 : 0,
          transform: `translateX(${showUpload ? '0' : (isMobile ? '0' : '20px')}) translateY(${showUpload ? '0' : (isMobile ? '10px' : '0')})`,
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isMobile ? 'center' : 'flex-start',
          position: 'relative'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px'
          }}>
            <div style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: 'var(--upload-color)',
              boxShadow: '0 0 8px var(--upload-color)'
            }} />
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.15em' }}>UPLOAD</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{
              fontSize: isMobile ? '32px' : '42px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              fontFamily: 'var(--mono-font)',
              letterSpacing: '-0.02em',
              textShadow: '0 0 20px rgba(255, 145, 0, 0.2)'
            }}>
              {uploadResult.toFixed(1)}
            </span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', marginLeft: '8px', letterSpacing: '0.1em' }}>MBPS</span>
          </div>
          <div style={{
            position: 'absolute',
            bottom: '-12px',
            left: isMobile ? '50%' : 0,
            transform: isMobile ? 'translateX(-50%)' : 'none',
            width: isMobile ? '60px' : '100%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, var(--upload-color) 50%, transparent)',
            opacity: 0.4
          }} />
        </div>
      </div>

      <div style={{ position: 'relative', width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ position: 'absolute', inset: 0, overflow: 'visible', color: 'var(--text-primary)' }}
        >
          <defs>
            <linearGradient id="mainGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={gaugeColor} stopOpacity="0.8" />
              <stop offset="100%" stopColor={gaugeColor} />
            </linearGradient>
            <filter id="ultraGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="15" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <radialGradient id="centerGlowGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={gaugeColor} stopOpacity={isRunning ? 0.35 : 0.0} />
              <stop offset="100%" stopColor={gaugeColor} stopOpacity="0" />
            </radialGradient>
            <filter id="centerGlowBlur">
              <feGaussianBlur stdDeviation="40" />
            </filter>
          </defs>

          <circle
            cx={cx}
            cy={cy}
            r={radius * 0.7}
            fill="url(#centerGlowGradient)"
            filter="url(#centerGlowBlur)"
            style={{ transition: 'opacity 1s ease, fill 0.8s ease' }}
          />

          <path
            d={describeArc(cx, cy, radius, startAngle, startAngle + angleRange)}
            fill="none"
            stroke="currentColor"
            style={{ opacity: 0.05 }}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          <path
            d={describeArc(cx, cy, radius, startAngle, Math.max(startAngle + 0.1, endAngle))}
            fill="none"
            stroke="url(#mainGaugeGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            filter={isRunning ? "url(#ultraGlow)" : ""}
            style={{ transition: 'stroke 0.5s ease, stroke-dashoffset 0.5s ease' }}
          />

          {ticks}
        </svg>

        {/* Center Content */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
          zIndex: 10
        }}>

          {showStartButton ? (
            <button
              type="button"
              onClick={onStart}
              aria-label={phase === 'error' ? 'Retry speed test' : 'Start speed test'}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: isMobile ? '130px' : '160px',
                height: isMobile ? '130px' : '160px',
                borderRadius: '50%',
                border: `2px solid ${startButtonColor}`,
                boxShadow: `0 0 ${isMobile ? '20px' : '30px'} ${startButtonColor}`,
                background: 'var(--card-bg)',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.3s ease',
              }}
              className="anim-pulse"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = `0 0 40px ${startButtonColor}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = `0 0 30px ${startButtonColor}`;
              }}
            >
              <span style={{ fontSize: phase === 'error' ? '26px' : '42px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
                {phase === 'error' ? 'RETRY' : 'GO'}
              </span>
            </button>
          ) : (
            <div style={{
              opacity: isRunning || phase === 'done' ? 1 : 0,
              transform: `scale(${isRunning || phase === 'done' ? 1 : 0.8})`,
              transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <div style={{
                color: phase === 'done' ? 'var(--jitter-color)' : gaugeColor,
                fontSize: '11px',
                fontWeight: '800',
                letterSpacing: '0.25em',
                marginBottom: '8px',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {phase === 'done' && <div className="status-dot active" style={{ width: '6px', height: '6px' }} />}
                {status}
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '120px'
              }}>
                {phase === 'done' ? (
                  <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
                      <span className="mono" style={{ fontSize: isMobile ? '70px' : '96px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
                        {wholePart}
                      </span>
                      <span className="mono" style={{ fontSize: isMobile ? '28px' : '36px', color: 'var(--text-secondary)', fontWeight: 500, marginLeft: '2px' }}>
                        {decimalPart}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '800', letterSpacing: '0.3em', marginTop: '2px' }}>
                      MBPS
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
                      <span className="mono" style={{ fontSize: isMobile ? '60px' : '90px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
                        {wholePart}
                      </span>
                      <span className="mono" style={{ fontSize: isMobile ? '24px' : '32px', color: 'var(--text-secondary)', fontWeight: 500, marginLeft: '2px' }}>
                        {decimalPart}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '800', letterSpacing: '0.3em', marginTop: '4px' }}>
                      MBPS
                    </div>
                  </div>
                )}
              </div>

              {phase === 'done' && (
                <button
                  onClick={onStart}
                  className="btn-primary"
                  style={{
                    marginTop: '16px',
                    padding: isMobile ? '8px 24px' : '10px 32px',
                    fontSize: isMobile ? '11px' : '12px',
                    borderRadius: '24px',
                    border: '1px solid var(--accent-color)',
                    background: 'rgba(88, 166, 255, 0.1)',
                    color: 'var(--accent-color)',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(88, 166, 255, 0.15)',
                    animation: 'fadeIn 0.8s ease-out forwards',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--accent-color)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(88, 166, 255, 0.1)';
                    e.currentTarget.style.color = 'var(--accent-color)';
                  }}
                >
                  GO AGAIN
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
