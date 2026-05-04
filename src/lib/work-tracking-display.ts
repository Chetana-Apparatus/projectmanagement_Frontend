import type { WorkTrackingRecord } from "@/lib/admin-dashboard-api";
import type { RecentActivityAction } from "@/lib/recent-activity";

/** Backend marks end-of-day / scheduled auto-stop (same as WorkTrackingScreen). */
export function isAutoStopLastSource(
  lastStop: string | null | undefined,
): boolean {
  const last = (lastStop ?? "").trim();
  if (!last) return false;
  if (last === "AUTO_STOP_8PM") return true;
  return /^AUTO_STOP/i.test(last);
}

/**
 * Admin/BA dashboard "live" work table — mirrors employee timer semantics:
 * Running / Paused / Stopped (manual) / Auto stop (backend auto-stop).
 * When `latestActivity` is STOPPED but row is still PAUSED, treat as stopped
 * (same backend quirk as EmployeeTasksProvider).
 */
export function liveWorkStatusFromRecord(
  row: Pick<
    WorkTrackingRecord,
    "timer_state" | "last_stop_source" | "task_status"
  >,
  latestActivity?: RecentActivityAction,
): "Running" | "Paused" | "Stopped" | "Auto stop" {
  const ts = row.timer_state ?? "";
  const taskStatus = (row.task_status ?? "").toUpperCase();
  const last = row.last_stop_source;

  if (
    latestActivity === "STOPPED" &&
    (taskStatus === "PAUSED" || ts === "PAUSED")
  ) {
    return "Stopped";
  }

  if (ts === "STARTED") return "Running";
  if (ts === "PAUSED") return "Paused";
  if (ts === "AUTO_STOPPED") return "Auto stop";
  if (ts === "STOPPED") {
    return isAutoStopLastSource(last) ? "Auto stop" : "Stopped";
  }
  if (!ts && isAutoStopLastSource(last)) return "Auto stop";
  return "Stopped";
}
