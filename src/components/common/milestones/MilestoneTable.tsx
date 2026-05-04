"use client";

import { Progress } from "antd";
import { Pencil, Trash2 } from "lucide-react";
import DataTable, {
  type DataTableColumn,
} from "@/components/common/table/DataTable";
import Button from "@/components/ui/Button";
import { formatProgressLabel, progressBarValue } from "@/lib/progress-display";

export type MilestoneRecord = {
  id: string;
  projectId: string;
  name: string;
  description: string;
  startDate: string;
  expectedDate: string;
  status:
    | "Not Started"
    | "In Progress"
    | "Completed"
    | "Delayed"
    | "Paused"
    | "Blocked";
  /** 0–100 from API work-tracking rollup; 0 when unknown. */
  progressPercent: number;
  assignedEmployees: string[];
  watchers: string[];
};

type MilestoneTableProps = {
  milestones: MilestoneRecord[];
  projectNameMap?: Record<string, string>;
  onEdit: (milestone: MilestoneRecord) => void;
  onDelete: (milestone: MilestoneRecord) => void;
  highlightRowId?: string | null;
  onOpenProjectAction?: (projectId: string) => void;
};

export default function MilestoneTable({
  milestones,
  projectNameMap = {},
  onEdit,
  onDelete,
  highlightRowId = null,
  onOpenProjectAction,
}: MilestoneTableProps) {
  const getProgressColor = (value: number) => {
    if (value > 75) return "#16a34a";
    if (value > 50) return "#2563eb";
    return "#dc2626";
  };

  const progressBar = (row: MilestoneRecord) => {
    const raw = progressBarValue(row.progressPercent);
    return (
      <div className="mx-auto w-[160px]">
        <Progress
          percent={raw}
          size="small"
          strokeColor={getProgressColor(row.progressPercent)}
          trailColor="#e5e7eb"
          format={() => formatProgressLabel(row.progressPercent)}
        />
      </div>
    );
  };

  const columns: DataTableColumn[] = [
    { label: "Project Name", key: "projectName", align: "center" },
    { label: "Milestone Name", key: "name", align: "center" },
    { label: "Description", key: "description", align: "center" },
    { label: "Start Date", key: "startDate", align: "center" },
    { label: "Deadline", key: "expectedDate", align: "center" },
    { label: "Progress", key: "progress", align: "center" },
    { label: "Actions", key: "actions", align: "center" },
  ];

  return (
    <DataTable<MilestoneRecord>
      columns={columns}
      data={milestones}
      emptyMessage="No milestones found"
      highlightRowId={highlightRowId}
      renderers={{
        projectName: (row) => {
          const label = projectNameMap[row.projectId] ?? row.projectId;
          if (!onOpenProjectAction) return label;
          return (
            <button
              type="button"
              onClick={() => onOpenProjectAction(row.projectId)}
              className="text-sky-700 underline underline-offset-2 hover:text-sky-900"
            >
              {label}
            </button>
          );
        },
        description: (row) => (
          <span className="break-words whitespace-normal">
            {row.description?.trim() || "-"}
          </span>
        ),
        progress: (row) => {
          return progressBar(row);
        },
        actions: (row) => (
          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="flex h-8 w-8 items-center justify-center border-sky-200 !text-sky-600 hover:border-sky-200 hover:bg-sky-50 hover:!text-sky-700"
              onClick={() => onEdit(row)}
              aria-label={`Edit milestone ${row.name}`}
            >
              <Pencil size={16} />
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex h-8 w-8 items-center justify-center border-red-200 !text-red-600 hover:border-red-200 hover:bg-red-50 hover:!text-red-700"
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
