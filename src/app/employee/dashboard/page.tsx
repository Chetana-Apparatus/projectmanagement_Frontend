"use client";

import { Modal, Progress, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Activity, PauseCircle, PlayCircle, Square } from "lucide-react";
import { useMemo } from "react";
import Card from "@/components/common/card/Card";
import StatusBadge from "@/components/common/status/StatusBadge";
import Button from "@/components/ui/Button";
import { useEmployeeTasks } from "@/features/employee-tasks/EmployeeTasksProvider";
import type { ManagedTaskStatus } from "@/features/employee-tasks/status";
import { calculateProgress, getProgressColor } from "@/utils/progress";

type ActivityItem = {
  id: string;
  action: "Task started" | "Task paused" | "Task auto-stopped";
  description: string;
  time: string;
};

const recentActivity: ActivityItem[] = [
  {
    id: "a1",
    action: "Task started",
    description: "Implement discount validation edge cases",
    time: "10:12 AM",
  },
  {
    id: "a2",
    action: "Task paused",
    description: "Fix role-based route access bug",
    time: "09:46 AM",
  },
  {
    id: "a3",
    action: "Task auto-stopped",
    description: "Refactor invoice export utility",
    time: "Yesterday, 06:02 PM",
  },
  {
    id: "a4",
    action: "Task started",
    description: "Improve timeline loading states",
    time: "Yesterday, 03:18 PM",
  },
];

function getStatusVariant(status: ManagedTaskStatus) {
  switch (status) {
    case "In Progress":
      return "onTrack";
    case "Auto-stopped":
      return "delayed";
    case "Pending":
    case "Paused":
      return "active";
    case "Not Started":
    case "Completed":
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
  endDate: string;
  status: ManagedTaskStatus;
};

const columns: ColumnsType<DashboardTaskRow> = [
  {
    title: "Task Name",
    dataIndex: "taskName",
    key: "taskName",
  },
  {
    title: "Project",
    dataIndex: "project",
    key: "project",
  },
  {
    title: "Milestone",
    dataIndex: "milestone",
    key: "milestone",
  },
  {
    title: "Progress",
    key: "progress",
    render: (_, record) => {
      const percent = calculateProgress(record.startDate, record.endDate);
      return (
        <div className="min-w-[140px] max-w-[180px]">
          <Progress
            percent={percent}
            strokeColor={getProgressColor(percent)}
            size="small"
            format={(value) => `${value ?? 0}%`}
          />
        </div>
      );
    },
  },
  {
    title: "Status",
    key: "status",
    render: (_, record) => (
      <StatusBadge variant={getStatusVariant(record.status)}>
        {record.status}
      </StatusBadge>
    ),
  },
];

export default function EmployeeDashboardPage() {
  const {
    tasks,
    myTasks,
    activeTask,
    startTask,
    pauseTask,
    stopTask,
    canTransition,
  } = useEmployeeTasks();

  const dashboardTasks = useMemo<DashboardTaskRow[]>(
    () =>
      myTasks.map((task) => ({
        key: task.id,
        taskName: task.task,
        project: task.project,
        milestone: task.milestone,
        startDate: task.startDate,
        endDate: task.deadline,
        status: task.status,
      })),
    [myTasks],
  );

  const handleStart = () => {
    if (!activeTask) return;
    startTask(activeTask.id);
  };

  const handlePause = () => {
    if (!activeTask) return;
    pauseTask(activeTask.id);
  };

  const handleStop = () => {
    if (!activeTask) return;
    Modal.confirm({
      title: "Stop this task?",
      content: "This task will be moved to Work History.",
      okText: "Yes, Stop",
      cancelText: "Cancel",
      onOk: () => {
        stopTask(activeTask.id);
      },
    });
  };

  const summaryStats = useMemo(
    () => [
      {
        label: "Not Started",
        value: tasks.filter((task) => task.status === "Not Started").length,
        valueClass: "text-gray-600",
      },
      {
        label: "In Progress",
        value: tasks.filter((task) => task.status === "In Progress").length,
        valueClass: "text-blue-600",
      },
      {
        label: "Paused",
        value: tasks.filter((task) => task.status === "Paused").length,
        valueClass: "text-violet-600",
      },
      {
        label: "Completed",
        value: tasks.filter((task) => task.status === "Completed").length,
        valueClass: "text-emerald-600",
      },
      {
        label: "Total Tasks",
        value: tasks.length,
        valueClass: "text-cs-primary-100",
      },
    ],
    [tasks],
  );

  const canStart = activeTask
    ? canTransition(activeTask.status, "In Progress")
    : false;
  const canPause = activeTask
    ? canTransition(activeTask.status, "Paused")
    : false;
  const canStop = activeTask
    ? canTransition(activeTask.status, "Completed")
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
          <div className="grid gap-3 text-sm text-cs-text md:grid-cols-2">
            <p className="p1">
              <span className="p1 text-cs-heading">Project:</span>{" "}
              {activeTask?.project ?? "No active task"}
            </p>
            <p className="p1">
              <span className="p1 text-cs-heading">Milestone:</span>{" "}
              {activeTask?.milestone ?? "-"}
            </p>
            <p className="md:col-span-2 p1">
              <span className="p1 font-medium text-cs-heading">Task:</span>{" "}
              {activeTask?.task ?? "No active task"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              className="h-8 px-3 text-xs"
              disabled={disableAllActions || !canStart}
              onClick={handleStart}
            >
              <PlayCircle className="size-4" />
              Start
            </Button>
            <Button
              variant="secondary"
              className="h-8 px-3 text-xs"
              disabled={disableAllActions || !canPause}
              onClick={handlePause}
            >
              <PauseCircle className="size-4" />
              Pause
            </Button>
            <Button
              variant="ghost"
              className="h-8 border border-gray-300 bg-transparent px-3 text-xs text-rose-600 hover:border-gray-400 hover:text-rose-700"
              disabled={disableAllActions || !canStop}
              onClick={handleStop}
            >
              <Square className="size-4" />
              Stop
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {summaryStats.map((stat) => (
          <Card
            key={stat.label}
            className="items-start justify-start rounded-2xl shadow-sm"
          >
            <div className="flex w-full items-center justify-between">
              <p className="p1 text-cs-text">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.valueClass}`}>
                {stat.value}
              </p>
            </div>
          </Card>
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
          <div className="space-y-3">
            {recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between rounded-xl border border-cs-border p-3"
              >
                <div className="flex items-start gap-3">
                  <Activity className="mt-0.5 size-4 text-cs-primary-100" />
                  <div>
                    <p className="p1 font-medium text-cs-heading">
                      {item.action}
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
