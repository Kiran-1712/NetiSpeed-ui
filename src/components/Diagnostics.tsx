import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Globe, Activity, FileText, ShieldAlert } from 'lucide-react';
import { IPINFO_BASE, formatIsp, getIpInfo, parseHostTarget, type IpInfo } from '../utils/network';

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

export default function Diagnostics() {
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

  const getPlaceholder = () => {
    switch (activeTool) {
      case 'ip': return 'Enter an IP address, or "me" for your own (e.g., 8.8.8.8)...';
      case 'ping': return 'Enter a domain or IP (e.g., google.com)...';
      case 'dns': return 'Enter a domain (e.g., example.com)...';
      case 'port': return 'Enter a host, optionally with a port (e.g., example.com:8080)...';
      default: return '';
    }
  };

  const getIcon = () => {
    switch (activeTool) {
      case 'ip': return <Globe size={18} />;
      case 'ping': return <Activity size={18} />;
      case 'dns': return <FileText size={18} />;
      case 'port': return <ShieldAlert size={18} />;
    }
  };

  const tools: { id: ToolType; label: string; icon: React.ReactNode }[] = [
    { id: 'ip', label: 'IP Lookup', icon: <Globe size={16} /> },
    { id: 'ping', label: 'Ping Test', icon: <Activity size={16} /> },
    { id: 'dns', label: 'DNS Lookup', icon: <FileText size={16} /> },
    { id: 'port', label: 'Port Checker', icon: <ShieldAlert size={16} /> },
  ];

  const titles: Record<ToolType, string> = {
    ip: 'IP Lookup',
    ping: 'Ping Test',
    dns: 'DNS Lookup',
    port: 'Port Checker',
  };

  const descriptions: Record<ToolType, string> = {
    ip: 'Retrieve geolocation and ASN information for any public IP address.',
    ping: 'Measure HTTPS round-trip time and request loss to a specific host.',
    dns: 'Fetch DNS records (A, AAAA, CNAME, MX, TXT, NS) for a domain.',
    port: 'Infer whether common ports on a host respond to an HTTP request.',
  };

  return (
    <div className="fade-in glass-panel responsive-split" style={{ padding: 0, overflow: 'hidden' }}>

      {/* Sidebar Tool Selector */}
      <div className="split-sidebar">
        <h3 style={{ marginBottom: '20px', fontSize: '16px', color: 'var(--text-secondary)' }}>Diagnostic Tools</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              className={`btn ${activeTool === tool.id ? 'active' : ''}`}
              style={{
                justifyContent: 'flex-start',
                background: activeTool === tool.id ? 'var(--panel-border)' : 'transparent',
                border: 'none',
              }}
              aria-pressed={activeTool === tool.id}
              onClick={() => selectTool(tool.id)}
            >
              {tool.icon} {tool.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tool Area */}
      <div className="split-content">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          {getIcon()}
          {titles[activeTool]}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
          {descriptions[activeTool]}
        </p>

        <form onSubmit={runTest} className="input-group" style={{ marginBottom: '30px' }}>
          <input
            type="text"
            className="input"
            placeholder={getPlaceholder()}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            aria-label={`${titles[activeTool]} target`}
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '12px 24px' }}
            disabled={isLoading || (activeTool !== 'ip' && !target.trim())}
          >
            {isLoading ? <div className="loader" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> : <Search size={18} />}
            Run Test
          </button>
        </form>

        <div style={{ minHeight: '300px' }}>
          {isLoading && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              <div className="loader" /> Executing {activeTool} command...
            </div>
          )}

          {results && (
            <div style={{
              background: 'var(--card-bg)',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid var(--panel-border)',
              fontFamily: 'var(--mono-font)',
              fontSize: '13px',
              whiteSpace: 'pre-wrap',
              overflowX: 'auto',
              color: 'var(--jitter-color)',
              lineHeight: '1.6'
            }} className="fade-in">
              {results}
            </div>
          )}

          {!isLoading && !results && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '300px',
              color: 'var(--text-secondary)',
              border: '1px dashed var(--panel-border)',
              borderRadius: '8px'
            }}>
              {getIcon()}
              <p style={{ marginTop: '12px' }}>Enter a target above to see results.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
