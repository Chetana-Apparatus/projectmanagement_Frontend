"use client";

import { useCallback, useEffect, useState } from "react";
import Card from "@/components/common/card/Card";
import DataTable, {
  type DataTableColumn,
} from "@/components/common/table/DataTable";
import { fetchWorkTracking } from "@/lib/admin-dashboard-api";

type WorkLog = {
  id: string;
  employee: string;
  project: string;
  milestone: string;
  task: string;
  status: WorkLogUiStatus;
  startDate: string;
  endDate: string;
  startTime: string;
  totalTime: string;
  taskStatus?: string;
};

type WorkLogUiStatus =
  | "not-started"
  | "started"
  | "running"
  | "paused"
  | "stopped"
  | "auto-stopped"
  | "delayed";

function timerToUi(s: string): WorkLogUiStatus {
  switch (s) {
    case "STARTED":
      return "running";
    case "PAUSED":
      return "paused";
    case "STOPPED":
      return "stopped";
    default:
      return "stopped";
  }
}

function fmtStartTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BAWorkTrackingPage() {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [summary, setSummary] = useState({
    records: 0,
    started: 0,
    paused: 0,
    stopped: 0,
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const data = await fetchWorkTracking();
      const s = data.summary ?? {};
      setSummary({
        records: s.records_count ?? 0,
        started: s.started_count ?? 0,
        paused: s.paused_count ?? 0,
        stopped: s.stopped_count ?? 0,
      });

      const rows = (data.work_tracking ?? []).map((rec, idx) => ({
        id: `wt-${idx}-${rec.task_title}`,
        employee: rec.employee_name,
        project: rec.project_name,
        milestone: rec.milestone_name ?? "—",
        task: rec.task_title,
        status: timerToUi(rec.timer_state),
        startDate: "",
        endDate: "",
        startTime: fmtStartTime(rec.current_session_start_time),
        totalTime:
          rec.today_worked_display ??
          rec.total_time_spent_display ??
          rec.current_session_display ??
          "—",
        taskStatus: rec.task_status,
      }));
      setLogs(rows);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load");
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

  const columns: DataTableColumn[] = [
    { label: "Employee", key: "employee" },
    { label: "Project", key: "project" },
    { label: "Milestone", key: "milestone" },
    { label: "Task", key: "task" },
    { label: "Progress", key: "progress" },
    { label: "Status", key: "status" },
    { label: "Start Time", key: "startTime" },
    { label: "Total Time", key: "totalTime" },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="ui-page-title">Work Tracking</h1>
        <p className="ui-body-muted">
          Monitor employee work activity in real-time
        </p>
      </div>

      {loading ? <p className="text-sm text-gray-500">Loading…</p> : null}
      {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 !flex-row !items-center !justify-between">
          <p className="text-gray-500">Records</p>
          <h2 className="text-xl font-bold text-sky-700">{summary.records}</h2>
        </Card>

        <Card className="p-4 !flex-row !items-center !justify-between">
          <p className="text-gray-500">Running</p>
          <h2 className="text-xl font-bold text-green-600">
            {summary.started}
          </h2>
        </Card>

        <Card className="p-4 !flex-row !items-center !justify-between">
          <p className="text-gray-500">Paused</p>
          <h2 className="text-xl font-bold text-yellow-600">
            {summary.paused}
          </h2>
        </Card>

        <Card className="p-4 !flex-row !items-center !justify-between">
          <p className="text-gray-500">Stopped</p>
          <h2 className="text-xl font-bold text-gray-600">{summary.stopped}</h2>
        </Card>
      </div>

      <DataTable<WorkLog>
        columns={columns}
        data={logs}
        renderers={{
          project: (row) => (
            <span className="inline-block whitespace-nowrap">
              {row.project}
            </span>
          ),
          task: (row) => (
            <span className="inline-block whitespace-nowrap">{row.task}</span>
          ),
          progress: (row) => {
            const normalizedTaskStatus = (row.taskStatus ?? "").toUpperCase();
            const progressLabel =
              normalizedTaskStatus === "COMPLETED"
                ? "Completed"
                : normalizedTaskStatus === "DELAYED"
                  ? "Delayed"
                  : normalizedTaskStatus === "NOT_STARTED"
                    ? "Not Started"
                    : row.status === "running"
                      ? "In Progress"
                      : row.status === "paused"
                        ? "Paused"
                        : "Stopped";
            const progressStyles = {
              "Not Started": "bg-slate-100 text-slate-700",
              "In Progress": "bg-blue-100 text-blue-700",
              Paused: "bg-yellow-100 text-yellow-700",
              Stopped: "bg-gray-100 text-gray-700",
              Delayed: "bg-rose-100 text-rose-700",
              Completed: "bg-emerald-100 text-emerald-700",
            } as const;
            return (
              <span
                className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-xs ${progressStyles[progressLabel]}`}
              >
                {progressLabel}
              </span>
            );
          },
          status: (row) => {
            const normalizedTaskStatus = (row.taskStatus ?? "").toUpperCase();
            const statusKey: WorkLogUiStatus =
              normalizedTaskStatus === "NOT_STARTED"
                ? "not-started"
                : row.status === "running"
                  ? "started"
                  : normalizedTaskStatus === "DELAYED"
                    ? "delayed"
                    : row.status;
            const styles = {
              "not-started": "bg-slate-100 text-slate-700",
              started: "bg-blue-100 text-blue-700",
              running: "bg-green-100 text-green-600",
              paused: "bg-yellow-100 text-yellow-600",
              stopped: "bg-gray-100 text-gray-600",
              delayed: "bg-orange-100 text-orange-600",
              "auto-stopped": "bg-red-100 text-red-600",
            };

            const labels = {
              "not-started": "Not Started",
              started: "Started",
              running: "Running",
              paused: "Paused",
              stopped: "Stopped",
              delayed: "Delayed",
              "auto-stopped": "Auto-Stopped",
            };

            return (
              <span
                className={`inline-flex whitespace-nowrap px-2 py-1 text-xs rounded-full ${styles[statusKey]}`}
              >
                {labels[statusKey]}
              </span>
            );
          },
        }}
      />
    </div>
  );
}
