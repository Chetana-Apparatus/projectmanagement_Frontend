"use client";

import { Progress } from "antd";
import { renderAsync } from "docx-preview";
import { Pencil, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import DataTable, {
  type DataTableColumn,
} from "@/components/common/table/DataTable";
import Button from "@/components/ui/Button";
import { calculateProgress, getProgressColor } from "@/utils/progress";

export type ProjectStatus = "Planned" | "In Progress" | "Completed";

export type Project = {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  document: File | null;
  status: ProjectStatus;
};

type ProjectTableProps = {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
};

export default function ProjectTable({
  projects,
  onEdit,
  onDelete,
}: ProjectTableProps) {
  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const [previewError, setPreviewError] = useState("");
  const docxContainerRef = useRef<HTMLDivElement | null>(null);

  const previewFile = previewProject?.document ?? null;
  const isDocx = useMemo(
    () => Boolean(previewFile?.name.toLowerCase().endsWith(".docx")),
    [previewFile],
  );
  const isMarkdown = useMemo(
    () => Boolean(previewFile?.name.toLowerCase().endsWith(".md")),
    [previewFile],
  );

  useEffect(() => {
    if (
      !previewProject ||
      !isDocx ||
      !previewFile ||
      !docxContainerRef.current
    ) {
      return;
    }

    const container = docxContainerRef.current;
    container.innerHTML = "";
    setPreviewError("");

    let cancelled = false;
    const reader = new FileReader();
    reader.onload = async () => {
      if (cancelled || !container) return;
      const result = reader.result;
      if (!(result instanceof ArrayBuffer)) return;

      try {
        await renderAsync(result, container);
      } catch (_error) {
        setPreviewError("Unable to preview this DOCX file.");
      }
    };
    reader.readAsArrayBuffer(previewFile);

    return () => {
      cancelled = true;
      container.innerHTML = "";
    };
  }, [previewProject, isDocx, previewFile]);

  const columns: DataTableColumn[] = [
    { label: "Project", key: "name" },
    { label: "Start", key: "startDate" },
    { label: "End", key: "endDate" },
    { label: "Progress", key: "progress" },
    { label: "Status", key: "status" },
    { label: "Actions", key: "actions" },
  ];

  return (
    <>
      <DataTable<Project>
        columns={columns}
        data={projects}
        renderers={{
          name: (row) => (
            <button
              type="button"
              onClick={() => setPreviewProject(row)}
              className="text-left text-sky-700 underline underline-offset-2 hover:text-sky-900"
            >
              {row.name}
            </button>
          ),
          progress: (row: Project) => {
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

          actions: (row: Project) => (
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                className="flex h-8 w-8 items-center justify-center border-sky-200 text-sky-600 hover:border-sky-200 hover:bg-sky-50"
                onClick={() => onEdit(row)}
                aria-label={`Edit project ${row.name}`}
              >
                <Pencil size={16} />
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex h-8 w-8 items-center justify-center border-red-200 text-red-600 hover:border-red-200 hover:bg-red-50"
                onClick={() => onDelete(row)}
                aria-label={`Delete project ${row.name}`}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ),
        }}
      />

      {previewProject ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setPreviewProject(null)}
            aria-label="Close document preview"
          />

          <div className="relative z-[121] flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-border bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div className="min-w-0">
                <h3 className="text-base font-semibold">
                  Project Document Preview
                </h3>
                <p className="truncate text-xs text-gray-500">
                  {previewProject.name}
                  {previewFile
                    ? ` - ${previewFile.name}`
                    : " - No document uploaded"}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => setPreviewProject(null)}
              >
                <X size={16} />
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto bg-gray-50 p-4">
              {!previewFile ? (
                <div className="flex h-full min-h-[300px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
                  No document uploaded for this project.
                </div>
              ) : null}

              {isDocx ? (
                <div className="h-full min-h-[300px] rounded-lg border border-gray-200 bg-white p-4">
                  {previewError ? (
                    <p className="text-sm text-red-600">{previewError}</p>
                  ) : (
                    <div
                      ref={docxContainerRef}
                      className="docx-preview-container mx-auto h-full max-w-3xl overflow-auto"
                    />
                  )}
                </div>
              ) : null}

              {isMarkdown && previewFile ? (
                <MarkdownPreview file={previewFile} />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function MarkdownPreview({ file }: { file: File }) {
  const [content, setContent] = useState("");

  useEffect(() => {
    let cancelled = false;
    const reader = new FileReader();
    reader.onload = () => {
      if (cancelled) return;
      setContent(typeof reader.result === "string" ? reader.result : "");
    };
    reader.readAsText(file);

    return () => {
      cancelled = true;
    };
  }, [file]);

  return (
    <div className="h-full min-h-[300px] rounded-lg border border-gray-200 bg-white p-4">
      <pre className="whitespace-pre-wrap break-words text-sm text-gray-800">
        {content}
      </pre>
    </div>
  );
}
