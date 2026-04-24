"use client";

import { Pencil, Trash2 } from "lucide-react";
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
  status: "Not Started" | "Pending" | "In Progress" | "Completed";
};

type TaskTableProps = {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export default function TaskTable({ tasks, onEdit, onDelete }: TaskTableProps) {
  const columns: DataTableColumn[] = [
    { label: "Task Name", key: "name" },
    { label: "Project", key: "project" },
    { label: "Milestone", key: "milestone" },
    { label: "Assigned Employee", key: "employee" },
    { label: "Assigned By", key: "assignedBy" },
    { label: "Start Date", key: "startDate" },
    { label: "End Date", key: "endDate" },
    { label: "Status", key: "status" },
    { label: "Actions", key: "actions" },
  ];

  return (
    <DataTable<Task>
      columns={columns}
      data={tasks}
      emptyMessage="No tasks found"
      renderers={{
        actions: (row) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-8 border-sky-200 px-3 text-xs text-sky-600"
              onClick={() => onEdit(row)}
              aria-label={`Edit task ${row.name}`}
            >
              <Pencil size={14} />
              Edit
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-8 border-red-200 px-3 text-xs text-red-600 hover:border-red-200 hover:bg-red-50"
              onClick={() => onDelete(row)}
              aria-label={`Delete task ${row.name}`}
            >
              <Trash2 size={14} />
              Delete
            </Button>
          </div>
        ),
      }}
    />
  );
}
