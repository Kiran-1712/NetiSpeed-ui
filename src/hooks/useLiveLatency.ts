import { useEffect, useState } from 'react';

/** Same zero-byte endpoint the Cloudflare speed test times its latency with. */
const PING_URL = 'https://speed.cloudflare.com/__down?bytes=0';
const INTERVAL_MS = 1000;
const TIMEOUT_MS = 2000;
export const WINDOW = 60;

export interface LiveSample {
  /** Round trip in ms, or null when the request was lost (timed out or failed). */
  ms: number | null;
}

export interface LiveLatency {
  samples: LiveSample[];
  current: number | null;
  average: number | null;
  /** Mean change between consecutive replies, as ping tools report jitter. */
  jitter: number | null;
  /** Share of lost requests in the window, 0–1. */
  loss: number | null;
}

/**
 * The server reports how long it spent on the request (Server-Timing:
 * cfRequestDuration). Subtracting it leaves the network round trip, which is
 * how the speed test library itself computes latency.
 */
const serverTime = (res: Response) => {
  const header = res.headers.get('server-timing') ?? '';
  const match = /cfRequestDuration;dur=([\d.]+)/.exec(header);
  return match ? Number.parseFloat(match[1]) : 0;
};

const pingOnce = async (signal: AbortSignal): Promise<number | null> => {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal.addEventListener('abort', onAbort, { once: true });
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = performance.now();
  try {
    const res = await fetch(PING_URL, { cache: 'no-store', signal: controller.signal });
    await res.arrayBuffer();
    const elapsed = performance.now() - start - serverTime(res);
    return Math.max(0, Math.round(elapsed * 10) / 10);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', onAbort);
  }
};

const summarise = (samples: LiveSample[]): LiveLatency => {
  const replies = samples.map((s) => s.ms).filter((ms): ms is number => ms !== null);
  const diffs = replies.slice(1).map((ms, i) => Math.abs(ms - replies[i]));
  const mean = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);
  return {
    samples,
    current: [...samples].reverse().find((s) => s.ms !== null)?.ms ?? null,
    average: mean(replies),
    jitter: mean(diffs),
    loss: samples.length ? (samples.length - replies.length) / samples.length : null,
  };
};

/**
 * A continuous ping to the nearest Cloudflare edge, one request a second over
 * a rolling minute. Stops while `paused` (a speed test is running and would
 * skew it) and while the tab is hidden.
 */
export function useLiveLatency(paused: boolean): LiveLatency {
  const [samples, setSamples] = useState<LiveSample[]>([]);

  useEffect(() => {
    if (paused) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const loop = async () => {
      if (controller.signal.aborted) return;
      if (document.visibilityState === 'visible') {
        const ms = await pingOnce(controller.signal);
        if (controller.signal.aborted) return;
        setSamples((prev) => [...prev, { ms }].slice(-WINDOW));
      }
      timer = setTimeout(() => void loop(), INTERVAL_MS);
    };
    void loop();

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [paused]);

  return summarise(samples);
}
