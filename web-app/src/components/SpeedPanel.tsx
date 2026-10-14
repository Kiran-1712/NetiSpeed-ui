import { AlertTriangle, Play, RotateCcw } from 'lucide-react';
import Dial from './Dial';
import { useTween } from '../hooks/useTween';
import type { Phase, SpeedTestState } from '../hooks/useSpeedTest';
import { formatMbps, toScale } from '../utils/format';
import { rateQuality, type QualityRating } from '../utils/history';

interface SpeedPanelProps {
  test: SpeedTestState;
}

const VERDICT_NOTES: Record<QualityRating, string> = {
  Excellent: '4K streaming, large downloads and gaming',
  Good: 'HD streaming and video calls without buffering',
  Fair: 'Browsing and standard-definition video',
  Poor: 'Expect buffering on video and slow downloads',
};

const CAPTIONS: Record<Phase, string> = {
  idle: 'Ready',
  ping: 'Latency',
  download: 'Download',
  upload: 'Upload',
  done: 'Download',
  error: 'Failed',
};

const ARC_COLORS: Partial<Record<Phase, string>> = {
  ping: 'var(--ping-a)',
  download: 'var(--dl-a)',
  upload: 'var(--ul-a)',
  done: 'var(--dl-a)',
};

interface ReadoutProps {
  label: string;
  value: number;
  color: string;
  live: boolean;
}

function Readout({ label, value, color, live }: ReadoutProps) {
  const shown = useTween(value, 500);
  return (
    <div className="readout">
      <div className="readout-head">
        <span className="pillar" style={{ background: color }} />
        <span className="micro">{label}</span>
        {live && <span className="live-dot" style={{ background: color }} aria-label="measuring" />}
      </div>
      <div className="readout-value">
        <span className={`num num-lg${value > 0 ? '' : ' pending'}`}>{value > 0 ? formatMbps(shown) : '—'}</span>
        <span className="unit">Mbps</span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${toScale(shown) * 100}%`, background: color }} />
      </div>
    </div>
  );
}

export default function SpeedPanel({ test }: SpeedPanelProps) {
  const { phase, error, download, upload, ping, jitter, isRunning, start } = test;

  const dialTarget = phase === 'upload' ? upload : phase === 'download' || phase === 'done' ? download : 0;
  const dialValue = useTween(dialTarget, 800);

  const verdict = phase === 'done' ? rateQuality(download, upload, ping) : null;

  let centerValue: string;
  let centerUnit = 'Mbps';
  if (phase === 'ping') {
    centerValue = ping > 0 ? ping.toFixed(0) : '···';
    centerUnit = 'ms';
  } else if (phase === 'download' || phase === 'upload' || phase === 'done') {
    centerValue = formatMbps(dialValue);
  } else {
    centerValue = '0';
  }

  const buttonLabel = isRunning ? 'Testing…' : phase === 'idle' ? 'Start test' : 'Test again';

  return (
    <section className="lead speed-panel area-lead" data-sub="test" aria-label="Speed test">
      <div className="lead-head">
        <span className="micro">Cloudflare edge</span>
        <h1 className="lead-title">Speed test</h1>
      </div>

      <div className="dial-slot">
        <Dial
          progress={toScale(dialValue)}
          color={ARC_COLORS[phase] ?? 'var(--ink-3)'}
          indeterminate={phase === 'ping'}
        >
          <span className="micro">{CAPTIONS[phase]}</span>
          <span className={`dial-value${phase === 'idle' || phase === 'error' ? ' pending' : ''}`}>
            {centerValue}
          </span>
          <span className="micro dial-unit">{centerUnit}</span>
        </Dial>
      </div>

      <div className="readouts">
        <Readout label="Download" value={download} color="var(--dl-a)" live={phase === 'download'} />
        <span className="v-divider" />
        <Readout label="Upload" value={upload} color="var(--ul-a)" live={phase === 'upload'} />
      </div>

      <div className="strip">
        <div className="strip-cell">
          <span className="micro">Ping</span>
          <span className={`num num-sm${ping > 0 ? '' : ' pending'}`}>
            {ping > 0 ? ping : '—'}
            <span className="unit">ms</span>
          </span>
        </div>
        <span className="v-divider short" />
        <div className="strip-cell">
          <span className="micro">Jitter</span>
          <span className={`num num-sm${jitter > 0 ? '' : ' pending'}`}>
            {jitter > 0 ? jitter : '—'}
            <span className="unit">ms</span>
          </span>
        </div>
        <span className="v-divider short" />
        <div className="strip-cell">
          <span className="micro">Quality</span>
          {verdict ? (
            <span className="verdict">
              <span className={`status-dot ${verdict.toLowerCase()}`} />
              {verdict}
            </span>
          ) : (
            <span className="num num-sm pending">—</span>
          )}
        </div>
      </div>

      <div className="speed-footer">
        {error ? (
          <p className="notice error" role="alert">
            <AlertTriangle size={14} /> {error}
          </p>
        ) : (
          <p className="notice" aria-live="polite">
            {verdict
              ? VERDICT_NOTES[verdict]
              : isRunning
                ? 'Measuring — keep this tab open until it finishes.'
                : 'Measures latency, download and upload against the nearest Cloudflare edge.'}
          </p>
        )}
        <button type="button" className="primary-btn" onClick={start} disabled={isRunning}>
          {isRunning ? <span className="spinner" /> : phase === 'idle' ? <Play size={16} /> : <RotateCcw size={16} />}
          {buttonLabel}
        </button>
      </div>
    </section>
  );
}
