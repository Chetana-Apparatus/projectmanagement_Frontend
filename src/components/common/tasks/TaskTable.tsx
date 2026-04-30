"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import DataTable, {
  type DataTableColumn,
} from "@/components/common/table/DataTable";
import Button from "@/components/ui/Button";

export type Task = {
  id: string;
  name: string;
  project: string;
  milestone: string;
  employee: string;
  assignedBy: string;
  startDate: string;
  endDate: string;
  status: "Not Started" | "In Progress" | "Completed" | "Paused" | "Stopped";
};

type TaskTableProps = {
  tasks: Task[];
  projectNameMap?: Record<string, string>;
  projectHrefMap?: Record<string, string>;
  milestoneNameMap?: Record<string, string>;
  assignedByNameMap?: Record<string, string>;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  highlightRowId?: string | null;
};

export default function TaskTable({
  tasks,
  projectNameMap = {},
  projectHrefMap = {},
  milestoneNameMap = {},
  assignedByNameMap = {},
  onEdit,
  onDelete,
  highlightRowId = null,
}: TaskTableProps) {
  const progressBadge = (status: Task["status"]) => {
    const styleMap: Record<Task["status"], string> = {
      Completed: "bg-emerald-100 text-emerald-700",
      "In Progress": "bg-blue-100 text-blue-700",
      Paused: "bg-amber-100 text-amber-700",
      Stopped: "bg-rose-100 text-rose-700",
      "Not Started": "bg-slate-100 text-slate-700",
    };
    return (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${styleMap[status]}`}
      >
        {status}
      </span>
    );
  };

  const columns: DataTableColumn[] = [
    { label: "Task Name", key: "name" },
    { label: "Project", key: "project" },
    { label: "Milestone", key: "milestone" },
    { label: "Assigned Employee", key: "employee" },
    { label: "Start Date", key: "startDate" },
    { label: "End Date", key: "endDate" },
    { label: "Progress", key: "progress" },
    ...(onEdit || onDelete ? [{ label: "Actions", key: "actions" }] : []),
  ];

  return (
    <DataTable<Task>
      columns={columns}
      data={tasks}
      emptyMessage="No tasks found"
      highlightRowId={highlightRowId}
      renderers={{
        project: (row) => {
          const label = projectNameMap[row.project] ?? row.project;
          const href = projectHrefMap[row.project];
          if (!href) return label;
          return (
            <div className="flex flex-col">
              <span>{label}</span>
              <Link
                href={href}
                className="text-xs text-sky-700 underline underline-offset-2 hover:text-sky-900"
              >
                Open Project
              </Link>
            </div>
          );
        },
        milestone: (row) => milestoneNameMap[row.milestone] ?? row.milestone,
        employee: (row) =>
          row.employee || assignedByNameMap[row.assignedBy] || "-",
        status: (row) => progressBadge(row.status),
        progress: (row) => {
          return progressBadge(row.status);
        },
        actions: (row) => (
          <div className="flex items-center justify-end gap-2">
            {onEdit ? (
              <Button
                type="button"
                variant="secondary"
                className="flex h-8 w-8 items-center justify-center border-sky-200 text-sky-600 hover:border-sky-200 hover:bg-sky-50"
                onClick={() => onEdit(row)}
                aria-label={`Edit task ${row.name}`}
              >
                <Pencil size={16} />
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                type="button"
                variant="secondary"
                className="flex h-8 w-8 items-center justify-center border-red-200 text-red-600 hover:border-red-200 hover:bg-red-50"
                onClick={() => onDelete(row)}
                aria-label={`Delete task ${row.name}`}
              >
                <Trash2 size={16} />
              </Button>
            ) : null}
          </div>
        ),
      }}
    />
  );
}
