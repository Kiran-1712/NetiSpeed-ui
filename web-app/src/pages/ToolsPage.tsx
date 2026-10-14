import { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, ArrowRight, FileText, Globe, ShieldCheck, type LucideIcon } from 'lucide-react';
import { IPINFO_BASE, formatIsp, getIpInfo, parseHostTarget, type IpInfo } from '../utils/network';
import type { NetworkInfo } from '../hooks/useNetworkInfo';

type ToolType = 'ip' | 'ping' | 'dns' | 'port';

const PING_ATTEMPTS = 4;
const PING_INTERVAL_MS = 1000;
const PORT_TIMEOUT_MS = 1500;
const DEFAULT_PORTS = [21, 22, 80, 443, 8080];
const DNS_RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS'] as const;

const DNS_TYPE_NAMES: Record<number, string> = {
  1: 'A',
  2: 'NS',
  5: 'CNAME',
  6: 'SOA',
  12: 'PTR',
  15: 'MX',
  16: 'TXT',
  28: 'AAAA',
  33: 'SRV',
  257: 'CAA',
};

const SERVICE_NAMES: Record<number, string> = {
  21: 'FTP',
  22: 'SSH',
  25: 'SMTP',
  53: 'DNS',
  80: 'HTTP',
  110: 'POP3',
  143: 'IMAP',
  443: 'HTTPS',
  3306: 'MySQL',
  5432: 'PostgreSQL',
  8080: 'HTTP-Alt',
  8443: 'HTTPS-Alt',
};

const getDnsType = (id: number) => DNS_TYPE_NAMES[id] ?? `TYPE${id}`;
const getService = (port: number) => SERVICE_NAMES[port] ?? 'Unknown';

interface DnsAnswer {
  name?: string;
  type: number;
  data: string;
  TTL: number;
}

/** Rejects after `ms`, and always clears its own timer so nothing outlives the run. */
const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Timeout')), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
};

const delay = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    }
    signal.addEventListener('abort', onAbort, { once: true });
  });

