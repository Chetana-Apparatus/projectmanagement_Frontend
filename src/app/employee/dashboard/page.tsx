"use client";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CircleCheck,
  ListChecks,
  ListTodo,
  PauseCircle,
  PlayCircle,
  Square,
} from "lucide-react";
import { useMemo, useState } from "react";
import Card from "@/components/common/card/Card";
import DashboardCard from "@/components/common/dashboard/DashboardCard";
import StatusBadge from "@/components/common/status/StatusBadge";
import ProjectDetailModal from "@/components/common/work-tracking/ProjectDetailModal";
import Button from "@/components/ui/Button";
import { useEmployeeTasks } from "@/features/employee-tasks/EmployeeTasksProvider";
import {
  type ManagedTaskStatus,
  employeeProjectLinkClass,
  employeeProjectLinkTableClass,
  statusBadgeLayoutClass,
} from "@/features/employee-tasks/status";

const ACTIVITY_ACTION_BADGE_CLASS: Record<
  "STARTED" | "PAUSED" | "STOPPED" | "COMPLETED",
  string
> = {
  STARTED: "bg-blue-100 text-blue-700",
  PAUSED: "bg-yellow-100 text-yellow-700",
  STOPPED: "bg-red-100 text-red-700",
  COMPLETED: "bg-green-100 text-green-700",
};

function getStatusVariant(status: ManagedTaskStatus) {
  switch (status) {
    case "In Progress":
      return "taskInProgress";
    case "Paused":
      return "taskPaused";
    case "Stopped":
      return "taskStopped";
    case "Completed":
      return "taskCompleted";
    case "Delayed":
      return "delayed";
    case "Blocked":
    case "Not Started":
      return "deactivated";
    default:
      return "deactivated";
  }
}

type DashboardTaskRow = {
  key: string;
  taskName: string;
  project: string;
  projectId: string;
  milestone: string;
  startDate: string;
  expectedDate: string;
  status: ManagedTaskStatus;
};

function formatExpectedEndDate(value: string) {
  if (!value || value === "-") return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
}

