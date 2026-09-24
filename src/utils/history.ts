import { formatIsp, formatLocation, getIpInfo } from './network';

export interface TestResult {
  id: number;
  date: string;
  isp: string;
  location: string;
  type: string;
  download: number;
  upload: number;
  ping: number;
  quality: string;
  /** Latency while downloading / uploading, for the bufferbloat grade. Absent on older entries. */
  loadedDown?: number;
  loadedUp?: number;
}

export type QualityRating = 'Excellent' | 'Good' | 'Fair' | 'Poor';

const HISTORY_KEY = 'netispeed_history';
const MAX_ENTRIES = 100;

const HISTORY_UPDATED = 'history_updated';

const isTestResult = (value: unknown): value is TestResult => {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Partial<TestResult>;
  return (
    typeof item.id === 'number' &&
    typeof item.download === 'number' &&
    typeof item.upload === 'number' &&
    typeof item.ping === 'number'
  );
};

/** Fills in fields that older entries may be missing so the table can't crash on them. */
const normalise = (item: TestResult): TestResult => ({
  ...item,
  date: item.date || new Date(item.id).toLocaleString(),
  isp: item.isp || 'Unknown',
  location: item.location || 'Unknown',
  type: item.type || 'Unknown',
  quality: item.quality || rateQuality(item.download, item.upload, item.ping),
});

export const getHistory = (): TestResult[] => {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    if (!data) return [];
    const parsed: unknown = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTestResult).map(normalise);
  } catch {
    return [];
  }
};

const writeHistory = (history: TestResult[]) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_ENTRIES)));
  } catch (err) {
    // Quota exceeded or storage disabled (private mode) — the UI still works without persistence.
    console.error('Failed to persist history', err);
  }
  window.dispatchEvent(new Event(HISTORY_UPDATED));
};

export const rateQuality = (download: number, upload: number, ping: number): QualityRating => {
  if (download < 10 || upload < 2 || ping > 200) return 'Poor';
  if (download > 100 && upload > 20 && ping < 50) return 'Excellent';
  if (download > 50 && upload > 10 && ping < 100) return 'Good';
  return 'Fair';
};

const inferConnectionType = (download: number, ping: number) => {
  if (ping < 20 && download > 200) return 'Fiber';
  if (download > 50) return 'Cable';
  if (download > 20) return '5G/LTE';
  return 'Unknown';
};

const round = (value: number, digits = 1) =>
  Number.isFinite(value) ? Number.parseFloat(Math.max(value, 0).toFixed(digits)) : 0;

export const saveTestResult = async (result: Partial<TestResult>) => {
  try {
    let isp = result.isp;
    let location = result.location;

    if (!isp || !location) {
      try {
        const info = await getIpInfo();
        isp = isp || formatIsp(info.org);
        location = location || formatLocation(info) || 'Unknown';
      } catch (err) {
        console.error('Could not resolve ISP/location for history entry', err);
      }
    }

    const download = round(result.download ?? 0);
    const upload = round(result.upload ?? 0);
    const ping = round(result.ping ?? 0);

    // Note: the caller-supplied fields are spread first so the derived values
    // below always win — the reverse order silently discarded the rounding.
    const newResult: TestResult = {
      ...result,
      id: Date.now(),
      date: new Date().toLocaleString([], {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      isp: isp || 'Unknown',
      location: location || 'Unknown',
      type: result.type || inferConnectionType(download, ping),
      download,
      upload,
      ping,
      quality: result.quality || rateQuality(download, upload, ping),
    };

    writeHistory([newResult, ...getHistory()]);
  } catch (err) {
    console.error('Failed to save history', err);
  }
};

export const clearHistory = () => {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (err) {
    console.error('Failed to clear history', err);
  }
  window.dispatchEvent(new Event(HISTORY_UPDATED));
};

export const deleteHistoryItem = (id: number) => {
  writeHistory(getHistory().filter((item) => item.id !== id));
};

const QUALITY_SLUGS = new Set(['excellent', 'good', 'fair', 'poor']);

/** Only known ratings get a status class, so unexpected values can't break styling. */
export const qualitySlug = (quality?: string) => {
  const slug = (quality || '').toLowerCase();
  return QUALITY_SLUGS.has(slug) ? slug : '';
};
