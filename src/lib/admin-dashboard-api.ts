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

export type WorkTrackingPayload = {
  summary?: {
    records_count?: number;
    started_count?: number;
    paused_count?: number;
    stopped_count?: number;
  };
  work_tracking?: Array<{
    employee_name: string;
    task_title: string;
    project_name: string;
    milestone_name?: string | null;
    timer_state: string;
    task_status?: string;
    today_worked_display?: string;
    total_time_spent_display?: string;
    current_session_start_time?: string | null;
    current_session_display?: string;
  }>;
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

export async function fetchWorkTracking(): Promise<WorkTrackingPayload> {
  const res = await apiFetch<WorkTrackingPayload>("/api/v1/work-tracking", {
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
