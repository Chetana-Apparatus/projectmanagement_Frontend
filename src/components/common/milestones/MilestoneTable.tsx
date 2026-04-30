"use client";

import { Pencil, Trash2 } from "lucide-react";
import DataTable, {
  type DataTableColumn,
} from "@/components/common/table/DataTable";
import Button from "@/components/ui/Button";

export type MilestoneRecord = {
  id: string;
  projectId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status:
    | "Not Started"
    | "In Progress"
    | "Completed"
    | "Delayed"
    | "Paused"
    | "Blocked";
  assignedEmployees: string[];
  watchers: string[];
};

type MilestoneTableProps = {
  milestones: MilestoneRecord[];
  projectNameMap?: Record<string, string>;
  onEdit: (milestone: MilestoneRecord) => void;
  onDelete: (milestone: MilestoneRecord) => void;
  highlightRowId?: string | null;
};

export default function MilestoneTable({
  milestones,
  projectNameMap = {},
  onEdit,
  onDelete,
  highlightRowId = null,
}: MilestoneTableProps) {
  const progressBadge = (status: MilestoneRecord["status"]) => {
    const styleMap: Record<MilestoneRecord["status"], string> = {
      Completed: "bg-emerald-100 text-emerald-700",
      "In Progress": "bg-blue-100 text-blue-700",
      Paused: "bg-amber-100 text-amber-700",
      Delayed: "bg-orange-100 text-orange-700",
      Blocked: "bg-rose-100 text-rose-700",
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
    { label: "Project Name", key: "projectName" },
    { label: "Milestone Name", key: "name" },
    { label: "Description", key: "description" },
    { label: "Start Date", key: "startDate" },
    { label: "Deadline", key: "endDate" },
    { label: "Progress", key: "progress" },
    { label: "Actions", key: "actions" },
  ];

  return (
    <DataTable<MilestoneRecord>
      columns={columns}
      data={milestones}
      emptyMessage="No milestones found"
      highlightRowId={highlightRowId}
      renderers={{
        projectName: (row) => projectNameMap[row.projectId] ?? row.projectId,
        description: (row) => (
          <span className="break-words whitespace-normal">
            {row.description?.trim() || "-"}
          </span>
        ),
        progress: (row) => {
          return progressBadge(row.status);
        },
        actions: (row) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              className="flex h-8 w-8 items-center justify-center border-sky-200 text-sky-600 hover:border-sky-200 hover:bg-sky-50"
              onClick={() => onEdit(row)}
              aria-label={`Edit milestone ${row.name}`}
            >
              <Pencil size={16} />
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex h-8 w-8 items-center justify-center border-red-200 text-red-600 hover:border-red-200 hover:bg-red-50"
              onClick={() => onDelete(row)}
              aria-label={`Delete milestone ${row.name}`}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ),
      }}
    />
  );
}
