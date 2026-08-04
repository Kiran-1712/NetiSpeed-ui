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
