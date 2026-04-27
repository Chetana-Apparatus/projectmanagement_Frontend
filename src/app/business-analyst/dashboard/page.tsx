"use client";

import { Progress, Table, type TableColumnsType } from "antd";
import {
  CalendarClock,
  CircleCheck,
  FolderKanban,
  ListTodo,
  Timer,
  UserCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

import ActivityLog, {
  type ActivityLogItem,
} from "@/components/common/activity/ActivityLog";
import Card from "@/components/common/card/Card";
import DashboardCard from "@/components/common/dashboard/DashboardCard";
import StatusBadge from "@/components/common/status/StatusBadge";
import { calculateProgress, getProgressColor } from "@/utils/progress";

type ProjectOverviewRow = {
  id: string;
  projectName: string;
  milestone: string;
  startDate: string;
  endDate: string;
  status: "On Track" | "Delayed";
};

type WorkTrackingRow = {
  id: string;
  employee: string;
  currentFocus: string;
  status: "Running" | "Paused" | "Auto-stopped";
};

const overviewStats = [
  { title: "Active Projects", value: 24, icon: FolderKanban },
  { title: "Tasks In Progress", value: 67, icon: ListTodo },
  { title: "Completed Tasks", value: 412, icon: CircleCheck },
  { title: "Active Employees", value: 36, icon: UserCheck },
] as const;

export default function BADashboardPage() {
  const [projectRows, setProjectRows] = useState<ProjectOverviewRow[]>([]);
  const [workTracking, setWorkTracking] = useState<WorkTrackingRow[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityLogItem[]>([]);

  useEffect(() => {
    setProjectRows([
      {
        id: "p1",
        projectName: "Atlas CRM",
        milestone: "UAT & rollout",
        startDate: "2026-04-01",
        endDate: "2026-05-12",
        status: "On Track",
      },
      {
        id: "p2",
        projectName: "Northwind Mobile",
        milestone: "Sprint 14 - payments",
        startDate: "2026-04-08",
        endDate: "2026-04-28",
        status: "Delayed",
      },
    ]);

    setWorkTracking([
      {
        id: "w1",
        employee: "Maya Chen",
        currentFocus: "Atlas CRM - API integration",
        status: "Running",
      },
      {
        id: "w2",
        employee: "Jordan Blake",
        currentFocus: "Helios Analytics - ETL jobs",
        status: "Paused",
      },
    ]);

    setActivityItems([
      {
        id: "a1",
        label: "Task started",
        detail: "Maya Chen - API integration",
        time: "09:14",
      },
      {
        id: "a2",
        label: "Task paused",
        detail: "Jordan Blake - ETL jobs",
        time: "11:02",
      },
    ]);
  }, []);

  const projectColumns: TableColumnsType<ProjectOverviewRow> = [
    {
      title: "Project Name",
      dataIndex: "projectName",
      key: "projectName",
    },
    {
      title: "Current Milestone",
      dataIndex: "milestone",
      key: "milestone",
    },
    {
      title: "Progress",
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
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: ProjectOverviewRow["status"]) => (
        <StatusBadge variant={status === "On Track" ? "onTrack" : "delayed"}>
          {status}
        </StatusBadge>
      ),
    },
  ];

  const workColumns: TableColumnsType<WorkTrackingRow> = [
    {
      title: "Employee",
      dataIndex: "employee",
      key: "employee",
    },
    {
      title: "Current Task / Project",
      dataIndex: "currentFocus",
      key: "currentFocus",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: WorkTrackingRow["status"]) => {
        const styles = {
          Running: "bg-green-100 text-green-600",
          Paused: "bg-yellow-100 text-yellow-600",
          "Auto-stopped": "bg-gray-100 text-gray-600",
        };

        return (
          <span className={`rounded-full px-2 py-1 text-xs ${styles[status]}`}>
            {status}
          </span>
        );
      },
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-10 p-6">
      <h3 className="h3 font-bold">Dashboard</h3>

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
            Milestones, deadlines, and delivery health
          </p>
        </div>

        <Table<ProjectOverviewRow>
          rowKey="id"
          columns={projectColumns}
          dataSource={projectRows}
          bordered
          pagination={{ pageSize: 5, showSizeChanger: false }}
          scroll={{ x: 760 }}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="h3 font-semibold">Work Tracking Summary</h3>
          <p className="p1 text-gray-500">Who is working on what</p>
        </div>

        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2 text-sm text-orange-600">
            <Timer size={16} />
            Auto-stopped at 8 PM (Mon–Fri)
          </div>

          <Table<WorkTrackingRow>
            rowKey="id"
            columns={workColumns}
            dataSource={workTracking}
            bordered
            pagination={{ pageSize: 5, showSizeChanger: false }}
            scroll={{ x: 640 }}
          />
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock size={18} className="text-gray-400" />
            <h3 className="h3 font-semibold">Recent Activity</h3>
          </div>
          <span className="p1 text-gray-400">Live</span>
        </div>

        <ActivityLog items={activityItems} />
      </section>
    </div>
  );
}
