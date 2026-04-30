"use client";

import { Select, Spin } from "antd";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ListFilter,
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
  /** Timer summary for last column; `null` when there is no activity to show. */
  historyDetail: string | null;
  workingTime: string;
} & Record<string, unknown>;

const STATUS_LABEL: Record<WorkLogUiStatus, string> = {
  "not-started": "Not started",
  running: "Running",
  paused: "Paused",
  stopped: "Stopped",
  "auto-stopped": "Stopped (auto 8pm)",
  completed: "Complete",
  delayed: "Delayed",
  blocked: "Blocked",
};

/** Plain status label + dot (not button-style chips). */
const STATUS_DOT_CLASS: Record<WorkLogUiStatus, string> = {
  "not-started": "bg-slate-400",
  running: "bg-emerald-500",
  paused: "bg-amber-500",
  stopped: "bg-zinc-500",
  "auto-stopped": "bg-violet-500",
  completed: "bg-green-600",
  delayed: "bg-orange-500",
  blocked: "bg-stone-500",
};

const STATUS_TEXT_CLASS: Record<WorkLogUiStatus, string> = {
  "not-started": "text-slate-800",
  running: "text-emerald-800",
  paused: "text-amber-900",
  stopped: "text-zinc-800",
  "auto-stopped": "text-violet-900",
  completed: "text-green-800",
  delayed: "text-orange-900",
  blocked: "text-stone-800",
};