export default function ToolsPage({ net }: { net: NetworkInfo }) {
  const [activeTool, setActiveTool] = useState<ToolType>('ip');
  const [target, setTarget] = useState('');
  const [results, setResults] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  // Abort any run still in flight when the component goes away.
  useEffect(() => () => abortRef.current?.abort(), []);

  const selectTool = (tool: ToolType) => {
    abortRef.current?.abort();
    setActiveTool(tool);
    setResults(null);
    setIsLoading(false);
  };

  const runIpLookup = useCallback(async (host: string, signal: AbortSignal) => {
    // `me` (and an empty box) resolves the caller's own address; that lookup is
    // shared with the dashboard so it doesn't burn a second rate-limited call.
    const isSelf = !host || host.toLowerCase() === 'me';
    let data: IpInfo;

    if (isSelf) {
      data = await getIpInfo();
    } else {
      const res = await fetch(`${IPINFO_BASE}/${encodeURIComponent(host)}/json`, { signal });
      if (!res.ok) throw new Error(`ipinfo.io responded with ${res.status}`);
      data = (await res.json()) as IpInfo;
    }

    if (data.bogon) {
      return `Results for ${data.ip || host}:\nPrivate, reserved or local address (bogon) — no public registry data.`;
    }

    return [
      `Results for ${data.ip || host}:`,
      `ASN:      ${formatIsp(data.org)}`,
      `Location: ${[data.city, data.region, data.country].filter(Boolean).join(', ') || 'Unknown'}`,
      `Coords:   ${data.loc || 'Unknown'}`,
      `Timezone: ${data.timezone || 'Unknown'}`,
    ].join('\n');
  }, []);

  const runPing = useCallback(
    async (host: string, signal: AbortSignal, onProgress: (partial: string) => void) => {
      let logs = `HTTP pinging ${host}...\n(measures round trip of an HTTPS request, not ICMP)\n\n`;
      const times: number[] = [];
      let sent = 0;

      for (let i = 0; i < PING_ATTEMPTS; i++) {
        sent++;
        // performance.now() is monotonic and, unlike Date.now(), is not affected
        // by clock adjustments mid-measurement.
        const start = performance.now();
        try {
          await fetch(`https://${host}`, { mode: 'no-cors', cache: 'no-store', signal });
          const ms = Math.round(performance.now() - start);
          times.push(ms);
          logs += `Reply from ${host}: time=${ms}ms\n`;
        } catch (err) {
          if (signal.aborted) throw err;
          logs += `Request to ${host} failed or was blocked.\n`;
        }
        onProgress(logs);
        if (i < PING_ATTEMPTS - 1) await delay(PING_INTERVAL_MS, signal);
      }

      logs += `\nHTTP ping statistics for ${host}:\n`;
      logs += `Packets: Sent = ${sent}, Received = ${times.length}, Lost = ${sent - times.length}\n`;

      if (times.length > 0) {
        const min = Math.min(...times);
        const max = Math.max(...times);
        const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        logs += `Approximate round trip times:\nMinimum = ${min}ms, Maximum = ${max}ms, Average = ${avg}ms`;
      } else {
        logs += '(Host may not serve HTTPS, or the request was blocked by CORS/network policy.)';
      }

      return logs;
    },
    [],
  );

  const runDnsLookup = useCallback(async (host: string, signal: AbortSignal) => {
    // Query each record type explicitly: `type=ANY` is refused or answered with
    // an RFC 8482 HINFO placeholder by most modern resolvers.
    const responses = await Promise.all(
      DNS_RECORD_TYPES.map(async (type) => {
        try {
          const res = await fetch(
            `https://dns.google/resolve?name=${encodeURIComponent(host)}&type=${type}`,
            { signal },
          );
          if (!res.ok) return null;
          const body = (await res.json()) as { Answer?: DnsAnswer[] };
          return body.Answer ?? null;
        } catch (err) {
          if (signal.aborted) throw err;
          return null;
        }
      }),
    );

    const seen = new Set<string>();
    const rows: string[] = [];
    for (const answers of responses) {
      for (const record of answers ?? []) {
        const typeStr = getDnsType(record.type);
        const key = `${typeStr}|${record.data}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push(`${typeStr.padEnd(6)}${record.data}\t(TTL ${record.TTL})`);
      }
    }

    if (rows.length === 0) return `No DNS records found for ${host}`;
    return `DNS records for ${host}:\n\n${rows.join('\n')}`;
  }, []);

  const runPortCheck = useCallback(
    async (
      host: string,
      requestedPort: number | undefined,
      signal: AbortSignal,
      onProgress: (partial: string) => void,
    ) => {
      const ports = requestedPort ? [requestedPort] : DEFAULT_PORTS;
      let logs = `Port check for ${host} (HTTP-based inference):\n\n`;

      // A browser cannot open raw sockets, so this only infers reachability from
      // an opaque HTTP request. On an HTTPS page, plain-http probes are blocked
      // outright by the mixed-content policy — say so rather than report "closed".
      const pageIsSecure = window.location.protocol === 'https:';

      for (const port of ports) {
        const scheme = port === 443 || port === 8443 ? 'https' : 'http';
        const label = `${port} (${getService(port)})`.padEnd(22);

        if (scheme === 'http' && pageIsSecure) {
          logs += `${label}INCONCLUSIVE (blocked: mixed content)\n`;
          onProgress(logs);
          continue;
        }

        const probe = fetch(`${scheme}://${host}:${port}`, { mode: 'no-cors', signal });
        // Attach a no-op handler so a late rejection after the timeout wins
        // doesn't surface as an unhandled promise rejection.
        probe.catch(() => {});

        try {
          await withTimeout(probe, PORT_TIMEOUT_MS);
          logs += `${label}RESPONDED\n`;
        } catch (err) {
          if (signal.aborted) throw err;
          logs += (err as Error).message === 'Timeout'
            ? `${label}TIMEOUT (filtered or no response)\n`
            : `${label}NO RESPONSE (closed, refused or blocked)\n`;
        }
        onProgress(logs);
      }

      logs += '\nNote: browsers cannot open raw sockets, so results are inferred from HTTP reachability.';
      return logs;
    },
    [],
  );

  const runTest = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = target.trim();
    const needsHost = activeTool !== 'ip';
    if (needsHost && !trimmed) return;

    const parsed = parseHostTarget(trimmed);
    if (needsHost && !parsed) {
      setResults(`"${trimmed}" is not a valid host name or IP address.`);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    setIsLoading(true);
    setResults(null);

    const onProgress = (partial: string) => {
      if (!signal.aborted) setResults(`${partial}\n...`);
    };

    const host = parsed?.host ?? trimmed;

    try {
      let logs: string;
      switch (activeTool) {
        case 'ip':
          logs = await runIpLookup(host, signal);
          break;
        case 'ping':
          logs = await runPing(host, signal, onProgress);
          break;
        case 'dns':
          logs = await runDnsLookup(host, signal);
          break;
        case 'port':
          logs = await runPortCheck(host, parsed?.port, signal, onProgress);
          break;
      }
      if (!signal.aborted) setResults(logs);
    } catch (err) {
      if (signal.aborted) return; // superseded or unmounted — leave the UI alone
      const message = err instanceof Error ? err.message : 'Unknown error';
      setResults(`Error executing ${activeTool} test on ${trimmed || 'this connection'}:\n${message}`);
    } finally {
      if (!signal.aborted) setIsLoading(false);
    }
  };

  const tools: {
    id: ToolType;
    label: string;
    icon: LucideIcon;
    placeholder: string;
    description: string;
    examples: string[];
  }[] = [
    {
      id: 'ip',
      label: 'IP lookup',
      icon: Globe,
      placeholder: 'IP address, or leave empty for yours',
      description: 'Geolocation and ASN for any public IP address.',
      examples: ['me', '8.8.8.8', '1.1.1.1'],
    },
    {
      id: 'ping',
      label: 'Ping',
      icon: Activity,
      placeholder: 'Domain or IP, e.g. google.com',
      description: 'HTTPS round-trip time and request loss to a host.',
      examples: ['google.com', 'cloudflare.com', 'github.com'],
    },
    {
      id: 'dns',
      label: 'DNS lookup',
      icon: FileText,
      placeholder: 'Domain, e.g. example.com',
      description: 'A, AAAA, CNAME, MX, TXT and NS records for a domain.',
      examples: ['google.com', 'github.com', 'example.com'],
    },
    {
      id: 'port',
      label: 'Port check',
      icon: ShieldCheck,
      placeholder: 'Host, optionally with a port, e.g. example.com:8080',
      description: 'Whether common ports on a host answer an HTTP request.',
      examples: ['example.com', 'github.com:443', 'google.com'],
    },
  ];

  const current = tools.find((tool) => tool.id === activeTool) ?? tools[0];
  const CurrentIcon = current.icon;

  return (
    <div className="page page-tools">
      <section className="lead area-lead" aria-label="Choose a tool">
        <div className="lead-head">
          <span className="micro">Diagnostics</span>
          <h1 className="lead-title">Tools</h1>
        </div>

        <div className="tool-list" role="tablist" aria-label="Diagnostic tool" aria-orientation="vertical">
          {tools.map(({ id, label, icon: Icon, description }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTool === id}
              className={`tool-item${activeTool === id ? ' active' : ''}`}
              onClick={() => selectTool(id)}
            >
              <span className="tool-icon">
                <Icon size={16} />
              </span>
              <span className="tool-text">
                <span className="tool-name">{label}</span>
                <span className="tool-desc">{description}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="conn">
          <span className="micro">Your connection</span>
          <span className="conn-ip" title={net.ipv4}>{net.ipv4}</span>
          <span className="conn-meta" title={net.isp}>{net.isp}</span>
          <span className="conn-meta" title={net.location}>{net.location}</span>
        </div>

        <p className="notice lead-note">
          Browsers can’t send ICMP or open raw sockets, so ping and port checks are inferred from HTTPS requests.
        </p>
      </section>

      <section className="card area-work" aria-label={current.label}>
        <div className="work-head">
          <span className="icon-disc light">
            <CurrentIcon size={16} />
          </span>
          <div>
            <h2 className="work-title">{current.label}</h2>
            <p className="work-desc">{current.description}</p>
          </div>
        </div>

        <form onSubmit={runTest} className="tool-form">
          <input
            type="text"
            className="input"
            placeholder={current.placeholder}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            aria-label={`${current.label} target`}
          />
          <button
            type="submit"
            className="run-btn"
            disabled={isLoading || (activeTool !== 'ip' && !target.trim())}
          >
            {isLoading ? <span className="spinner" /> : <ArrowRight size={16} />}
            Run
          </button>
        </form>

        <div className="examples">
          <span className="micro">Try</span>
          {current.examples.map((example) => (
            <button key={example} type="button" className="example" onClick={() => setTarget(example)}>
              {example}
            </button>
          ))}
        </div>

        <div className="tool-output" aria-live="polite">
          {results ? (
            <pre className="mono">{results}</pre>
          ) : (
            <div className="empty">
              {isLoading ? <span className="spinner" /> : <CurrentIcon size={20} />}
              <p>{isLoading ? 'Running…' : 'Results appear here.'}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
