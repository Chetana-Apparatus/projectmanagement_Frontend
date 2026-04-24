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
  startDate: string;
  endDate: string;
  deadline: string;
  assignedEmployees: string[];
  watchers: string[];
};

type MilestoneTableProps = {
  milestones: MilestoneRecord[];
  onEdit: (milestone: MilestoneRecord) => void;
  onDelete: (milestone: MilestoneRecord) => void;
};

function renderPeople(values: string[]) {
  if (values.length === 0) return "-";
  if (values.length <= 2) return values.join(", ");
  return `${values.slice(0, 2).join(", ")} +${values.length - 2} more`;
}

export default function MilestoneTable({
  milestones,
  onEdit,
  onDelete,
}: MilestoneTableProps) {
  const columns: DataTableColumn[] = [
    { label: "Milestone Name", key: "name" },
    { label: "Start Date", key: "startDate" },
    { label: "End Date", key: "endDate" },
    { label: "Deadline", key: "deadline" },
    // { label: "Assigned Employees", key: "assignedEmployees" },
    // { label: "Watchers", key: "watchers" },
    { label: "Actions", key: "actions" },
  ];

  return (
    <DataTable<MilestoneRecord>
      columns={columns}
      data={milestones}
      emptyMessage="No milestones found"
      renderers={{
        assignedEmployees: (row) => (
          <span
            className="inline-flex rounded-md bg-cs-primary-100/10 px-2 py-1 text-xs font-medium text-cs-heading"
            title={row.assignedEmployees.join(", ")}
          >
            {renderPeople(row.assignedEmployees)}
          </span>
        ),
        watchers: (row) => (
          <span
            className="inline-flex rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700"
            title={row.watchers.join(", ")}
          >
            {renderPeople(row.watchers)}
          </span>
        ),
        actions: (row) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-8 border-sky-200 px-3 text-xs border-sky-200 text-sky-600 hover:bg-sky-50"
              onClick={() => onEdit(row)}
              aria-label={`Edit milestone ${row.name}`}
            >
              <Pencil size={14} />
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-8 border-red-200 px-3 text-xs text-red-600 hover:border-red-200 hover:bg-red-50"
              onClick={() => onDelete(row)}
              aria-label={`Delete milestone ${row.name}`}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ),
      }}
    />
  );
}
