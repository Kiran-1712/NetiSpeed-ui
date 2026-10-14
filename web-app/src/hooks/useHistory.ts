import { useEffect, useState } from 'react';
import { getHistory, type TestResult } from '../utils/history';

/** Saved results, newest first, kept in sync with writes from this and other tabs. */
export function useHistory(): TestResult[] {
  const [history, setHistory] = useState<TestResult[]>(getHistory);

  useEffect(() => {
    const reload = () => setHistory(getHistory());
    window.addEventListener('history_updated', reload);
    window.addEventListener('storage', reload);
    return () => {
      window.removeEventListener('history_updated', reload);
      window.removeEventListener('storage', reload);
    };
  }, []);

  return history;
}
