"use client";

import { Progress } from "antd";
import { Pencil, Trash2 } from "lucide-react";
import DataTable, {
  type DataTableColumn,
} from "@/components/common/table/DataTable";
import Button from "@/components/ui/Button";
import { calculateProgress, getProgressColor } from "@/utils/progress";

export type Task = {
  id: string;
  name: string;
  project: string;
  milestone: string;
  employee: string;
  assignedBy: string;
  startDate: string;
  endDate: string;
  status: "Not Started" | "Pending" | "In Progress" | "Completed";
};

type TaskTableProps = {
  tasks: Task[];
  projectNameMap?: Record<string, string>;
  milestoneNameMap?: Record<string, string>;
  assignedByNameMap?: Record<string, string>;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
};

export default function TaskTable({
  tasks,
  projectNameMap = {},
  milestoneNameMap = {},
  assignedByNameMap = {},
  onEdit,
  onDelete,
}: TaskTableProps) {
  const columns: DataTableColumn[] = [
    { label: "Task Name", key: "name" },
    { label: "Project", key: "project" },
    { label: "Milestone", key: "milestone" },
    { label: "Assigned By", key: "assignedBy" },
    { label: "Status", key: "status" },
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
      renderers={{
        project: (row) => projectNameMap[row.project] ?? row.project,
        milestone: (row) => milestoneNameMap[row.milestone] ?? row.milestone,
        assignedBy: (row) =>
          assignedByNameMap[row.assignedBy] ?? row.assignedBy,
        progress: (row) => {
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
