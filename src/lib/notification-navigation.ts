import type { UserRole } from "@/hooks/useRole";
import type { NotificationRow } from "@/lib/admin-dashboard-api";
import { NOTIF_FOCUS_PARAM } from "@/lib/url-deep-link";

function withNotifFocus(href: string): string {
  const sep = href.includes("?") ? "&" : "?";
  return `${href}${sep}${NOTIF_FOCUS_PARAM}=1`;
}

/**
 * Target URL for in-app notifications (uses API `ref_type` / `ref_id`).
 * Appends `nf=1` so the destination highlights the row and does not auto-open editors.
 */
export function getNotificationHref(
  role: UserRole,
  n: Pick<NotificationRow, "ref_type" | "ref_id">,
): string | null {
  const id = n.ref_id;
  if (id == null) return null;
  const rid = String(id);
  const rt = (n.ref_type ?? "").toUpperCase();

  if (rt === "TASK") {
    if (role === "admin") return withNotifFocus(`/admin/tasks?taskId=${rid}`);
    if (role === "BA")
      return withNotifFocus(`/business-analyst/tasks?taskId=${rid}`);
    if (role === "Employee")
      return withNotifFocus(`/employee/tasks?taskId=${rid}`);
    return null;
  }
  if (rt === "PROJECT") {
    if (role === "admin")
      return withNotifFocus(`/admin/projects?projectId=${rid}`);
    if (role === "BA")
      return withNotifFocus(`/business-analyst/projects?projectId=${rid}`);
    return null;
  }
  if (rt === "MILESTONE") {
    if (role === "admin")
      return withNotifFocus(`/admin/milestones?milestoneId=${rid}`);
    if (role === "BA")
      return withNotifFocus(`/business-analyst/milestones?milestoneId=${rid}`);
    return null;
  }
  return null;
}