function resolveWorkRowStatus(rec: WorkTrackingRecord): WorkLogUiStatus {
  const ts = (rec.task_status ?? "").toUpperCase();
  const timer = rec.timer_state ?? "";
  const lastStop = rec.last_stop_source ?? "";
  if (ts === "COMPLETED") return "completed";
  if (ts === "DELAYED") return "delayed";
  if (ts === "BLOCKED") return "blocked";
  if (timer === "STARTED") return "running";
  if (timer === "PAUSED") return "paused";
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

/**
 * Start / pause / stop counts only; auto stop appended only when count is greater than zero.
 * Returns `null` when there is no timer activity to display.
 */
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

function mapRecord(rec: WorkTrackingRecord): WorkLogRow {
  return {
    id: String(rec.task_id),
    employee: rec.employee_name,
    projectId: rec.project_id,
    project: rec.project_name,
    milestone: rec.milestone_name ?? "—",
    task: rec.task_title,
    status: resolveWorkRowStatus(rec),
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
      setLogs((data.work_tracking ?? []).map(mapRecord));
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

  const selectBlockCls =
    "w-full [&_.ant-select-selector]:!min-h-[40px] [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!border-gray-200 [&_.ant-select-selector]:!bg-white [&_.ant-select-selector]:!px-2 [&_.ant-select-selector]:!shadow-sm [&_.ant-select-selector]:hover:!border-gray-300 [&_.ant-select-focused.ant-select]:!shadow-md [&_.ant-select-selection-item]:!leading-[38px] [&_.ant-select-selection-placeholder]:!leading-[38px]";

  const filterLabelCls = "text-sm font-semibold text-gray-700";

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
        hint: "Timer on",
        value: summary.started,
        color: "text-emerald-700",
        iconBg: "text-emerald-500/80",
        Icon: PlayCircle,
      },
      {
        key: "completed",
        title: "Complete",
        hint: "Task marked done",
        value: summary.completed,
        color: "text-teal-800",
        iconBg: "text-teal-600/80",
        Icon: CheckCircle2,
      },
      {
        key: "delayed",
        title: "Delayed",
        hint: "Task flagged late",
        value: summary.delayed,
        color: "text-orange-800",
        iconBg: "text-orange-500/80",
        Icon: AlertTriangle,
      },
      {
        key: "paused",
        title: "Paused",
        hint: "Employee paused",
        value: summary.paused,
        color: "text-amber-800",
        iconBg: "text-amber-500/80",
        Icon: PauseCircle,
      },
    ],
    [summary.started, summary.completed, summary.delayed, summary.paused],
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="ui-page-title">Work tracking</h1>
          <p className="ui-body-muted max-w-2xl">
            See who is on the clock and what they are working on. Timer history
            appears in the last column when a task has recorded starts, pauses,
            stops, or auto stops. Newest activity is listed first. Data
            refreshes every 30 seconds.
          </p>
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
          ({ key, title, hint, value, color, iconBg, Icon }) => (
            <li key={key} className="min-w-0">
              <Card
                variant="surface"
                padding="none"
                className="h-full border border-gray-100/90 p-3 shadow-sm !flex-row !items-center !justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    {title}
                  </p>
                  <p
                    className={`mt-1 text-xl font-bold tabular-nums tracking-tight ${color}`}
                  >
                    {value}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-snug text-gray-500">
                    {hint}
                  </p>
                </div>
                <Icon className={`h-6 w-6 shrink-0 ${iconBg}`} aria-hidden />
              </Card>
            </li>
          ),
        )}
      </ul>

      <Card
        variant="surface"
        padding="none"
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-black/[0.03]"
      >
        <div className="flex flex-col lg:flex-row lg:items-stretch">
          <aside className="flex shrink-0 flex-col justify-between gap-4 border-b border-gray-200/80 bg-slate-50/70 px-5 py-5 sm:px-6 lg:w-[min(100%,18rem)] lg:border-b-0 lg:border-r lg:border-gray-200/80 xl:w-72">
            <div className="flex gap-3">
              <div
                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sm"
                aria-hidden
              >
                <ListFilter className="h-[18px] w-[18px]" strokeWidth={2.25} />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold tracking-tight text-gray-900">
                  Filters
                </h2>
                <p className="mt-1.5 text-xs leading-snug text-gray-600">
                  Narrow the table by who is working and on which work items.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="h-10 w-full shrink-0 px-4"
              onClick={clearFilters}
            >
              Clear all
            </Button>
          </aside>

          <div className="relative min-w-0 flex-1 bg-[linear-gradient(180deg,#fafafa_0%,#ffffff_40px)] px-5 py-5 sm:px-6 lg:pl-6">
            {optionsLoading ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/85 backdrop-blur-[1px]">
                <Spin size="large" />
                <span className="text-sm font-medium text-gray-600">
                  Loading options…
                </span>
              </div>
            ) : null}

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="flex min-w-0 flex-col gap-2">
                  <span id="wt-lbl-employee" className={filterLabelCls}>
                    Employee
                  </span>
                  <Select
                    aria-labelledby="wt-lbl-employee"
                    allowClear
                    showSearch
                    placeholder="Everyone"
                    disabled={optionsLoading}
                    className={selectBlockCls}
                    value={employeeId || undefined}
                    onChange={(v) => setEmployeeId(v ?? "")}
                    options={employeeSelectOptions}
                    optionFilterProp="label"
                    popupMatchSelectWidth={false}
                  />
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                  <span id="wt-lbl-project" className={filterLabelCls}>
                    Project
                  </span>
                  <Select
                    aria-labelledby="wt-lbl-project"
                    allowClear
                    showSearch
                    placeholder="All projects"
                    disabled={optionsLoading}
                    className={selectBlockCls}
                    value={projectId || undefined}
                    onChange={(v) => {
                      setProjectId(v ?? "");
                      setMilestoneId("");
                      setTaskId("");
                    }}
                    options={projectSelectOptions}
                    optionFilterProp="label"
                    popupMatchSelectWidth={false}
                  />
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                  <span id="wt-lbl-milestone" className={filterLabelCls}>
                    Milestone
                  </span>
                  <Select
                    aria-labelledby="wt-lbl-milestone"
                    allowClear
                    showSearch
                    placeholder={projectId ? "This project" : "All milestones"}
                    disabled={optionsLoading}
                    className={selectBlockCls}
                    value={milestoneId || undefined}
                    onChange={(v) => {
                      setMilestoneId(v ?? "");
                      setTaskId("");
                    }}
                    options={milestoneSelectOptions}
                    optionFilterProp="label"
                    popupMatchSelectWidth={false}
                    listHeight={320}
                    notFoundContent={
                      projectId
                        ? "No milestones in this project"
                        : "No milestones loaded"
                    }
                  />
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                  <span id="wt-lbl-task" className={filterLabelCls}>
                    Task
                  </span>
                  <Select
                    aria-labelledby="wt-lbl-task"
                    allowClear
                    showSearch
                    placeholder="All tasks"
                    disabled={optionsLoading}
                    className={selectBlockCls}
                    value={taskId || undefined}
                    onChange={(v) => setTaskId(v ?? "")}
                    options={taskSelectOptions}
                    optionFilterProp="label"
                    popupMatchSelectWidth={false}
                  />
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                  <span id="wt-lbl-status" className={filterLabelCls}>
                    Task status
                  </span>
                  <Select
                    aria-labelledby="wt-lbl-status"
                    allowClear
                    placeholder="Any status"
                    disabled={optionsLoading}
                    className={selectBlockCls}
                    value={status || undefined}
                    onChange={(v) => setStatus(v ?? "")}
                    options={taskStatusSelectOptions}
                    popupMatchSelectWidth={false}
                  />
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                  <span className={filterLabelCls}>Timer</span>
                  <label className="flex h-10 min-h-10 w-full cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50/40 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sky-200">
                    <input
                      type="checkbox"
                      className="h-4 w-4 shrink-0 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                      checked={onlyActive}
                      onChange={(e) => setOnlyActive(e.target.checked)}
                    />
                    <span className="min-w-0 text-sm font-medium leading-snug text-gray-800">
                      Only running timers
                    </span>
                  </label>
                </div>
              </div>

              {!projectId &&
              !optionsLoading &&
              milestoneSelectOptions.length > 0 ? (
                <div className="rounded-lg border border-sky-100 bg-sky-50/70 px-3 py-2 text-[11px] leading-relaxed text-sky-950">
                  Milestones from <strong>all</strong> projects—pick a project
                  to shorten the list.
                </div>
              ) : null}
              {projectId &&
              !optionsLoading &&
              milestoneSelectOptions.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-[11px] leading-relaxed text-amber-950">
                  No milestones here—try another project or clear project.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      <DataTable<WorkLogRow>
        columns={columns}
        data={logs}
        pageSize={10}
        showPaginationSizeChanger
        paginationPageSizeOptions={[10, 20, 50]}
        paginationHideOnSinglePage={false}
        emptyMessage="No work tracking rows match your filters."
        renderers={{
          employee: (row) => (
            <span className="text-sm font-semibold text-gray-900">
              {row.employee}
            </span>
          ),
          project: (row) => (
            <button
              type="button"
              onClick={() => setProjectModalId(row.projectId)}
              className="text-left text-sm font-semibold text-sky-700 underline-offset-2 hover:text-sky-900 hover:underline"
            >
              {row.project}
            </button>
          ),
          milestone: (row) => (
            <span className="text-sm text-gray-800">{row.milestone}</span>
          ),
          task: (row) => (
            <span className="text-sm font-semibold text-gray-900">
              {row.task}
            </span>
          ),
          status: (row) => {
            const statusKey = row.status;
            return (
              <span className="inline-flex max-w-full items-center gap-2">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT_CLASS[statusKey]}`}
                  aria-hidden
                />
                <span
                  className={`text-sm font-medium ${STATUS_TEXT_CLASS[statusKey]}`}
                >
                  {STATUS_LABEL[statusKey]}
                </span>
              </span>
            );
          },
          sessionStart: (row) => (
            <span className="whitespace-nowrap font-mono text-sm font-medium text-gray-900">
              {row.sessionStart}
            </span>
          ),
          workingTime: (row) => (
            <span className="font-mono text-sm font-semibold text-gray-900 tabular-nums">
              {row.workingTime}
            </span>
          ),
          historyDetail: (row) =>
            row.historyDetail ? (
              <span className="text-sm tabular-nums leading-snug text-gray-800">
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
