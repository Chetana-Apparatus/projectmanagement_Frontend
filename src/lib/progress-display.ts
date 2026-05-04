/**
 * Server progress can be fractional (e.g. 0.31 for 3 minutes of 16h planned).
 * Rounding to an integer shows 0% — use these helpers for labels and Ant Progress.
 */

export function clampProgress(percent: number | null | undefined): number {
  if (percent == null || Number.isNaN(percent)) return 0;
  return Math.max(0, Math.min(100, percent));
}

/** Value for Ant Design Progress: keep &lt;1% so the bar is not collapsed to 0. */
export function progressBarValue(percent: number | null | undefined): number {
  const v = clampProgress(percent);
  if (v > 0 && v < 1) return Number(v.toFixed(2));
  return Math.round(v);
}

/** Human-readable label (avoids showing 0% when value is small but positive). */
export function formatProgressLabel(
  percent: number | null | undefined,
): string {
  const v = clampProgress(percent);
  if (v <= 0) return "0%";
  if (v < 0.01) return `${v.toFixed(2)}%`;
  if (v < 1) return `${v.toFixed(1)}%`;
  return `${Math.round(v)}%`;
}
