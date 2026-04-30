import { apiFetch } from "@/lib/api-client";

export type AdminDashboardPayload = {
  filters?: {
    project_id?: number | null;
    milestone_id?: number | null;
    task_id?: number | null;
  };
  overview?: {
    users_count?: number;
    ba_count?: number;
    employee_count?: number;
    projects_count?: number;
    tasks_count?: number;
    active_timers?: number;
  };
  task_status_counts?: Record<string, number>;
  projects?: Array<{
    id: number;
    name: string;
    status: string;
    start_date: string;
    deadline: string;
  }>;
  milestones?: Array<{
    id: number;
    milestone_no: number;
    name: string;
    project_id: number;
    status: string;
    start_date: string;
    end_date: string;
  }>;
  tasks?: Array<{
    id: number;
    title: string;
    project_id: number;
    project_name?: string;
    milestone_name?: string | null;
    status: string;
  }>;
};

export type WorkTrackingHistory = {
  start_count?: number;
  pause_count?: number;
  stop_count?: number;
  auto_stop_count?: number;
};

export type WorkTrackingRecord = {
  employee_id?: number;
  employee_name: string;
  employee_email?: string;
  project_id: number;
  project_name: string;
  milestone_id?: number | null;
  milestone_no?: number | null;
  milestone_name?: string | null;
  task_id: number;
  task_title: string;
  task_status?: string;
  timer_state: string;
  current_session_start_time?: string | null;
  current_session_seconds?: number;
  current_session_display?: string;
  last_session_end_time?: string | null;
  last_session_start_time?: string | null;
  last_stop_source?: string | null;
  today_worked_display?: string;
  total_time_spent_display?: string;
  history?: WorkTrackingHistory;
};

export type WorkTrackingPayload = {
  summary?: {
    records_count?: number;
    started_count?: number;
    paused_count?: number;
    stopped_count?: number;
    not_started_count?: number;
    delayed_count?: number;
    completed_count?: number;
    auto_stopped_count?: number;
  };
  work_tracking?: WorkTrackingRecord[];
  recent_activity?: Array<{
    action: "STARTED" | "PAUSED" | "STOPPED" | "COMPLETED";
    employee_name: string;
    task_id: number;
    task_title: string;
    project_name: string;
    timestamp: string;
  }>;
};

export async function fetchAdminDashboard(): Promise<AdminDashboardPayload> {
  const res = await apiFetch<AdminDashboardPayload>("/api/v1/admin/dashboard", {
    method: "GET",
  });
  if (!res.success || !res.data) {
    throw new Error(res.message || "Failed to load dashboard");
  }
  return res.data;
}

export type BADashboardPayload = AdminDashboardPayload & {
  tasks_created?: number;
  tasks_completed?: number;
  tasks_in_progress?: number;
  tasks_delayed?: number;
  assigned_employees?: number;
  employee_summary?: Array<{
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    assigned_tasks: number;
    completed_tasks: number;
    in_progress_tasks: number;
    delayed_tasks: number;
  }>;
  recent_activity?: WorkTrackingPayload["recent_activity"];
};

export async function fetchBADashboard(): Promise<BADashboardPayload> {
  const res = await apiFetch<BADashboardPayload>("/api/v1/ba/dashboard", {
    method: "GET",
  });
  if (!res.success || !res.data) {
    throw new Error(res.message || "Failed to load BA dashboard");
  }
  return res.data;
}

export async function fetchWorkTracking(
  query?: Record<string, string | undefined>,
): Promise<WorkTrackingPayload> {
  const sp = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") sp.set(key, value);
    }
  }
  const qs = sp.toString();
  const path = qs ? `/api/v1/work-tracking?${qs}` : "/api/v1/work-tracking";
  const res = await apiFetch<WorkTrackingPayload>(path, {
    method: "GET",
  });
  if (!res.success || !res.data) {
    throw new Error(res.message || "Failed to load work tracking");
  }
  return res.data;
}

export type NotificationRow = {
  id: number;
  type: string;
  title: string;
  message?: string;
  created_at?: string;
  is_read?: boolean;
  ref_type?: string;
  ref_id?: number;
};

/** Paginated list (`StandardResultsSetPagination`). */
export async function fetchRecentNotifications(
  limit = 10,
): Promise<NotificationRow[]> {
  const res = await apiFetch<{ results?: NotificationRow[] }>(
    `/api/v1/notifications/?page_size=${limit}`,
    { method: "GET" },
  );
  if (!res.success || !res.data?.results) {
    return [];
  }
  return res.data.results;
}
