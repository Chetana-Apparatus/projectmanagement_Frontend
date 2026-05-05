"use client";

import { Spin } from "antd";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Card from "@/components/common/card/Card";
import DataTable, {
  type DataTableColumn,
} from "@/components/common/table/DataTable";
import ProjectDetailModal from "@/components/common/work-tracking/ProjectDetailModal";
import Button from "@/components/ui/Button";
import { useLoader } from "@/context/LoaderContext";
import { statusBadgeLayoutClass } from "@/features/employee-tasks/status";
import {
  fetchWorkTracking,
  type WorkTrackingRecord,
} from "@/lib/admin-dashboard-api";
import type {
  ApiMilestone,
  ApiProject,
  ApiTask,
  ApiUser,
} from "@/lib/admin-mappers";
import { fetchAllPages } from "@/lib/pms-http";
import {
  buildLatestActivityByTaskId,
  type RecentActivityAction,
} from "@/lib/recent-activity";
import { cn } from "@/lib/utils";

export type WorkLogUiStatus =
  | "not-started"
  | "running"
  | "paused"
  | "stopped"
  | "auto-stopped"
  | "completed"
  | "delayed"
  | "blocked";

type WorkLogRow = {
  id: string;
  employee: string;
  projectId: number;
  project: string;
  milestone: string;
  task: string;
  status: WorkLogUiStatus;
  sessionStart: string;
  historyDetail: string | null;
  workingTime: string;
} & Record<string, unknown>;

const STATUS_LABEL: Record<WorkLogUiStatus, string> = {
  "not-started": "Not started",
  running: "Running",
  paused: "Paused",
  stopped: "Stopped",
  "auto-stopped": "Auto stop",
  completed: "Complete",
  delayed: "Delayed",
  blocked: "Blocked",
};

/** Manual stop (red). Auto stop uses indigo to match Admin Tasks. */
const STOPPED_BADGE_CLASS = "bg-red-100 text-red-700 ring-0 shadow-none";
const AUTO_STOP_BADGE_CLASS =
  "border border-indigo-300 bg-indigo-50 text-indigo-950 shadow-sm shadow-indigo-200/40";

const STATUS_PILL_CLASS: Record<WorkLogUiStatus, string> = {
  "not-started": "bg-gray-100 text-gray-600 ring-0 shadow-none",
  running: "bg-blue-100 text-blue-700 ring-0 shadow-none",
  paused: "bg-yellow-100 text-yellow-700 ring-0 shadow-none",
  stopped: STOPPED_BADGE_CLASS,
  "auto-stopped": AUTO_STOP_BADGE_CLASS,
  completed: "bg-green-100 text-green-700 ring-0 shadow-none",
  delayed: "bg-rose-100 text-rose-700 ring-0 shadow-none",
  blocked: "bg-zinc-200 text-zinc-800 ring-0 shadow-none",
};

function resolveWorkRowStatus(
  rec: WorkTrackingRecord,
  latestAction?: RecentActivityAction,
): WorkLogUiStatus {
  const ts = (rec.task_status ?? "").toUpperCase();
  const timer = rec.timer_state ?? "";
  const lastStop = rec.last_stop_source ?? "";
  if (ts === "COMPLETED") return "completed";
  if (ts === "DELAYED") return "delayed";
  if (ts === "BLOCKED") return "blocked";
  if (latestAction === "STOPPED" && (timer === "PAUSED" || ts === "PAUSED")) {
    return "stopped";
  }
  if (timer === "STARTED") return "running";
  if (timer === "PAUSED") return "paused";
  if (timer === "AUTO_STOPPED") return "auto-stopped";
  if (ts === "NOT_STARTED") return "not-started";
  if (timer === "STOPPED") {
    if (lastStop === "AUTO_STOP_8PM") return "auto-stopped";
    return "stopped";
  }
  if (ts === "IN_PROGRESS") return "stopped";
  return "stopped";
}

function formatTimeOnly(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSessionStart(rec: WorkTrackingRecord): string {
  if (rec.timer_state === "STARTED" && rec.current_session_start_time) {
    return formatTimeOnly(rec.current_session_start_time);
  }
  if (rec.last_session_start_time) {
    return formatTimeOnly(rec.last_session_start_time);
  }
  return "—";
}

function buildHistoryDetail(rec: WorkTrackingRecord): string | null {
  const h = rec.history;
  if (!h) return null;
  const starts = h.start_count ?? 0;
  const pauses = h.pause_count ?? 0;
  const stops = h.stop_count ?? 0;
  const auto = h.auto_stop_count ?? 0;

  const parts: string[] = [];
  if (starts > 0) parts.push(`Start ${starts}`);
  if (pauses > 0) parts.push(`Pause ${pauses}`);
  if (stops > 0) parts.push(`Stop ${stops}`);
  if (auto > 0) parts.push(`Auto stop ${auto}`);

  if (parts.length === 0) return null;
  return parts.join(" · ");
}

function userLabel(u: ApiUser): string {
  const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
  return name || u.email;
}

const TASK_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Any task status" },
  { value: "NOT_STARTED", label: "Not started" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "PAUSED", label: "Paused" },
  { value: "COMPLETED", label: "Completed" },
  { value: "DELAYED", label: "Delayed" },
  { value: "BLOCKED", label: "Blocked" },
];

