"use client";

import { Progress } from "antd";
import { Pencil, Trash2 } from "lucide-react";
import DataTable, {
  type DataTableColumn,
} from "@/components/common/table/DataTable";
import Button from "@/components/ui/Button";
import { calculateProgress, getProgressColor } from "@/utils/progress";

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
  projectNameMap?: Record<string, string>;
  onEdit: (milestone: MilestoneRecord) => void;
  onDelete: (milestone: MilestoneRecord) => void;
};

export default function MilestoneTable({
  milestones,
  projectNameMap = {},
  onEdit,
  onDelete,
}: MilestoneTableProps) {
  const columns: DataTableColumn[] = [
    { label: "Project Name", key: "projectName" },
    { label: "Milestone Name", key: "name" },
    { label: "Start Date", key: "startDate" },
    { label: "End Date", key: "endDate" },
    { label: "Progress", key: "progress" },
    { label: "Actions", key: "actions" },
  ];

  return (
    <DataTable<MilestoneRecord>
      columns={columns}
      data={milestones}
      emptyMessage="No milestones found"
      renderers={{
        projectName: (row) => projectNameMap[row.projectId] ?? row.projectId,
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
