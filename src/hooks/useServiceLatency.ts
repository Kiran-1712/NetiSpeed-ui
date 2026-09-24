import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SERVICES } from '../utils/services';

export interface ServiceResult {
  status: 'idle' | 'probing' | 'done' | 'blocked';
  /** Median round trip in ms once measured. */
  ms: number | null;
}

export interface ServiceLatency {
  results: Record<string, ServiceResult>;
  /** AWS region the probe targets, e.g. "Mumbai". */
  awsRegion: string;
  probing: boolean;
  refresh: () => void;
}

const SAMPLES = 3;
const TIMEOUT_MS = 3000;
// A cold first request can take several seconds (DynamoDB's regularly does)
// while warm ones answer in tens of ms, so the warm-up gets far longer.
const WARM_UP_TIMEOUT_MS = 10000;
// Parallel probes queue behind each other on the same link and inflate every
// number (measured: YouTube 41–52 ms in a pool of four vs 30 ms alone).
const CONCURRENCY = 2;

// DynamoDB's regional /ping endpoint is what cloudping.info times, so it
// measures a real AWS region rather than the nearest CloudFront edge.
const AWS_REGIONS: { match: RegExp; code: string; city: string }[] = [
  { match: /^Asia\/(Kolkata|Calcutta|Colombo|Dhaka|Kathmandu|Thimphu|Karachi)/, code: 'ap-south-1', city: 'Mumbai' },
  { match: /^Asia\/(Dubai|Riyadh|Qatar|Bahrain|Kuwait|Muscat|Tehran|Baghdad)/, code: 'me-south-1', city: 'Bahrain' },
  { match: /^Asia\/(Tokyo|Seoul|Pyongyang)/, code: 'ap-northeast-1', city: 'Tokyo' },
  { match: /^(Australia|Pacific\/Auckland)/, code: 'ap-southeast-2', city: 'Sydney' },
  { match: /^Asia\//, code: 'ap-southeast-1', city: 'Singapore' },
  { match: /^(Europe|Africa|Atlantic)\//, code: 'eu-central-1', city: 'Frankfurt' },
  { match: /^America\/(Sao_Paulo|Argentina|Santiago|Bogota|Lima|Montevideo|Caracas)/, code: 'sa-east-1', city: 'São Paulo' },
  { match: /^America\/(Los_Angeles|Vancouver|Tijuana|Denver|Phoenix|Boise|Edmonton)|^US\/(Pacific|Mountain)/, code: 'us-west-2', city: 'Oregon' },
];
const DEFAULT_REGION = { code: 'us-east-1', city: 'Virginia' };

const pickAwsRegion = () => {
  let zone = '';
  try {
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  } catch {
    // Fall through to the default region.
  }
  return AWS_REGIONS.find((r) => r.match.test(zone)) ?? DEFAULT_REGION;
};

const idleResults = () =>
  Object.fromEntries(SERVICES.map((s) => [s.id, { status: 'idle', ms: null } as ServiceResult]));

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/**
 * Times one opaque HTTPS request. `no-cors` means the body is unreadable, but
 * the round trip still completes, which is all a latency probe needs.
 */
const timeRequest = async (url: string, signal: AbortSignal, timeout = TIMEOUT_MS) => {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal.addEventListener('abort', onAbort, { once: true });
  const timer = setTimeout(() => controller.abort(), timeout);
  const start = performance.now();
  try {
    await fetch(url, { mode: 'no-cors', cache: 'no-store', signal: controller.signal });
    return performance.now() - start;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', onAbort);
  }
};

/**
 * Latency from this browser to popular services. The first request per host
 * pays for DNS, TCP and TLS, so it is discarded; the median of the rest
 * approximates one round trip on a warm connection.
 */
export function useServiceLatency(paused: boolean): ServiceLatency {
  const [region] = useState(pickAwsRegion);
  const [results, setResults] = useState<Record<string, ServiceResult>>(idleResults);
  const [probing, setProbing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const targets = useMemo(
    () =>
      SERVICES.map((s) => ({
        id: s.id,
        url: s.url ?? `https://dynamodb.${region.code}.amazonaws.com/ping`,
      })),
    [region],
  );

  const probe = useCallback(async (id: string, url: string, signal: AbortSignal) => {
    const set = (result: ServiceResult) => setResults((prev) => ({ ...prev, [id]: result }));
    setResults((prev) => ({ ...prev, [id]: { ...prev[id], status: 'probing' } }));

    try {
      await timeRequest(url, signal, WARM_UP_TIMEOUT_MS); // warm-up: DNS, TCP and TLS
    } catch {
      // Unreachable or filtered: more attempts would only burn the timeout again.
      if (!signal.aborted) set({ status: 'blocked', ms: null });
      return;
    }

    const samples: number[] = [];
    for (let i = 0; i < SAMPLES; i++) {
      if (signal.aborted) return;
      try {
        samples.push(await timeRequest(url, signal));
      } catch {
        if (signal.aborted) return;
      }
    }
    if (signal.aborted) return;
    set(samples.length ? { status: 'done', ms: Math.round(median(samples)) } : { status: 'blocked', ms: null });
  }, []);

  const run = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;
    setProbing(true);

    const queue = [...targets];
    const worker = async () => {
      for (let next = queue.shift(); next && !signal.aborted; next = queue.shift()) {
        await probe(next.id, next.url, signal);
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    if (!signal.aborted) {
      setProbing(false);
    } else if (abortRef.current === controller) {
      // Stopped rather than superseded (a speed test started): put rows that
      // were mid-probe back to their last known state.
      setProbing(false);
      setResults((prev) => {
        const next = { ...prev };
        for (const id of Object.keys(next)) {
          if (next[id].status === 'probing') next[id] = { ...next[id], status: next[id].ms === null ? 'idle' : 'done' };
        }
        return next;
      });
    }
  }, [targets, probe]);

  // Probe shortly after load, then again whenever a speed test finishes. Never
  // while one runs: the probes and the test would skew each other's numbers.
  useEffect(() => {
    if (paused) {
      abortRef.current?.abort();
      return;
    }
    const timer = setTimeout(() => void run(), 1200);
    return () => clearTimeout(timer);
  }, [paused, run]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const refresh = useCallback(() => {
    if (!paused) void run();
  }, [paused, run]);

  return { results, awsRegion: region.city, probing, refresh };
}