function buildFilterQuery(f: {
  employeeId: string;
  projectId: string;
  milestoneId: string;
  taskId: string;
  status: string;
  onlyActive: boolean;
}): Record<string, string | undefined> {
  return {
    employee_id: f.employeeId || undefined,
    project_id: f.projectId || undefined,
    milestone_id: f.milestoneId || undefined,
    task_id: f.taskId || undefined,
    status: f.status || undefined,
    only_active: f.onlyActive ? "true" : undefined,
  };
}

function mapRecord(
  rec: WorkTrackingRecord,
  latestByTask: Partial<Record<string, RecentActivityAction>>,
): WorkLogRow {
  const latest = latestByTask[String(rec.task_id)];
  return {
    id: String(rec.task_id),
    employee: rec.employee_name,
    projectId: rec.project_id,
    project: rec.project_name,
    milestone: rec.milestone_name ?? "—",
    task: rec.task_title,
    status: resolveWorkRowStatus(rec, latest),
    sessionStart: formatSessionStart(rec),
    historyDetail: buildHistoryDetail(rec),
    workingTime: rec.total_time_spent_display ?? "—",
  };
}

type SummaryState = {
  records: number;
  started: number;
  paused: number;
  stopped: number;
  notStarted: number;
  delayed: number;
  completed: number;
  autoStopped: number;
};

const emptySummary: SummaryState = {
  records: 0,
  started: 0,
  paused: 0,
  stopped: 0,
  notStarted: 0,
  delayed: 0,
  completed: 0,
  autoStopped: 0,
};

