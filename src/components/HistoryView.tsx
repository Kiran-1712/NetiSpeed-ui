import { useState, useEffect, useCallback } from 'react';
import { Trash2, Calendar, MapPin, Zap } from 'lucide-react';
import { getHistory, clearHistory, deleteHistoryItem } from '../utils/history';
import type { TestResult } from '../utils/history';

const QUALITY_CLASSES = new Set(['excellent', 'good', 'fair', 'poor']);

/** Only known ratings get a colour class, so unexpected values can't break styling. */
const qualityClass = (quality?: string) => {
  const slug = (quality || '').toLowerCase();
  return QUALITY_CLASSES.has(slug) ? `badge ${slug}` : 'badge';
};

export default function HistoryView() {
  const [history, setHistory] = useState<TestResult[]>(getHistory);

  const loadHistory = useCallback(() => {
    setHistory(getHistory());
  }, []);

  useEffect(() => {
    window.addEventListener('history_updated', loadHistory);
    // Keep other tabs of the app in sync when one of them writes.
    window.addEventListener('storage', loadHistory);
    return () => {
      window.removeEventListener('history_updated', loadHistory);
      window.removeEventListener('storage', loadHistory);
    };
  }, [loadHistory]);

  const handleClearAll = () => {
    if (history.length === 0) return;
    if (!window.confirm(`Delete all ${history.length} saved test results? This cannot be undone.`)) return;
    clearHistory();
  };

  const handleDeleteItem = (id: number) => {
    deleteHistoryItem(id);
  };

  return (
    <div className="fade-in glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2>Test History</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Review and manage your past speed tests</p>
        </div>
        <button className="btn btn-danger" onClick={handleClearAll} disabled={history.length === 0}>
          <Trash2 size={16} /> Clear All
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>ISP & Location</th>
              <th>Connection</th>
              <th>Download</th>
              <th>Upload</th>
              <th>Ping</th>
              <th>Quality</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  No test history found
                </td>
              </tr>
            ) : history.map(item => (
              <tr key={item.id}>
                <td data-label="Date & Time">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={14} style={{ color: 'var(--text-secondary)' }} />
                    {item.date}
                  </div>
                </td>
                <td data-label="ISP & Location">
                  <div style={{ fontWeight: 500 }}>{item.isp}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={10} /> {item.location}
                  </div>
                </td>
                <td data-label="Connection">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={14} style={{ color: 'var(--text-secondary)' }} />
                    {item.type}
                  </div>
                </td>
                <td data-label="Download" style={{ color: 'var(--download-color)', fontWeight: 600 }}>{(item.download).toFixed(2)} <span style={{ fontSize: '12px', fontWeight: 400 }}>Mbps</span></td>
                <td data-label="Upload" style={{ color: 'var(--upload-color)', fontWeight: 600 }}>{(item.upload).toFixed(2)} <span style={{ fontSize: '12px', fontWeight: 400 }}>Mbps</span></td>
                <td data-label="Ping" style={{ color: 'var(--text-primary)' }}>{item.ping}ms</td>
                <td data-label="Quality">
                  <span className={qualityClass(item.quality)}>{item.quality || 'Unknown'}</span>
                </td>
                <td>
                  <button className="btn" style={{ padding: '6px' }} onClick={() => handleDeleteItem(item.id)} title="Delete" aria-label={`Delete result from ${item.date}`}>
                    <Trash2 size={14} style={{ color: 'var(--ping-color)' }} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
