import { ArrowUpRight, History } from 'lucide-react';
import { hrefFor } from '../hooks/useRoute';
import type { TestResult } from '../utils/history';
import { qualitySlug } from '../utils/history';
import { formatMbps, formatShortDate } from '../utils/format';

/** The most recent saved result, with the way through to the full history. */
export default function LastTestCard({ history }: { history: TestResult[] }) {
  const last = history[0];

  return (
    <section className="card area-last" data-sub="network" aria-label="Last test">
      <div className="card-head">
        <span className="micro">Last test</span>
        <a className="ghost-btn" href={hrefFor('history')} aria-label="Open history" title="Open history">
          <ArrowUpRight size={14} />
        </a>
      </div>

      {last ? (
        <>
          <div className="last-pair">
            <div>
              <span className="last-label">
                <span className="swatch" style={{ background: 'var(--dl-b)' }} /> Down
              </span>
              <span className="last-value">
                {formatMbps(last.download)}
                <span className="unit">Mbps</span>
              </span>
            </div>
            <div>
              <span className="last-label">
                <span className="swatch" style={{ background: 'var(--ul-b)' }} /> Up
              </span>
              <span className="last-value">
                {formatMbps(last.upload)}
                <span className="unit">Mbps</span>
              </span>
            </div>
          </div>
          <div className="last-foot">
            <span className="h-quality">
              <span className={`status-dot ${qualitySlug(last.quality)}`} />
              {last.quality}
            </span>
            <span className="faint">{formatShortDate(last.id, last.date)}</span>
          </div>
        </>
      ) : (
        <div className="empty">
          <History size={18} />
          <p>No tests yet. Results are saved on this device.</p>
        </div>
      )}
    </section>
  );
}