export default function WorkTrackingScreen() {
  const { setLoading: setGlobalLoading } = useLoader();
  const [logs, setLogs] = useState<WorkLogRow[]>([]);
  const [summary, setSummary] = useState<SummaryState>(emptySummary);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(true);

  const [employees, setEmployees] = useState<ApiUser[]>([]);
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [milestones, setMilestones] = useState<ApiMilestone[]>([]);
  const [tasks, setTasks] = useState<ApiTask[]>([]);

  const [employeeId, setEmployeeId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [milestoneId, setMilestoneId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [status, setStatus] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);

  const [projectModalId, setProjectModalId] = useState<number | null>(null);

  const filterQuery = useMemo(
    () =>
      buildFilterQuery({
        employeeId,
        projectId,
        milestoneId,
        taskId,
        status,
        onlyActive,
      }),
    [employeeId, projectId, milestoneId, taskId, status, onlyActive],
  );

  const milestoneOptions = useMemo(() => {
    const list = !projectId
      ? [...milestones]
      : milestones.filter((m) => String(m.project) === String(projectId));
    return list.sort((a, b) => {
      const byProject = (a.project_name ?? "").localeCompare(
        b.project_name ?? "",
        undefined,
        { sensitivity: "base" },
      );
      if (byProject !== 0) return byProject;
      return (a.milestone_no ?? 0) - (b.milestone_no ?? 0);
    });
  }, [milestones, projectId]);

  const taskOptions = useMemo(() => {
    let list = tasks;
    if (projectId) {
      list = list.filter((t) => String(t.project) === String(projectId));
    }
    if (milestoneId) {
      list = list.filter(
        (t) =>
          t.milestone != null && String(t.milestone) === String(milestoneId),
      );
    }
    return list;
  }, [tasks, projectId, milestoneId]);

  const loadOptions = useCallback(async () => {
    setOptionsLoading(true);
    try {
      const [u, p, m, t] = await Promise.all([
        fetchAllPages<ApiUser>("/api/v1/users/"),
        fetchAllPages<ApiProject>("/api/v1/projects/"),
        fetchAllPages<ApiMilestone>("/api/v1/milestones/"),
        fetchAllPages<ApiTask>("/api/v1/tasks/"),
      ]);
      setEmployees(
        u.filter((x) => (x.role ?? "").toUpperCase() === "EMPLOYEE"),
      );
      setProjects(p);
      setMilestones(m);
      setTasks(t);
    } catch {
      /* filters optional */
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  const load = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const data = await fetchWorkTracking(filterQuery);
      const s = data.summary ?? {};
      setSummary({
        records: s.records_count ?? 0,
        started: s.started_count ?? 0,
        paused: s.paused_count ?? 0,
        stopped: s.stopped_count ?? 0,
        notStarted: s.not_started_count ?? 0,
        delayed: s.delayed_count ?? 0,
        completed: s.completed_count ?? 0,
        autoStopped: s.auto_stopped_count ?? 0,
      });
      const latestByTask = buildLatestActivityByTaskId(data.recent_activity);
      setLogs(
        (data.work_tracking ?? []).map((rec) => mapRecord(rec, latestByTask)),
      );
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [filterQuery]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void load();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [load]);

  useEffect(() => {
    setGlobalLoading(loading || optionsLoading);
    return () => {
      setGlobalLoading(false);
    };
  }, [loading, optionsLoading, setGlobalLoading]);

  useEffect(() => {
    if (!milestoneId) return;
    const m = milestones.find((x) => String(x.id) === String(milestoneId));
    if (!m) {
      setMilestoneId("");
      return;
    }
    if (projectId && String(m.project) !== String(projectId)) {
      setMilestoneId("");
    }
  }, [projectId, milestoneId, milestones]);

  useEffect(() => {
    if (!taskId) return;
    const t = tasks.find((x) => String(x.id) === String(taskId));
    if (!t) {
      setTaskId("");
      return;
    }
    if (projectId && String(t.project) !== String(projectId)) {
      setTaskId("");
      return;
    }
    if (
      milestoneId &&
      (t.milestone == null || String(t.milestone) !== String(milestoneId))
    ) {
      setTaskId("");
    }
  }, [projectId, milestoneId, taskId, tasks]);

  const clearFilters = () => {
    setEmployeeId("");
    setProjectId("");
    setMilestoneId("");
    setTaskId("");
    setStatus("");
    setOnlyActive(false);
  };

  const employeeSelectOptions = useMemo(
    () =>
      employees.map((u) => ({
        value: String(u.id),
        label: userLabel(u),
      })),
    [employees],
  );

  const projectSelectOptions = useMemo(
    () =>
      [...projects]
        .sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
        )
        .map((p) => ({ value: String(p.id), label: p.name })),
    [projects],
  );

  const milestoneSelectOptions = useMemo(
    () =>
      milestoneOptions.map((m) => ({
        value: String(m.id),
        label: projectId
          ? `M${m.milestone_no ?? "?"} · ${m.name}`
          : `${m.project_name?.trim() || "Project"} · M${m.milestone_no ?? "?"} · ${m.name}`,
      })),
    [milestoneOptions, projectId],
  );

  const taskSelectOptions = useMemo(
    () =>
      taskOptions.map((t) => ({
        value: String(t.id),
        label: t.title,
      })),
    [taskOptions],
  );

  const taskStatusSelectOptions = useMemo(
    () =>
      TASK_STATUS_OPTIONS.filter((o) => o.value !== "").map((o) => ({
        value: o.value,
        label: o.label,
      })),
    [],
  );

  const columns: DataTableColumn[] = [
    { label: "Employee", key: "employee" },
    { label: "Project", key: "project" },
    { label: "Milestone", key: "milestone" },
    { label: "Task", key: "task" },
    { label: "Work status", key: "status" },
    { label: "Session / last start", key: "sessionStart" },
    { label: "Working time", key: "workingTime" },
    { label: "Timer history", key: "historyDetail" },
  ];

  const summaryCards = useMemo(
    () => [
      {
        key: "running",
        title: "Running",
        value: summary.started,
        color: "text-emerald-700",
        iconWrapperClassName: "bg-emerald-100",
        iconClassName: "text-emerald-600",
        Icon: PlayCircle,
      },
      {
        key: "completed",
        title: "Complete",
        value: summary.completed,
        color: "text-teal-800",
        iconWrapperClassName: "bg-teal-100",
        iconClassName: "text-teal-600",
        Icon: CheckCircle2,
      },
      {
        key: "delayed",
        title: "Delayed",
        value: summary.delayed,
        color: "text-orange-800",
        iconWrapperClassName: "bg-orange-100",
        iconClassName: "text-orange-600",
        Icon: AlertTriangle,
      },
      {
        key: "paused",
        title: "Paused",
        value: summary.paused,
        color: "text-amber-800",
        iconWrapperClassName: "bg-yellow-100",
        iconClassName: "text-yellow-700",
        Icon: PauseCircle,
      },
    ],
    [summary.started, summary.completed, summary.delayed, summary.paused],
  );

  const filterClass =
    "h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-800 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-[180px]";

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="h2">Work tracking</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Activity className="h-4 w-4 text-emerald-600" aria-hidden />
          {loading ? "Updating…" : "Up to date"}
        </div>
      </div>

      {loadError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {loadError}
        </p>
      ) : null}

      <ul
        className="grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-4"
        aria-label="Work status summary"
      >
        {summaryCards.map(
          ({
            key,
            title,
            value,
            color,
            iconWrapperClassName,
            iconClassName,
            Icon,
          }) => (
            <li key={key} className="min-w-0">
              <Card
                variant="surface"
                padding="none"
                className="h-full border border-gray-100/90 p-3 shadow-sm !flex-row !items-center !justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="p1  uppercase tracking-wide text-gray-500">
                    {title}
                  </p>
                  <p
                    className={`mt-1 text-xl font-bold tabular-nums tracking-tight ${color}`}
                  >
                    {value}
                  </p>
                </div>
                <div
                  className={cn(
                    "shrink-0 rounded-lg p-2",
                    iconWrapperClassName,
                  )}
                  aria-hidden
                >
                  <Icon className={cn("h-6 w-6", iconClassName)} />
                </div>
              </Card>
            </li>
          ),
        )}
      </ul>

      <Card
        variant="surface"
        padding="none"
        className="rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        <div className="relative px-3 py-2.5 sm:px-4 sm:py-3">
          {optionsLoading ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/85 backdrop-blur-[1px]">
              <Spin size="large" />
              <span className="text-sm font-medium text-gray-600">
                Loading options…
              </span>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <select
              className={filterClass}
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="">All employees</option>
              {employeeSelectOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              className={filterClass}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">All projects</option>
              {projectSelectOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              className={filterClass}
              value={milestoneId}
              onChange={(e) => setMilestoneId(e.target.value)}
            >
              <option value="">All milestones</option>
              {milestoneSelectOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              className={filterClass}
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
            >
              <option value="">All tasks</option>
              {taskSelectOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              className={filterClass}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Any status</option>
              {taskStatusSelectOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <label className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-800 hover:border-gray-300 sm:w-[180px]">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={onlyActive}
                onChange={(e) => setOnlyActive(e.target.checked)}
              />
              Running only
            </label>

            <Button
              className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-800 hover:border-gray-300 sm:w-auto"
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      <DataTable
        columns={columns}
        data={logs}
        pageSize={10}
        paginationHideOnSinglePage={false}
        visualVariant="employee"
        cardClassName="items-start justify-start overflow-hidden rounded-2xl border border-gray-200 shadow-sm"
        emptyMessage="No work tracking rows match your filters."
        renderers={{
          employee: (row) => (
            <span className="block max-w-full truncate text-md text-cs-text">
              {row.employee}
            </span>
          ),
          project: (row) => (
            <button
              type="button"
              onClick={() => setProjectModalId(row.projectId)}
              className="block max-w-full cursor-pointer truncate text-left text-sm  !text-sky-600 !underline decoration-sky-500 underline-offset-2 transition-colors hover:!text-sky-700"
            >
              {row.project}
            </button>
          ),
          milestone: (row) => (
            <span className="block max-w-full truncate text-sm text-cs-text">
              {row.milestone}
            </span>
          ),
          task: (row) => (
            <span className="block max-w-full truncate text-sm text-cs-text">
              {row.task}
            </span>
          ),
          status: (row) => {
            const statusKey = row.status;
            return (
              <span
                title={
                  statusKey === "paused"
                    ? "Employee paused the timer (can resume)"
                    : statusKey === "stopped"
                      ? "Employee stopped the timer"
                      : statusKey === "auto-stopped"
                        ? "Timer stopped automatically (e.g. end-of-day cutoff)"
                        : undefined
                }
                className={`${statusBadgeLayoutClass} max-w-full font-semibold ${STATUS_PILL_CLASS[statusKey]}`}
              >
                {STATUS_LABEL[statusKey]}
              </span>
            );
          },
          sessionStart: (row) => (
            <span className="whitespace-nowrap font-mono text-sm tabular-nums text-cs-text">
              {row.sessionStart}
            </span>
          ),
          workingTime: (row) => (
            <span className="font-mono text-sm font-medium tabular-nums text-cs-text">
              {row.workingTime}
            </span>
          ),
          historyDetail: (row) =>
            row.historyDetail ? (
              <span className="text-sm tabular-nums leading-snug text-cs-text">
                {row.historyDetail}
              </span>
            ) : (
              <span className="text-sm text-gray-400">—</span>
            ),
        }}
      />

      <ProjectDetailModal
        open={projectModalId != null}
        projectId={projectModalId}
        onClose={() => setProjectModalId(null)}
      />
    </div>
  );
}
