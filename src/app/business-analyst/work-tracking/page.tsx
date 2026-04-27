"use client";

import { Progress, Table, type TableColumnsType } from "antd";
import { useEffect, useState } from "react";
import Card from "@/components/common/card/Card";
import { calculateProgress, getProgressColor } from "@/utils/progress";

type WorkLog = {
  id: string;
  employee: string;
  project: string;
  milestone: string;
  task: string;
  status: "running" | "paused" | "stopped" | "auto-stopped" | "delayed";
  startDate: string;
  endDate: string;
  startTime: string;
  totalTime: string;
};

const mockLogs: WorkLog[] = [
  {
    id: "1",
    employee: "Chetana",
    project: "Website Synap",
    milestone: "UI Design",
    task: "Dashboard UI",
    status: "auto-stopped",
    startDate: "2026-04-01",
    endDate: "2026-04-30",
    startTime: "10:00 AM",
    totalTime: "2h 15m",
  },
  {
    id: "2",
    employee: "Pratik",
    project: "Backend Website Synap",
    milestone: "API",
    task: "Login API",
    status: "stopped",
    startDate: "2026-04-10",
    endDate: "2026-05-15",
    startTime: "11:30 AM",
    totalTime: "1h 10m",
  },
  {
    id: "3",
    employee: "Jyotsna",
    project: "Website Nag Foundation",
    milestone: "Frontend",
    task: "Home Page",
    status: "running",
    startDate: "2026-04-15",
    endDate: "2026-06-01",
    startTime: "09:00 AM",
    totalTime: "3h 30m",
  },
  {
    id: "4",
    employee: "Jyotsna",
    project: "Website Nag Foundation",
    milestone: "Frontend",
    task: "Home Page",
    status: "running",
    startDate: "2026-04-15",
    endDate: "2026-06-01",
    startTime: "09:00 AM",
    totalTime: "3h 30m",
  },
  {
    id: "5",
    employee: "Jyotsna",
    project: "Website Nag Foundation",
    milestone: "Frontend",
    task: "Home Page",
    status: "running",
    startDate: "2026-04-15",
    endDate: "2026-06-01",
    startTime: "09:00 AM",
    totalTime: "3h 30m",
  },
  {
    id: "6",
    employee: "Jyotsna",
    project: "Website Nag Foundation",
    milestone: "Frontend",
    task: "Home Page",
    status: "running",
    startDate: "2026-04-15",
    endDate: "2026-06-01",
    startTime: "09:00 AM",
    totalTime: "3h 30m",
  },
  {
    id: "7",
    employee: "Jyotsna",
    project: "Website Nag Foundation",
    milestone: "Frontend",
    task: "Home Page",
    status: "running",
    startDate: "2026-04-15",
    endDate: "2026-06-01",
    startTime: "09:00 AM",
    totalTime: "3h 30m",
  },
  {
    id: "8",
    employee: "Jyotsna",
    project: "Website Nag Foundation",
    milestone: "Frontend",
    task: "Home Page",
    status: "running",
    startDate: "2026-04-15",
    endDate: "2026-06-01",
    startTime: "09:00 AM",
    totalTime: "3h 30m",
  },
  {
    id: "9",
    employee: "Jyotsna",
    project: "Website Nag Foundation",
    milestone: "Frontend",
    task: "Home Page",
    status: "running",
    startDate: "2026-04-15",
    endDate: "2026-06-01",
    startTime: "09:00 AM",
    totalTime: "3h 30m",
  },
  {
    id: "10",
    employee: "Jyotsna",
    project: "Website Nag Foundation",
    milestone: "Frontend",
    task: "Home Page",
    status: "running",
    startDate: "2026-04-15",
    endDate: "2026-06-01",
    startTime: "09:00 AM",
    totalTime: "3h 30m",
  },
  {
    id: "11",
    employee: "Jyotsna",
    project: "Website Nag Foundation",
    milestone: "Frontend",
    task: "Home Page",
    status: "running",
    startDate: "2026-04-15",
    endDate: "2026-06-01",
    startTime: "09:00 AM",
    totalTime: "3h 30m",
  },
];

export default function BAWorkTrackingPage() {
  const [logs, setLogs] = useState<WorkLog[]>(mockLogs);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      setLogs((prev) =>
        prev.map((log) => {
          if (log.status === "running") {
            const start = new Date(`1970-01-01 ${log.startTime}`);
            const diffHours =
              (now.getTime() - start.getTime()) / (1000 * 60 * 60);

            if (diffHours >= 2 && diffHours < 4) {
              return { ...log, status: "delayed" };
            }

            if (diffHours >= 4) {
              console.log(`AUTO STOP + EMAIL → ${log.employee}`);

              return {
                ...log,
                status: "auto-stopped",
              };
            }
          }

          return log;
        }),
      );
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const columns: TableColumnsType<WorkLog> = [
    { title: "EMPLOYEE", dataIndex: "employee", key: "employee" },
    { title: "PROJECT", dataIndex: "project", key: "project" },
    { title: "MILESTONE", dataIndex: "milestone", key: "milestone" },
    { title: "TASK", dataIndex: "task", key: "task" },
    {
      title: "PROGRESS",
      key: "progress",
      render: (_, row) => {
        const percent = calculateProgress(row.startDate, row.endDate);

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
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      render: (status: WorkLog["status"]) => {
        const styles = {
          running: "bg-green-100 text-green-600",
          paused: "bg-yellow-100 text-yellow-600",
          stopped: "bg-gray-100 text-gray-600",
          delayed: "bg-orange-100 text-orange-600",
          "auto-stopped": "bg-red-100 text-red-600",
        };

        const labels = {
          running: "Running",
          paused: "Paused",
          stopped: "Stopped",
          delayed: "Delayed",
          "auto-stopped": "Auto-Stopped",
        };

        return (
          <span
            className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-xs ${styles[status]}`}
          >
            {labels[status]}
          </span>
        );
      },
    },
    { title: "START TIME", dataIndex: "startTime", key: "startTime" },
    { title: "TOTAL TIME", dataIndex: "totalTime", key: "totalTime" },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="ui-page-title">Work Tracking</h1>
        <p className="ui-body-muted">
          Monitor employee work activity in real-time
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 !flex-row !items-center !justify-between">
          <p className="text-gray-500">Active Employees</p>
          <h2 className="text-xl font-bold text-green-600">
            {logs.filter((l) => l.status === "running").length}
          </h2>
        </Card>

        <Card className="p-4 !flex-row !items-center !justify-between">
          <p className="text-gray-500">Paused Tasks</p>
          <h2 className="text-xl font-bold text-yellow-600">
            {logs.filter((l) => l.status === "paused").length}
          </h2>
        </Card>

        <Card className="p-4 !flex-row !items-center !justify-between">
          <p className="text-gray-500">Delayed Tasks</p>
          <h2 className="text-xl font-bold text-orange-600">
            {logs.filter((l) => l.status === "delayed").length}
          </h2>
        </Card>

        <Card className="p-4 !flex-row !items-center !justify-between">
          <p className="text-gray-500">Auto-Stopped</p>
          <h2 className="text-xl font-bold text-red-600">
            {logs.filter((l) => l.status === "auto-stopped").length}
          </h2>
        </Card>
      </div>

      <Table<WorkLog>
        rowKey="id"
        columns={columns}
        dataSource={logs}
        bordered
        pagination={{ pageSize: 5, showSizeChanger: false }}
        scroll={{ x: 1100 }}
      />
    </div>
  );
}
