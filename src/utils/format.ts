/**
 * Splits a number into its whole and decimal parts using a single rounding pass,
 * so the two halves can be styled separately without ever disagreeing.
 *
 * Doing `Math.floor(v)` and `Math.round((v % 1) * 10)` independently is unsafe:
 * for 94.96 that yields "94" and "10" — rendered as "94.10".
 */
export const splitNumber = (value: number, digits = 1) => {
  const safe = Number.isFinite(value) ? Math.max(value, 0) : 0;
  const [whole, decimal] = safe.toFixed(digits).split('.');
  return { whole, decimal: decimal ? `.${decimal}` : '' };
};

/** Top of the log scale shared by the dial and the readout bars. */
export const SCALE_CEILING_MBPS = 1000;

/**
 * Maps Mbps onto 0–1 logarithmically, so the low end — where most connections
 * actually sit — gets most of the travel and a gigabit line still fits.
 */
export const toScale = (mbps: number) => {
  if (!Number.isFinite(mbps) || mbps <= 0) return 0;
  const p = Math.log10(1 + mbps) / Math.log10(1 + SCALE_CEILING_MBPS);
  return Math.max(0, Math.min(1, p));
};

/**
 * Formats a speed for display, dropping the decimal once it stops being useful.
 * Rounds to one decimal first — the precision history stores — so a live
 * readout of 213.46 and its saved 213.5 both show as "214", not "213" vs "214".
 */
export const formatMbps = (mbps: number) => {
  const tenths = Math.round((Number.isFinite(mbps) ? Math.max(mbps, 0) : 0) * 10) / 10;
  return tenths >= 100 ? Math.round(tenths).toString() : tenths.toFixed(1);
};

/** "Sep 25, 12:03" from a result's timestamp id, falling back to its stored label. */
export const formatShortDate = (timestamp: number, fallback = '') => {
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const NICE_STEPS = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];

/** Rounds up to a readable number so chart gridlines land on round values. */
export const niceCeil = (value: number) => {
  if (value <= 0) return 10;
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const f = value / exp;
  return (NICE_STEPS.find((s) => f <= s) ?? 10) * exp;
};
