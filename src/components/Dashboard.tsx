import { useState, useRef, useEffect, useCallback } from 'react';
import { Activity, ArrowDownCircle, ArrowUpCircle, Clock, AlertTriangle } from 'lucide-react';
import NetworkCards from './Dashboard/NetworkCards';
import Gauge from './Gauge';
import SpeedTest from '@cloudflare/speedtest';
import { saveTestResult } from '../utils/history';
import { splitNumber } from '../utils/format';

type Phase = 'idle' | 'ping' | 'download' | 'upload' | 'done' | 'error';

const PING_GAUGE_MAX = 100;
const DOWNLOAD_GAUGE_MAX = 200;
const UPLOAD_GAUGE_MAX = 100;

const toMbps = (bitsPerSecond?: number) =>
  bitsPerSecond && Number.isFinite(bitsPerSecond) ? bitsPerSecond / 1e6 : 0;

const round1 = (value?: number) =>
  value && Number.isFinite(value) ? Number.parseFloat(value.toFixed(1)) : 0;

export default function Dashboard() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);

  const [download, setDownload] = useState(0);
  const [upload, setUpload] = useState(0);
  const [ping, setPing] = useState(0);
  const [jitter, setJitter] = useState(0);
  const [currentValue, setCurrentValue] = useState(0);
  const [maxValue, setMaxValue] = useState(PING_GAUGE_MAX);

  const engineRef = useRef<SpeedTest | null>(null);
  // Phase is mirrored in a ref so the engine callbacks can branch on it without
  // nesting a setState call inside another setState updater (updaters must stay
  // pure — under StrictMode they run twice).
  const phaseRef = useRef<Phase>('idle');
  // Incremented per run so callbacks from a superseded engine are ignored.
  const runIdRef = useRef(0);

  const advancePhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const teardown = useCallback((engine: SpeedTest | null) => {
    if (!engine) return;
    // Detach first: pause() can still surface a final callback otherwise.
    engine.onResultsChange = () => {};
    engine.onFinish = () => {};
    engine.onError = () => {};
    if (engine.isRunning) engine.pause();
  }, []);

  useEffect(() => {
    return () => {
      runIdRef.current += 1;
      teardown(engineRef.current);
      engineRef.current = null;
    };
  }, [teardown]);

  const startTest = useCallback(() => {
    teardown(engineRef.current);

    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    const isCurrentRun = () => runIdRef.current === runId;

    setError(null);
    setPing(0);
    setJitter(0);
    setDownload(0);
    setUpload(0);
    setCurrentValue(0);
    setMaxValue(PING_GAUGE_MAX);
    advancePhase('ping');

    const engine = new SpeedTest({
      autoStart: false,
      measurements: [
        { type: 'latency', numPackets: 30 },
        { type: 'download', bytes: 1e5, count: 4 },
        { type: 'download', bytes: 1e6, count: 8 },
        { type: 'download', bytes: 1e7, count: 8 },
        { type: 'download', bytes: 2.5e7, count: 4 },
        { type: 'upload', bytes: 1e5, count: 4 },
        { type: 'upload', bytes: 1e6, count: 8 },
        { type: 'upload', bytes: 1e7, count: 4 },
      ],
    });

    engineRef.current = engine;

    // Grows the gauge ceiling once the needle approaches it, so a 900 Mbps link
    // isn't pinned at the top of the dial.
    const trackValue = (mbps: number, floorMax: number) => {
      setCurrentValue(mbps);
      setMaxValue((prev) => {
        const base = Math.max(prev, floorMax);
        return mbps > base * 0.8 ? mbps * 1.5 : base;
      });
    };

    engine.onResultsChange = ({ type }: { type: string }) => {
      if (!isCurrentRun()) return;

      const summary = engine.results.getSummary();
      setPing(round1(summary.latency));
      setJitter(round1(summary.jitter));

      if (type === 'download') {
        if (phaseRef.current !== 'download') {
          advancePhase('download');
          setMaxValue(DOWNLOAD_GAUGE_MAX);
        }
        const mbps = toMbps(engine.results.getDownloadBandwidth());
        if (mbps > 0) {
          setDownload(mbps);
          trackValue(mbps, DOWNLOAD_GAUGE_MAX);
        }
      }

      if (type === 'upload') {
        if (phaseRef.current !== 'upload') {
          advancePhase('upload');
          setMaxValue(UPLOAD_GAUGE_MAX);
        }
        const mbps = toMbps(engine.results.getUploadBandwidth());
        if (mbps > 0) {
          setUpload(mbps);
          trackValue(mbps, UPLOAD_GAUGE_MAX);
        }
      }
    };

    engine.onFinish = () => {
      if (!isCurrentRun()) return;

      const summary = engine.results.getSummary();
      const finalDownload = toMbps(summary.download);
      const finalUpload = toMbps(summary.upload);
      const finalPing = round1(summary.latency);
      const finalJitter = round1(summary.jitter);

      setDownload(finalDownload);
      setUpload(finalUpload);
      setPing(finalPing);
      setJitter(finalJitter);
      advancePhase('done');

      if (finalDownload === 0 && finalUpload === 0) {
        setError('The test finished without measuring any throughput. Check your connection and try again.');
        return;
      }

      void saveTestResult({
        download: finalDownload,
        upload: finalUpload,
        ping: finalPing,
      });
    };

    engine.onError = (e: string) => {
      if (!isCurrentRun()) return;
      console.error('Speedtest error:', e);
      setError(
        typeof e === 'string' && e
          ? `Speed test failed: ${e}`
          : 'Speed test failed. The test servers may be unreachable from this network.',
      );
      advancePhase('error');
    };

    engine.play();
  }, [advancePhase, teardown]);

  const currentLabel =
    phase === 'idle' ? 'READY'
      : phase === 'ping' ? 'PINGING'
        : phase === 'download' ? 'DOWNLOAD'
          : phase === 'upload' ? 'UPLOAD'
            : phase === 'error' ? 'FAILED'
              : 'COMPLETE';

  const isRunning = phase === 'ping' || phase === 'download' || phase === 'upload';
  const gaugeValue =
    phase === 'idle' || phase === 'ping' || phase === 'error'
      ? 0
      : phase === 'done'
        ? download
        : currentValue;

  const downloadParts = splitNumber(download);
  const uploadParts = splitNumber(upload);

  return (
    <div className="dashboard-grid fade-in">
      {/* Left Column: Speedometer & bottom metrics */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>

        <div className="gauge-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Gauge
            value={gaugeValue}
            max={maxValue}
            currentLabel={currentLabel}
            phase={phase}
            isRunning={isRunning}
            onStart={startTest}
            downloadResult={download}
            uploadResult={upload}
          />
        </div>

        {error && (
          <div
            role="alert"
            className="fade-in"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              margin: '0 0 16px',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--ping-color)',
              background: 'rgba(255, 75, 75, 0.08)',
              color: 'var(--text-primary)',
              fontSize: '13px',
            }}
          >
            <AlertTriangle size={16} color="var(--ping-color)" />
            <span>{error}</span>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="metrics-grid">
          <div className="metric-card metric-ping">
            <div className="metric-label-group">
              <Activity size={10} color="var(--ping-color)" /> PING
            </div>
            <div className="metric-value-group">
              <span className="metric-value">{ping ? ping : '--'}</span>
              <span className="metric-unit">ms</span>
            </div>
          </div>

          <div className="metric-card metric-jitter">
            <div className="metric-label-group">
              <Clock size={10} color="var(--jitter-color)" /> JITTER
            </div>
            <div className="metric-value-group">
              <span className="metric-value">{jitter ? jitter : '--'}</span>
              <span className="metric-unit">ms</span>
            </div>
          </div>

          <div className="metric-card metric-download">
            <div className="metric-label-group">
              <ArrowDownCircle size={10} color="var(--download-color)" /> DOWNLOAD
            </div>
            <div className="metric-value-group">
              <span className="metric-value">{download > 0 ? downloadParts.whole : '--'}</span>
              {download > 0 && (
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                  {downloadParts.decimal}
                </span>
              )}
              <span className="metric-unit" style={{ marginLeft: '4px' }}>Mbps</span>
            </div>
          </div>

          <div className="metric-card metric-upload">
            <div className="metric-label-group">
              <ArrowUpCircle size={10} color="var(--upload-color)" /> UPLOAD
            </div>
            <div className="metric-value-group">
              <span className="metric-value">{upload > 0 ? uploadParts.whole : '--'}</span>
              {upload > 0 && (
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                  {uploadParts.decimal}
                </span>
              )}
              <span className="metric-unit" style={{ marginLeft: '4px' }}>Mbps</span>
            </div>
          </div>
        </div>

      </div>

      {/* Right Column: Info Cards & Map */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <NetworkCards latency={ping} jitter={jitter} />
      </div>
    </div>
  );
}
