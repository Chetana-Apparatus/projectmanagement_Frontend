"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import DataTable, {
  type DataTableColumn,
} from "@/components/common/table/DataTable";
import Button from "@/components/ui/Button";

export type ProjectStatus = "Planned" | "In Progress" | "Completed";

export type Project = {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
};

type Props = {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
};

const DESCRIPTION_PREVIEW_LENGTH = 15;

export default function ProjectTable({ projects, onEdit, onDelete }: Props) {
  const [selectedDescription, setSelectedDescription] = useState<string | null>(
    null,
  );

  const getDescriptionPreview = (description: string) => {
    if (description.length <= DESCRIPTION_PREVIEW_LENGTH) return description;
    return `${description.slice(0, DESCRIPTION_PREVIEW_LENGTH)}...`;
  };

  const columns: DataTableColumn[] = [
    { label: "Project Name", key: "name" },
    { label: "Description", key: "description" },
    { label: "Start Date", key: "startDate" },
    { label: "End Date", key: "endDate" },
    { label: "Status", key: "status" },
    { label: "Actions", key: "actions" },
  ];

  return (
    <>
      <DataTable<Project>
        columns={columns}
        data={projects}
        emptyMessage="No projects found"
        renderers={{
          description: (row) => {
            const isLong = row.description.length > DESCRIPTION_PREVIEW_LENGTH;
            return (
              <div className="max-w-[260px]">
                <span>{getDescriptionPreview(row.description)}</span>
                {isLong ? (
                  <button
                    type="button"
                    className="ml-2 text-cs-primary-100 hover:underline"
                    onClick={() => setSelectedDescription(row.description)}
                  >
                    Read more
                  </button>
                ) : null}
              </div>
            );
          },
          status: (row) => {
            const statusStyles: Record<ProjectStatus, string> = {
              Planned: "bg-gray-100 text-gray-700",
              "In Progress": "bg-blue-100 text-blue-700",
              Completed: "bg-emerald-100 text-emerald-700",
            };

            return (
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[row.status]}`}
              >
                {row.status}
              </span>
            );
          },
          actions: (row) => (
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                className="h-8 px-3 text-xs border-sky-200 text-sky-600 hover:bg-sky-50"
                onClick={() => onEdit(row)}
              >
                <Pencil size={14} />
              </Button>
              <Button
                variant="secondary"
                className="h-8 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => onDelete(row)}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ),
        }}
      />

      {selectedDescription ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={() => setSelectedDescription(null)}
            aria-label="Close description"
          />
          <div className="relative z-50 w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-cs-heading">
              Project Description
            </h3>
            <p className="mt-3 text-sm text-cs-text break-words">
              {selectedDescription}
            </p>
            <div className="mt-5 flex justify-end">
              <Button
                variant="secondary"
                onClick={() => setSelectedDescription(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