export default function EmployeeDashboardPage() {
  const [projectModalId, setProjectModalId] = useState<number | null>(null);
  const {
    loading,
    tasks,
    myTasks,
    activeTask,
    completedTasksCount,
    recentActivity,
    startTask,
    pauseTask,
    stopTask,
    canTransition,
  } = useEmployeeTasks();

  const dashboardTasks = useMemo<DashboardTaskRow[]>(
    () =>
      myTasks
        .filter(
          (task) =>
            task.status === "In Progress" ||
            task.status === "Paused" ||
            task.status === "Stopped",
        )
        .map((task) => ({
          key: task.id,
          taskName: task.task,
          project: task.project,
          projectId: task.projectId,
          milestone: task.milestone,
          startDate: task.startDate,
          expectedDate: task.deadline,
          status: task.status,
        })),
    [myTasks],
  );

  const columns = useMemo<ColumnsType<DashboardTaskRow>>(
    () => [
      {
        title: "Task Name",
        dataIndex: "taskName",
        key: "taskName",
        align: "center",
      },
      {
        title: "Project",
        key: "project",
        align: "center",
        render: (_, record) => {
          const rawPid = record.projectId?.trim() ?? "";
          const projectNumericId =
            rawPid !== "" && !Number.isNaN(Number(rawPid))
              ? Number(rawPid)
              : null;
          return projectNumericId != null ? (
            <button
              type="button"
              className={employeeProjectLinkTableClass}
              onClick={() => setProjectModalId(projectNumericId)}
              aria-label={`View project details: ${record.project}`}
            >
              {record.project}
            </button>
          ) : (
            <span className="text-cs-text">{record.project}</span>
          );
        },
      },
      {
        title: "Milestone",
        dataIndex: "milestone",
        key: "milestone",
        align: "center",
      },
      {
        title: "Expected End Date",
        dataIndex: "expectedDate",
        key: "expectedDate",
        align: "center",
        render: (value: string) => formatExpectedEndDate(value),
      },
      {
        title: "Status",
        key: "status",
        align: "center",
        render: (_, record) => (
          <StatusBadge variant={getStatusVariant(record.status)}>
            {record.status}
          </StatusBadge>
        ),
      },
    ],
    [],
  );

  const activeProjectNumericId = useMemo(() => {
    const raw = activeTask?.projectId?.trim() ?? "";
    if (raw === "" || Number.isNaN(Number(raw))) return null;
    return Number(raw);
  }, [activeTask?.projectId]);
  const isRunning = activeTask?.status === "In Progress";

  const handleStart = async () => {
    if (!activeTask) return;
    await startTask(activeTask.id);
  };

  const handlePause = async () => {
    if (!activeTask) return;
    await pauseTask(activeTask.id);
  };

  const handleStop = async () => {
    if (!activeTask) return;
    await stopTask(activeTask.id);
  };

  const summaryStats = useMemo(
    () => [
      {
        label: "In Progress",
        value: tasks.filter((task) => task.status === "In Progress").length,
        valueClass: "text-blue-600",
        iconClassName: "text-blue-600",
        iconWrapperClassName: "bg-blue-100",
        icon: ListChecks,
      },
      {
        label: "Paused",
        value: tasks.filter((task) => task.status === "Paused").length,
        valueClass: "text-yellow-700",
        iconClassName: "text-yellow-700",
        iconWrapperClassName: "bg-yellow-100",
        icon: PauseCircle,
      },
      {
        label: "Completed",
        value: completedTasksCount,
        valueClass: "text-green-700",
        iconClassName: "text-green-600",
        iconWrapperClassName: "bg-green-100",
        icon: CircleCheck,
      },
      {
        label: "Total Tasks",
        value: tasks.length,
        valueClass: "text-cs-primary-100",
        iconClassName: "text-cs-primary-100",
        iconWrapperClassName: "bg-sky-100",
        icon: ListTodo,
      },
    ],
    [tasks, completedTasksCount],
  );

  const canStart = activeTask
    ? canTransition(activeTask.status, "In Progress")
    : false;
  const canPause = activeTask
    ? canTransition(activeTask.status, "Paused")
    : false;
  const canStop = activeTask
    ? canTransition(activeTask.status, "Stopped")
    : false;
  const disableAllActions = !activeTask || activeTask.status === "Completed";

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Card
        className={`items-start justify-start rounded-2xl border shadow-sm ${
          activeTask?.status === "In Progress"
            ? "border-emerald-400"
            : "border-cs-border"
        }`}
      >
        <div className="w-full space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="h2 text-cs-heading">Active Task</h2>
            {activeTask ? (
              <StatusBadge variant={getStatusVariant(activeTask.status)}>
                {activeTask.status}
              </StatusBadge>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 text-left">
            <p className="text-base text-cs-text">
              <span className="mr-1 font-medium text-cs-heading">Project:</span>
              {activeTask && activeProjectNumericId != null ? (
                <button
                  type="button"
                  className={employeeProjectLinkClass}
                  onClick={() => setProjectModalId(activeProjectNumericId)}
                  aria-label={`View project details: ${activeTask.project}`}
                >
                  {activeTask.project}
                </button>
              ) : (
                <span className="font-semibold">
                  {activeTask?.project ?? "No active task"}
                </span>
              )}
            </p>
            <p className="text-base text-cs-text">
              <span className="mr-1 font-medium text-cs-heading">
                Milestone:
              </span>
              <span className="font-semibold">
                {activeTask?.milestone ?? "-"}
              </span>
            </p>
            <p className="text-base text-cs-text">
              <span className="mr-1 font-medium text-cs-heading">Task:</span>
              <span className="font-semibold">
                {activeTask?.task ?? "No active task"}
              </span>
            </p>
          </div>
          {loading ? (
            <p className="p1 text-cs-text">Loading employee dashboard…</p>
          ) : null}
          <div className="flex w-full justify-end items-center gap-3">
            {!isRunning ? (
              <Button
                className="h-9 px-4 text-md"
                disabled={disableAllActions || !canStart}
                onClick={handleStart}
              >
                <PlayCircle className="size-4" />
                Start
              </Button>
            ) : (
              <>
                <Button
                  className="h-9  bg-transparent px-4 text-md text-rose-600  hover:text-rose-700"
                  disabled={disableAllActions || !canStop}
                  onClick={handleStop}
                >
                  <Square className="size-4" />
                  Stop
                </Button>
                <Button
                  variant="secondary"
                  className="h-9 px-4 text-md"
                  disabled={disableAllActions || !canPause || !isRunning}
                  onClick={handlePause}
                >
                  <PauseCircle className="size-4" />
                  Pause
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {summaryStats.map((stat) => (
          <DashboardCard
            key={stat.label}
            title={stat.label}
            value={stat.value}
            icon={stat.icon}
            valueClassName={stat.valueClass}
            iconClassName={stat.iconClassName}
            iconWrapperClassName={stat.iconWrapperClassName}
          />
        ))}
      </div>

      <Card className="items-start justify-start rounded-2xl shadow-sm">
        <div className="w-full space-y-4">
          <h2 className="h2 text-cs-heading">My Tasks</h2>
          <Table<DashboardTaskRow>
            columns={columns}
            dataSource={dashboardTasks}
            pagination={{ pageSize: 5 }}
            scroll={{ x: 900 }}
          />
        </div>
      </Card>

      <Card className="items-start justify-start rounded-2xl shadow-sm">
        <div className="w-full space-y-4">
          <h2 className="h2 text-cs-heading">Recent Activity</h2>
          <div className="max-h-72 space-y-3 overflow-y-auto pr-1 scroll-smooth">
            {recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-cs-border bg-white p-3"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span
                    className="mt-1.5 size-2 shrink-0 rounded-full bg-sky-400"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <span
                      className={`${statusBadgeLayoutClass} font-semibold uppercase tracking-wide ${ACTIVITY_ACTION_BADGE_CLASS[item.action] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {item.action.replaceAll("_", " ")}
                    </span>
                    <p className="p1 text-cs-text">{item.description}</p>
                  </div>
                </div>
                <p className="p1 shrink-0 whitespace-nowrap text-cs-text">
                  {item.time}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <ProjectDetailModal
        open={projectModalId != null}
        projectId={projectModalId}
        onClose={() => setProjectModalId(null)}
      />
    </div>
  );
}
