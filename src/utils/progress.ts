export function calculateProgress(startDate: string, expectedDate: string) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(expectedDate);

  const total = end.getTime() - start.getTime();
  const current = now.getTime() - start.getTime();

  if (!Number.isFinite(total) || total <= 0) {
    return 0;
  }

  const percent = Math.min(100, Math.max(0, (current / total) * 100));
  return Math.round(percent);
}

export function getProgressColor(percent: number) {
  if (percent <= 10) return "#ef4444";
  if (percent <= 25) return "#f97316";
  if (percent <= 50) return "#eab308";
  if (percent <= 75) return "#3b82f6";
  return "#22c55e";
}

export const getColor = getProgressColor;
