"use client";

import {
  CalendarClock,
  CircleCheck,
  FolderKanban,
  ListTodo,
  Timer,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

import ActivityLog, {
  type ActivityLogItem,
} from "@/components/common/activity/ActivityLog";
import Card from "@/components/common/card/Card";
import DashboardCard from "@/components/common/dashboard/DashboardCard";
import StatusBadge from "@/components/common/status/StatusBadge";
import DataTable, {
  type DataTableColumn,
} from "@/components/common/table/DataTable";

/* ================= TYPES ================= */

type ProjectOverviewRow = {
  id: string;
  projectName: string;
  milestone: string;
  deadline: string;
  status: "On Track" | "Delayed";
};

type WorkTrackingRow = {
  id: string;
  employee: string;
  currentFocus: string;
  status: "Running" | "Paused" | "Auto-stopped";
};

/* ================= STATIC (REMOVE LATER WHEN API READY) ================= */

const overviewStats = [
  { title: "Total Users", value: 128, icon: Users },
  { title: "Active Projects", value: 24, icon: FolderKanban },
  { title: "Tasks In Progress", value: 67, icon: ListTodo },
  { title: "Completed Tasks", value: 412, icon: CircleCheck },
  { title: "Active Employees", value: 36, icon: UserCheck },
] as const;

/* ================= COMPONENT ================= */

export default function AdminDashboardPage() {
  // ✅ Backend-ready states
  const [projectRows, setProjectRows] = useState<ProjectOverviewRow[]>([]);
  const [workTracking, setWorkTracking] = useState<WorkTrackingRow[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityLogItem[]>([]);

  /* ================= TEMP DATA (REMOVE AFTER API) ================= */
  useEffect(() => {
    setProjectRows([
      {
        id: "p1",
        projectName: "Atlas CRM",
        milestone: "UAT & rollout",
        deadline: "May 12, 2026",
        status: "On Track",
      },
      {
        id: "p2",
        projectName: "Northwind Mobile",
        milestone: "Sprint 14 - payments",
        deadline: "Apr 28, 2026",
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

  /* ================= TABLE COLUMNS ================= */

  const projectColumns: DataTableColumn[] = [
    { label: "Project Name", key: "projectName" },
    { label: "Current Milestone", key: "milestone" },
    { label: "Deadline", key: "deadline" },
    { label: "Status", key: "status" },
  ];

  const workColumns: DataTableColumn[] = [
    { label: "Employee", key: "employee" },
    { label: "Current Task / Project", key: "currentFocus" },
    { label: "Status", key: "status" },
  ];

  /* ================= UI ================= */

  return (
    <div className="p-6 space-y-10 max-w-7xl mx-auto">
      {/* HEADER */}
      <h3 className="h3 font-bold">Dashboard</h3>

      {/* ================= CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {overviewStats.map((card) => (
          <DashboardCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
          />
        ))}
      </div>

      {/* ================= PROJECT OVERVIEW ================= */}
      <section className="space-y-3">
        <div>
          <h3 className="h3 font-semibold">Project Overview</h3>
          <p className="p1 text-gray-500">
            Milestones, deadlines, and delivery health
          </p>
        </div>

        <DataTable<ProjectOverviewRow>
          columns={projectColumns}
          data={projectRows}
          pageSize={5}
          renderers={{
            status: (_, value) => {
              const status = value as ProjectOverviewRow["status"];
              return (
                <StatusBadge
                  variant={status === "On Track" ? "onTrack" : "delayed"}
                >
                  {status}
                </StatusBadge>
              );
            },
          }}
        />
      </section>

      {/* ================= WORK TRACKING ================= */}
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

          <DataTable<WorkTrackingRow>
            columns={workColumns}
            data={workTracking}
            pageSize={5}
            renderers={{
              status: (_, value) => {
                const status = value as WorkTrackingRow["status"];

                const styles = {
                  Running: "bg-green-100 text-green-600",
                  Paused: "bg-yellow-100 text-yellow-600",
                  "Auto-stopped": "bg-gray-100 text-gray-600",
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

      {/* ================= RECENT ACTIVITY ================= */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
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
