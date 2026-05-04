"use client";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  Activity,
  CircleCheck,
  ListChecks,
  ListTodo,
  PauseCircle,
  PlayCircle,
  Square,
} from "lucide-react";
import { useMemo } from "react";
import Card from "@/components/common/card/Card";
import DashboardCard from "@/components/common/dashboard/DashboardCard";
import StatusBadge from "@/components/common/status/StatusBadge";
import Button from "@/components/ui/Button";
import { useEmployeeTasks } from "@/features/employee-tasks/EmployeeTasksProvider";
import type { ManagedTaskStatus } from "@/features/employee-tasks/status";

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
  milestone: string;
  startDate: string;
  expectedDate: string;
  status: ManagedTaskStatus;
};

const columns: ColumnsType<DashboardTaskRow> = [
  {
    title: "Task Name",
    dataIndex: "taskName",
    key: "taskName",
    align: "center",
  },
  {
    title: "Project",
    dataIndex: "project",
    key: "project",
    align: "center",
  },
  {
    title: "Milestone",
    dataIndex: "milestone",
    key: "milestone",
    align: "center",
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
];

export default function EmployeeDashboardPage() {
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
          milestone: task.milestone,
          startDate: task.startDate,
          expectedDate: task.deadline,
          status: task.status,
        })),
    [myTasks],
  );
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
        icon: ListChecks,
      },
      {
        label: "Paused",
        value: tasks.filter((task) => task.status === "Paused").length,
        valueClass: "text-yellow-700",
        icon: PauseCircle,
      },
      {
        label: "Completed",
        value: completedTasksCount,
        valueClass: "text-green-700",
        icon: CircleCheck,
      },
      {
        label: "Total Tasks",
        value: tasks.length,
        valueClass: "text-cs-primary-100",
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
              <span className="font-semibold">
                {activeTask?.project ?? "No active task"}
              </span>
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
                className="flex items-start justify-between rounded-xl border border-cs-border p-3"
              >
                <div className="flex items-start gap-3">
                  <Activity className="mt-0.5 size-4 text-cs-primary-100" />
                  <div>
                    <p className="p1 font-medium text-cs-heading">
                      {item.action.replaceAll("_", " ")}
                    </p>
                    <p className="p1 text-cs-text">{item.description}</p>
                  </div>
                </div>
                <p className="p1 text-cs-text">{item.time}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
