"use client";

import { useEffect, useState } from "react";
import Card from "@/components/common/card/Card";
import DataTable, {
  type DataTableColumn,
} from "@/components/common/table/DataTable";

type WorkLog = {
  id: string;
  employee: string;
  project: string;
  milestone: string;
  task: string;
  status: "running" | "paused" | "stopped" | "auto-stopped" | "delayed";
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
    startTime: "09:00 AM",
    totalTime: "3h 30m",
  },
];

export default function AdminWorkTrackingPage() {
  const [logs, setLogs] = useState<WorkLog[]>(mockLogs);

  // ⏱ AUTO + DELAY LOGIC
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      setLogs((prev) =>
        prev.map((log) => {
          if (log.status === "running") {
            const start = new Date(`1970-01-01 ${log.startTime}`);
            const diffHours =
              (now.getTime() - start.getTime()) / (1000 * 60 * 60);

            // ⚠️ Delayed after 2 hrs
            if (diffHours >= 2 && diffHours < 4) {
              return { ...log, status: "delayed" };
            }

            // ⛔ Auto-stop after 4 hrs
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

  // 📊 TABLE COLUMNS (NO ACTION COLUMN)
  const columns: DataTableColumn[] = [
    { label: "Employee", key: "employee" },
    { label: "Project", key: "project" },
    { label: "Milestone", key: "milestone" },
    { label: "Task", key: "task" },
    { label: "Status", key: "status" },
    { label: "Start Time", key: "startTime" },
    { label: "Total Time", key: "totalTime" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="ui-page-title">Work Tracking</h1>
        <p className="ui-body-muted">
          Monitor employee work activity in real-time
        </p>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* TABLE */}
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
          status: (row) => {
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
                className={`inline-flex whitespace-nowrap px-2 py-1 text-xs rounded-full ${styles[row.status]}`}
              >
                {labels[row.status]}
              </span>
            );
          },
        }}
      />
    </div>
  );
}
