import { useCallback, useEffect, useRef, useState } from 'react';
import SpeedTest, { type Results } from '@cloudflare/speedtest';
import { saveTestResult } from '../utils/history';

export type Phase = 'idle' | 'ping' | 'download' | 'upload' | 'done' | 'error';

/** Latency idle vs while the line is saturated, for the bufferbloat grade. */
export interface LoadProfile {
  idle: number | null;
  /** Latency measured while a download saturates the line. */
  downloading: number | null;
  /** Latency measured while an upload saturates the line. */
  uploading: number | null;
}

const EMPTY_PROFILE: LoadProfile = { idle: null, downloading: null, uploading: null };

/** Reads the load profile off the engine. Any getter can throw before it has data. */
const readProfile = (results: Results): LoadProfile => {
  const read = (get: () => number | undefined) => {
    try {
      const v = get();
      return v !== undefined && Number.isFinite(v) && v > 0 ? Math.round(v * 10) / 10 : null;
    } catch {
      return null;
    }
  };
  return {
    idle: read(() => results.getUnloadedLatency()),
    downloading: read(() => results.getDownLoadedLatency()),
    uploading: read(() => results.getUpLoadedLatency()),
  };
};

export interface SpeedTestState {
  phase: Phase;
  error: string | null;
  download: number;
  upload: number;
  ping: number;
  jitter: number;
  load: LoadProfile;
  isRunning: boolean;
  start: () => void;
}

const toMbps = (bitsPerSecond?: number) =>
  bitsPerSecond && Number.isFinite(bitsPerSecond) ? bitsPerSecond / 1e6 : 0;

const round1 = (value?: number) =>
  value && Number.isFinite(value) ? Number.parseFloat(value.toFixed(1)) : 0;

/**
 * Owns the Cloudflare speed test engine. Lives at the app root so switching
 * panels on a phone never tears down a measurement that is still running.
 */
export function useSpeedTest(): SpeedTestState {
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [download, setDownload] = useState(0);
  const [upload, setUpload] = useState(0);
  const [ping, setPing] = useState(0);
  const [jitter, setJitter] = useState(0);
  const [load, setLoad] = useState<LoadProfile>(EMPTY_PROFILE);

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

  const start = useCallback(() => {
    teardown(engineRef.current);

    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    const isCurrentRun = () => runIdRef.current === runId;

    setError(null);
    setPing(0);
    setJitter(0);
    setDownload(0);
    setUpload(0);
    setLoad(EMPTY_PROFILE);
    advancePhase('ping');

    // The engine moves to the next size only while every request in a set
    // finishes in under a second, so the large sets run on fast lines alone and
    // a slow line stops early. Without them a gigabit line tops out at 25 MB
    // requests (~0.2 s each), too short to ramp up, and reads low. The sizes
    // match Cloudflare's own defaults; packet loss is left out because it needs
    // TURN credentials that only speed.cloudflare.com can issue.
    const engine = new SpeedTest({
      autoStart: false,
      measurements: [
        { type: 'latency', numPackets: 30 },
        { type: 'download', bytes: 1e5, count: 4 },
        { type: 'download', bytes: 1e6, count: 8 },
        { type: 'download', bytes: 1e7, count: 6 },
        { type: 'download', bytes: 2.5e7, count: 4 },
        { type: 'download', bytes: 1e8, count: 3 },
        { type: 'download', bytes: 2.5e8, count: 2 },
        { type: 'upload', bytes: 1e5, count: 4 },
        { type: 'upload', bytes: 1e6, count: 6 },
        { type: 'upload', bytes: 1e7, count: 4 },
        { type: 'upload', bytes: 2.5e7, count: 4 },
        { type: 'upload', bytes: 5e7, count: 3 },
      ],
    });
    // Connection errors are not fatal: the engine gives up on that direction
    // and carries on, so they are held until onFinish can judge the outcome.
    let lastError: string | null = null;

    engineRef.current = engine;

    engine.onResultsChange = ({ type }: { type: string }) => {
      if (!isCurrentRun()) return;

      const summary = engine.results.getSummary();
      setPing(round1(summary.latency));
      setJitter(round1(summary.jitter));
      setLoad(readProfile(engine.results));

      if (type === 'download') {
        if (phaseRef.current !== 'download') advancePhase('download');
        const mbps = toMbps(engine.results.getDownloadBandwidth());
        if (mbps > 0) setDownload(mbps);
      }

      if (type === 'upload') {
        if (phaseRef.current !== 'upload') advancePhase('upload');
        const mbps = toMbps(engine.results.getUploadBandwidth());
        if (mbps > 0) setUpload(mbps);
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
      setLoad(readProfile(engine.results));

      // A result missing a direction would drag down the history trend, so it
      // is shown but not saved.
      const missing =
        finalDownload === 0 && finalUpload === 0
          ? 'any throughput'
          : finalDownload === 0
            ? 'download speed'
            : finalUpload === 0
              ? 'upload speed'
              : null;
      if (missing) {
        if (lastError) console.error('Speedtest error:', lastError);
        setError(
          `The test finished without measuring ${missing}. The test servers may be unreachable from this network — try again.`,
        );
        advancePhase('error');
        return;
      }

      advancePhase('done');
      const profile = readProfile(engine.results);
      void saveTestResult({
        download: finalDownload,
        upload: finalUpload,
        ping: finalPing,
        loadedDown: profile.downloading ?? undefined,
        loadedUp: profile.uploading ?? undefined,
      });
    };

    engine.onError = (e: string) => {
      if (!isCurrentRun()) return;
      console.warn('Speedtest error:', e);
      lastError = typeof e === 'string' ? e : String(e);
    };

    engine.play();
  }, [advancePhase, teardown]);

  const isRunning = phase === 'ping' || phase === 'download' || phase === 'upload';

  return { phase, error, download, upload, ping, jitter, load, isRunning, start };
}
