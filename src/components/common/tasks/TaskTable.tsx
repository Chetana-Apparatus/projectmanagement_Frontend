"use client";

import { Pencil, Trash2 } from "lucide-react";
import DataTable, {
  type DataTableColumn,
} from "@/components/common/table/DataTable";
import Button from "@/components/ui/Button";

export type TaskProgress =
  | "Not Started"
  | "Running"
  | "Paused"
  | "Stopped"
  | "Auto stop"
  | "Complete"
  | "Delayed";

export type Task = {
  id: string;
  name: string;
  description: string;
  project: string;
  milestone: string;
  employee: string;
  assignedBy: string;
  startDate: string;
  expectedDate: string;
  /** Editable task status in forms (maps to API). */
  status:
    | "Not Started"
    | "In Progress"
    | "Completed"
    | "Paused"
    | "Stopped"
    | "Delayed";
  /** Derived progress for the table (timer + status + overdue). */
  progress: TaskProgress;
  /** Work-tracking progress from API (0–100). */
  progressPercent: number;
};

type TaskTableProps = {
  tasks: Task[];
  projectNameMap?: Record<string, string>;
  milestoneNameMap?: Record<string, string>;
  assignedByNameMap?: Record<string, string>;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onOpenProject?: (projectId: string) => void;
  highlightRowId?: string | null;
  deleteBusyId?: string | null;
};

export default function TaskTable({
  tasks,
  projectNameMap = {},
  milestoneNameMap = {},
  assignedByNameMap = {},
  onEdit,
  onDelete,
  onOpenProject,
  highlightRowId = null,
  deleteBusyId = null,
}: TaskTableProps) {
  const progressBadge = (progress: TaskProgress) => {
    const styleMap: Record<TaskProgress, string> = {
      Complete: "bg-green-100 text-green-700 ring-0 shadow-none",
      Running: "bg-blue-100 text-blue-700 ring-0 shadow-none",
      Paused: "bg-violet-100 text-violet-700 ring-0 shadow-none",
      Stopped:
        "border border-amber-400 bg-amber-50 text-amber-950 shadow-sm shadow-amber-200/50",
      "Auto stop":
        "border border-indigo-300 bg-indigo-50 text-indigo-950 shadow-sm shadow-indigo-200/40",
      "Not Started": "bg-gray-100 text-gray-600 ring-0 shadow-none",
      Delayed: "bg-rose-100 text-rose-700 ring-0 shadow-none",
    };
    return (
      <span
        title={
          progress === "Paused"
            ? "Employee paused the timer (can resume)"
            : progress === "Stopped"
              ? "Employee stopped the timer"
              : progress === "Auto stop"
                ? "Timer stopped automatically (e.g. end-of-day cutoff)"
                : undefined
        }
        className={`inline-flex max-w-full justify-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${styleMap[progress]}`}
      >
        {progress}
      </span>
    );
  };

  const columns: DataTableColumn[] = [
    { label: "Task Name", key: "name" },
    { label: "Project", key: "project" },
    { label: "Milestone", key: "milestone" },
    { label: "Assigned Employee", key: "employee" },
    { label: "Start Date", key: "startDate" },
    { label: "Expected date", key: "expectedDate" },
    { label: "Progress", key: "progress" },
    ...(onEdit || onDelete ? [{ label: "Actions", key: "actions" }] : []),
  ];

  return (
    <DataTable
      columns={columns}
      data={tasks}
      emptyMessage="No tasks found"
      highlightRowId={highlightRowId}
      visualVariant="employee"
      cardClassName="items-start justify-start rounded-2xl border border-gray-100 shadow-sm"
      renderers={{
        project: (row) => {
          const label = projectNameMap[row.project] ?? row.project;
          if (onOpenProject) {
            return (
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="block max-w-full truncate text-sm text-cs-text">
                  {label}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenProject(row.project)}
                  className="w-fit cursor-pointer text-left text-sm text-blue-600 hover:underline"
                >
                  View project details
                </button>
              </div>
            );
          }
          return (
            <span className="block max-w-full truncate text-sm text-cs-text">
              {label}
            </span>
          );
        },
        milestone: (row) => (
          <span className="block max-w-full truncate text-sm text-cs-text">
            {milestoneNameMap[row.milestone] ?? row.milestone}
          </span>
        ),
        employee: (row) => (
          <span className="block max-w-full truncate text-sm text-cs-text">
            {row.employee || assignedByNameMap[row.assignedBy] || "—"}
          </span>
        ),
        name: (row) => (
          <span className="block max-w-full truncate text-sm text-cs-text">
            {row.name}
          </span>
        ),
        startDate: (row) => (
          <span className="whitespace-nowrap text-sm tabular-nums text-cs-text">
            {row.startDate || "—"}
          </span>
        ),
        expectedDate: (row) => (
          <span className="whitespace-nowrap text-sm tabular-nums text-cs-text">
            {row.expectedDate ? row.expectedDate.split("T")[0] : "—"}
          </span>
        ),
        progress: (row) => progressBadge(row.progress),
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
                disabled={deleteBusyId === row.id}
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
