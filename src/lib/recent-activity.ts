import type { WorkTrackingPayload } from "@/lib/admin-dashboard-api";

/** Same `action` values as `/work-tracking` `recent_activity` (and employee dashboard feed). */
export type RecentActivityAction = NonNullable<
  WorkTrackingPayload["recent_activity"]
>[number]["action"];

/**
 * Per task_id, the most recent activity (by timestamp). Used to disambiguate
 * `PAUSED` task rows: backend often maps **stop** to `PAUSED`, but activity
 * still records `STOPPED` (see EmployeeTasksProvider).
 */
export function buildLatestActivityByTaskId(
  rows: WorkTrackingPayload["recent_activity"] | undefined,
): Partial<Record<string, RecentActivityAction>> {
  if (!rows?.length) return {};
  const sorted = [...rows].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const map: Partial<Record<string, RecentActivityAction>> = {};
  for (const row of sorted) {
    const id = String(row.task_id);
    if (map[id] === undefined) map[id] = row.action;
  }
  return map;
}
