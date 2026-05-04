"use client";

import {
  CalendarClock,
  CircleCheck,
  FolderPlus,
  ListChecks,
  UserRoundCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import ActivityLog, {
  type ActivityLogItem,
} from "@/components/common/activity/ActivityLog";
import Card from "@/components/common/card/Card";
import DashboardCard from "@/components/common/dashboard/DashboardCard";
import DataTable, {
  type DataTableColumn,
} from "@/components/common/table/DataTable";
import {
  type BADashboardPayload,
  fetchBADashboard,
  fetchWorkTracking,
  type WorkTrackingPayload,
} from "@/lib/admin-dashboard-api";

type ProjectOverviewRow = {
  id: string;
  projectName: string;
  milestone: string;
  taskSummary: string;
  status:
    | "Not Started"
    | "In Progress"
    | "Paused"
    | "Stopped"
    | "Delayed"
    | "Completed";
};

type WorkTrackingRow = {
  id: string;
  employee: string;
  currentFocus: string;
  status: "Running" | "Paused" | "Stopped" | "Auto stop";
};

function pickPrimaryMilestone(
  projectId: number,
  milestones: NonNullable<BADashboardPayload["milestones"]>,
) {
  const list = milestones
    .filter((m) => m.project_id === projectId)
    .sort((a, b) => b.milestone_no - a.milestone_no);
  if (list.length === 0) return null;
  const active = list.find((m) => m.status === "IN_PROGRESS");
  if (active) return active;
  const openish = list.find(
    (m) => m.status === "NOT_STARTED" || m.status === "DELAYED",
  );
  return openish ?? list[0];
}

function mapProjectsToOverview(
  payload: BADashboardPayload,
): ProjectOverviewRow[] {
  const projects = payload.projects ?? [];
  const milestones = payload.milestones ?? [];
  const tasks = payload.tasks ?? [];

  return projects.map((p) => {
    const ms = pickPrimaryMilestone(p.id, milestones);
    const delayed = p.status === "DELAYED" || ms?.status === "DELAYED";
    const projectMilestones = milestones.filter((m) => m.project_id === p.id);
    const completedMilestones = projectMilestones.filter(
      (m) => m.status === "COMPLETED",
    ).length;
    const projectTasks = tasks.filter((t) => t.project_id === p.id);
    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(
      (task) => task.status === "COMPLETED",
    ).length;
    const inProgressTasks = projectTasks.filter(
      (task) => task.status === "IN_PROGRESS",
    ).length;
    const delayedTasks = projectTasks.filter(
      (task) => task.status === "DELAYED",
    ).length;

    const pausedTasks = projectTasks.filter(
      (task) => task.status === "PAUSED",
    ).length;
    const stoppedTasks = projectTasks.filter(
      (task) => task.status === "BLOCKED",
    ).length;
    const status: ProjectOverviewRow["status"] =
      totalTasks === 0
        ? "Not Started"
        : completedTasks === totalTasks
          ? "Completed"
          : delayedTasks > 0 || delayed
            ? "Delayed"
            : inProgressTasks > 0
              ? "In Progress"
              : pausedTasks > 0
                ? "Paused"
                : stoppedTasks > 0
                  ? "Stopped"
                  : completedTasks > 0
                    ? "In Progress"
                    : "Not Started";

    return {
      id: String(p.id),
      projectName: p.name,
      milestone: ms ? `M${ms.milestone_no}: ${ms.name}` : "—",
      taskSummary: `${completedTasks}/${totalTasks} completed · ${inProgressTasks} in progress · ${pausedTasks} paused · ${stoppedTasks} stopped · ${delayedTasks} delayed · ${completedMilestones}/${projectMilestones.length} milestones done`,
      status,
    };
  });
}

function mapWorkTracking(
  rows: WorkTrackingPayload["work_tracking"],
): WorkTrackingRow[] {
  if (!rows?.length) return [];
  return rows
    .map((row, idx): WorkTrackingRow | null => {
      const taskStatus = (row.task_status ?? "").toUpperCase();
      if (taskStatus === "COMPLETED" || taskStatus === "NOT_STARTED") {
        return null;
      }
      const ts = row.timer_state ?? "";
      const status: WorkTrackingRow["status"] =
        ts === "STARTED"
          ? "Running"
          : ts === "PAUSED"
            ? "Paused"
            : ts === "AUTO_STOPPED"
              ? "Auto stop"
              : "Stopped";
      return {
        id: `wk-${idx}-${row.task_title}`,
        employee: row.employee_name,
        currentFocus: `${row.task_title} · ${row.project_name}`,
        status,
      };
    })
    .filter((row): row is WorkTrackingRow => row !== null);
}

function formatActivityTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapNotificationsToActivity(
  rows: WorkTrackingPayload["recent_activity"],
): ActivityLogItem[] {
  if (!rows?.length) return [];
  return [...rows]
    .sort((a, b) => {
      const t1 = new Date(a.timestamp).getTime();
      const t2 = new Date(b.timestamp).getTime();
      return t2 - t1;
    })
    .map((evt, idx) => ({
      id: `a-${idx}-${evt.task_id}-${evt.timestamp}`,
      label: evt.action,
      detail: `${evt.employee_name} ${evt.action.toLowerCase()} task "${evt.task_title}" in ${evt.project_name}`,
      time: formatActivityTime(evt.timestamp),
    }));
}

export default function BADashboardPage() {
  const [projectRows, setProjectRows] = useState<ProjectOverviewRow[]>([]);
  const [workTracking, setWorkTracking] = useState<WorkTrackingRow[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityLogItem[]>([]);
  const [stats, setStats] = useState({
    projects: 0,
    inProgress: 0,
    completed: 0,
    employees: 0,
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const [dash, work] = await Promise.all([
        fetchBADashboard(),
        fetchWorkTracking(),
      ]);

      const overview = dash.overview ?? {};
      const tsc = dash.task_status_counts ?? {};
      setStats({
        projects: overview.projects_count ?? 0,
        inProgress: tsc.in_progress ?? dash.tasks_in_progress ?? 0,
        completed: tsc.completed ?? dash.tasks_completed ?? 0,
        employees: overview.employee_count ?? dash.assigned_employees ?? 0,
      });

      setProjectRows(mapProjectsToOverview(dash));
      setWorkTracking(mapWorkTracking(work.work_tracking));
      setActivityItems(
        mapNotificationsToActivity(
          dash.recent_activity ?? work.recent_activity,
        ),
      );
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [load]);

  const overviewStats = useMemo(
    () => [
      { title: "Active Projects", value: stats.projects, icon: FolderPlus },
      { title: "Tasks In Progress", value: stats.inProgress, icon: ListChecks },
      { title: "Completed Tasks", value: stats.completed, icon: CircleCheck },
      {
        title: "Active Employees",
        value: stats.employees,
        icon: UserRoundCheck,
      },
    ],
    [stats],
  );

  const projectColumns: DataTableColumn[] = [
    { label: "Project Name", key: "projectName" },
    { label: "Current Milestone", key: "milestone" },
    { label: "Task Status Split", key: "taskSummary" },
    { label: "Status", key: "status" },
  ];

  const workColumns: DataTableColumn[] = [
    { label: "Employee", key: "employee" },
    { label: "Current Task / Project", key: "currentFocus" },
    { label: "Status", key: "status" },
  ];

  return (
    <div className="p-6 space-y-10 max-w-7xl mx-auto">
      <h3 className="h3 font-bold">Dashboard</h3>

      {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}
      {loading ? <p className="text-sm text-gray-500">Loading…</p> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {overviewStats.map((card) => (
          <DashboardCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
          />
        ))}
      </div>

      <section className="space-y-3">
        <div>
          <h3 className="h3 font-semibold">Project Overview</h3>
          <p className="p1 text-gray-500">
            Clear delivery view by milestones and tasks
          </p>
        </div>

        <DataTable<ProjectOverviewRow>
          columns={projectColumns}
          data={projectRows}
          pageSize={5}
          renderers={{
            taskSummary: (row) => (
              <p className="max-w-[360px] text-xs text-gray-600 leading-5">
                {row.taskSummary}
              </p>
            ),
            status: (_, value) => {
              const status = value as ProjectOverviewRow["status"];
              const styles: Record<ProjectOverviewRow["status"], string> = {
                "Not Started": "bg-slate-100 text-slate-700",
                "In Progress": "bg-blue-100 text-blue-700",
                Paused: "bg-amber-100 text-amber-700",
                Stopped: "bg-zinc-200 text-zinc-800",
                Delayed: "bg-rose-100 text-rose-700",
                Completed: "bg-emerald-100 text-emerald-700",
              };
              return (
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${styles[status]}`}
                >
                  {status}
                </span>
              );
            },
          }}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="h3 font-semibold">Work Tracking Summary</h3>
          <p className="p1 text-gray-500">Who is working on what</p>
        </div>

        <Card className="p-4">
          <DataTable<WorkTrackingRow>
            columns={workColumns}
            data={workTracking}
            pageSize={5}
            renderers={{
              status: (_, value) => {
                const status = value as WorkTrackingRow["status"];

                const styles: Record<WorkTrackingRow["status"], string> = {
                  Running: "bg-green-100 text-green-600",
                  Paused: "bg-yellow-100 text-yellow-600",
                  Stopped: "bg-gray-100 text-gray-600",
                  "Auto stop": "bg-indigo-100 text-indigo-800",
                };

                return (
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${styles[status]}`}
                  >
                    {status}
                  </span>
                );
              },
            }}
          />
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CalendarClock size={18} className="text-gray-400" />
            <h3 className="h3 font-semibold">Recent Activity</h3>
          </div>

          <span className="inline-flex items-center gap-1.5 p1 text-gray-400">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Live
          </span>
        </div>

        <div className="max-h-[480px] overflow-y-auto pr-1">
          <ActivityLog items={activityItems} />
        </div>
      </section>
    </div>
  );
}
