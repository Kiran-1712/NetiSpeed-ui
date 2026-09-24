import { useMemo } from 'react';
import { History, MapPin, Play, Trash2, X } from 'lucide-react';
import TrendChart from '../components/TrendChart';
import { clearHistory, deleteHistoryItem, qualitySlug, type QualityRating, type TestResult } from '../utils/history';
import { formatMbps, formatShortDate } from '../utils/format';

interface HistoryPageProps {
  history: TestResult[];
  onRunTest: () => void;
  isRunning: boolean;
}

const QUALITY_ORDER: QualityRating[] = ['Excellent', 'Good', 'Fair', 'Poor'];

const average = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);

interface StatProps {
  label: string;
  value: string;
  unit?: string;
  color?: string;
  /** For text values (a date) that would overflow at hero size. */
  small?: boolean;
}

function Stat({ label, value, unit, color, small = false }: StatProps) {
  const pending = value === '—';
  return (
    <div className="stat">
      <span className="stat-label">
        {color && <span className="pillar" style={{ background: color }} />}
        <span className="micro">{label}</span>
      </span>
      <span className={`num ${small ? 'num-sm' : 'num-lg'}${pending ? ' pending' : ''}`}>
        {value}
        {unit && !pending && <span className="unit">{unit}</span>}
      </span>
    </div>
  );
}

export default function HistoryPage({ history, onRunTest, isRunning }: HistoryPageProps) {
  const stats = useMemo(() => {
    if (history.length === 0) return null;
    return {
      download: average(history.map((h) => h.download)),
      upload: average(history.map((h) => h.upload)),
      ping: average(history.map((h) => h.ping)),
      best: Math.max(...history.map((h) => h.download)),
    };
  }, [history]);

  const mix = useMemo(
    () =>
      QUALITY_ORDER.map((quality) => ({
        quality,
        count: history.filter((h) => h.quality === quality).length,
      })),
    [history],
  );

  const handleClearAll = () => {
    if (history.length === 0) return;
    if (!window.confirm(`Delete all ${history.length} saved test results? This cannot be undone.`)) return;
    clearHistory();
  };

  const dash = '—';

  return (
    <div className="page page-history">
      <section className="lead area-lead" aria-label="Summary">
        <div className="lead-head">
          <span className="micro">Saved on this device</span>
          <h1 className="lead-title">History</h1>
        </div>

        <div className="stat-grid">
          <Stat label="Tests" value={String(history.length)} />
          <Stat label="Best" value={stats ? formatMbps(stats.best) : dash} unit="Mbps" />
          <Stat label="Avg download" value={stats ? formatMbps(stats.download) : dash} unit="Mbps" color="var(--dl-a)" />
          <Stat label="Avg upload" value={stats ? formatMbps(stats.upload) : dash} unit="Mbps" color="var(--ul-a)" />
          <Stat label="Avg ping" value={stats ? stats.ping.toFixed(0) : dash} unit="ms" color="var(--ping-a)" />
          <Stat label="Last test" value={history[0] ? formatShortDate(history[0].id, history[0].date) : dash} small />
        </div>

        <div className="mix">
          <span className="micro">Quality mix</span>
          <div className="mix-bar" role="img" aria-label={mix.map((m) => `${m.quality}: ${m.count}`).join(', ')}>
            {history.length > 0 &&
              mix
                .filter((m) => m.count > 0)
                .map((m) => (
                  <span
                    key={m.quality}
                    className={`status-fill ${qualitySlug(m.quality)}`}
                    style={{ flexGrow: m.count }}
                  />
                ))}
          </div>
          <div className="mix-legend">
            {mix.map((m) => (
              <span key={m.quality} className="mix-item">
                <span className={`status-dot ${qualitySlug(m.quality)}`} />
                {m.quality}
                <b>
                  {m.count}
                  {history.length > 0 && (
                    <span className="faint-ink">{Math.round((m.count / history.length) * 100)}%</span>
                  )}
                </b>
              </span>
            ))}
          </div>
        </div>

        <div className="lead-foot">
          <p className="notice">
            Results stay in this browser only. Clearing site data removes them.
          </p>
          <button type="button" className="primary-btn" onClick={onRunTest} disabled={isRunning}>
            {isRunning ? <span className="spinner" /> : <Play size={16} />}
            {isRunning ? 'Test running…' : 'Run new test'}
          </button>
        </div>
      </section>

      <section className="card area-chart" aria-label="Trend">
        <div className="card-head">
          <span className="micro">Trend · last {Math.min(history.length, 30) || 30} tests</span>
          {history.length > 0 && (
            <div className="legend">
              <span><span className="swatch" style={{ background: 'var(--dl-b)' }} /> Download</span>
              <span><span className="swatch" style={{ background: 'var(--ul-b)' }} /> Upload</span>
            </div>
          )}
        </div>
        {history.length > 0 ? (
          <TrendChart items={history} limit={30} />
        ) : (
          <div className="empty">
            <History size={20} />
            <p>Your trend appears here after your first test.</p>
          </div>
        )}
      </section>

      <section className="card area-table" aria-label="All results">
        <div className="card-head">
          <span className="micro">All results</span>
          <button
            type="button"
            className="text-btn danger"
            onClick={handleClearAll}
            disabled={history.length === 0}
          >
            <Trash2 size={13} /> Clear all
          </button>
        </div>

        {history.length === 0 ? (
          <div className="empty">
            <p>No saved results yet.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="results">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Provider</th>
                  <th className="col-type">Type</th>
                  <th className="num-col">
                    <span className="th-long">Download</span>
                    <span className="th-short">Down</span>
                  </th>
                  <th className="num-col">
                    <span className="th-long">Upload</span>
                    <span className="th-short">Up</span>
                  </th>
                  <th className="num-col">Ping</th>
                  <th>Quality</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td className="t-date">{formatShortDate(item.id, item.date)}</td>
                    <td className="t-provider">
                      <span className="t-isp" title={item.isp}>{item.isp}</span>
                      <span className="t-loc" title={item.location}>
                        <MapPin size={10} /> {item.location}
                      </span>
                    </td>
                    <td className="col-type faint">{item.type}</td>
                    <td className="num-col">
                      <span className="t-num">
                        <span className="swatch" style={{ background: 'var(--dl-b)' }} />
                        {formatMbps(item.download)}
                      </span>
                    </td>
                    <td className="num-col">
                      <span className="t-num">
                        <span className="swatch" style={{ background: 'var(--ul-b)' }} />
                        {formatMbps(item.upload)}
                      </span>
                    </td>
                    <td className="num-col faint">{item.ping} ms</td>
                    <td>
                      <span className="h-quality">
                        <span className={`status-dot ${qualitySlug(item.quality)}`} />
                        {item.quality || 'Unknown'}
                      </span>
                    </td>
                    <td className="t-action">
                      <button
                        type="button"
                        className="ghost-btn h-delete"
                        onClick={() => deleteHistoryItem(item.id)}
                        aria-label={`Delete result from ${item.date}`}
                        title="Delete"
                      >
                        <X size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
