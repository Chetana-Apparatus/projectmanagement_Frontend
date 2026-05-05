"use client";

import { Modal, Progress } from "antd";
import { renderAsync } from "docx-preview";
import { Pencil, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import DataTable, {
  type DataTableColumn,
} from "@/components/common/table/DataTable";
import Button from "@/components/ui/Button";
import { getPublicApiOrigin } from "@/lib/api-base";
import { fetchAllPages } from "@/lib/pms-http";
import { formatProgressLabel, progressBarValue } from "@/lib/progress-display";

type ProjectAttachmentApi = {
  id: number;
  file: string;
};

function fileLinkHref(documentPath: string): string {
  if (!documentPath) return "";
  if (/^https?:\/\//i.test(documentPath)) return documentPath;
  const apiOrigin = getPublicApiOrigin() || "http://127.0.0.1:8000";
  return `${apiOrigin}${documentPath}`;
}

function fileLabelFromPath(path: string): string {
  const normalized = path.split("?")[0];
  const parts = normalized.split("/");
  return parts[parts.length - 1] || path;
}

function pathWithoutQuery(path: string): string {
  return path.split("?")[0];
}

export type ProjectStatus =
  | "Not Started"
  | "In Progress"
  | "Completed"
  | "Delayed"
  | "Paused"
  | "Blocked";

export type Project = {
  id: string;
  name: string;
  description: string;
  startDate: string;
  expectedDate: string;
  documentUrl: string | null;
  documentName: string;
  /** Primary file + project file attachments (from API `documents_count`). */
  documentsCount: number;
  status: ProjectStatus;
  progressPercent: number | null;
};

type ProjectTableProps = {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete?: (project: Project) => void;
  allowDelete?: boolean;
  highlightRowId?: string | null;
  onOpenProject?: (projectId: string) => void;
};

export default function ProjectTable({
  projects,
  onEdit,
  onDelete,
  allowDelete = true,
  highlightRowId = null,
  onOpenProject,
}: ProjectTableProps) {
  const [filesModalProject, setFilesModalProject] = useState<Project | null>(
    null,
  );
  const [filesModalRows, setFilesModalRows] = useState<
    { href: string; label: string }[]
  >([]);
  const [filesModalLoading, setFilesModalLoading] = useState(false);
  const [filesModalError, setFilesModalError] = useState<string | null>(null);

  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [markdownContent, setMarkdownContent] = useState("");
  const docxContainerRef = useRef<HTMLDivElement | null>(null);

  const previewFileUrl = previewProject?.documentUrl ?? null;
  const previewFileName = previewProject?.documentName ?? "";
  const absolutePreviewUrl = useMemo(() => {
    if (!previewFileUrl) return "";
    if (/^https?:\/\//i.test(previewFileUrl)) return previewFileUrl;
    const apiOrigin = getPublicApiOrigin() || "http://127.0.0.1:8000";
    return `${apiOrigin}${previewFileUrl}`;
  }, [previewFileUrl]);
  const isDocx = useMemo(
    () => Boolean(previewFileName.toLowerCase().endsWith(".docx")),
    [previewFileName],
  );
  const isMarkdown = useMemo(
    () => Boolean(previewFileName.toLowerCase().endsWith(".md")),
    [previewFileName],
  );

  useEffect(() => {
    if (!filesModalProject) {
      setFilesModalRows([]);
      setFilesModalError(null);
      return;
    }
    const project = filesModalProject;
    const projectId = Number(project.id);
    let cancelled = false;
    setFilesModalLoading(true);
    setFilesModalError(null);
    void (async () => {
      try {
        const attachments = await fetchAllPages<ProjectAttachmentApi>(
          `/api/v1/files/?project=${projectId}`,
        );
        if (cancelled) return;
        const primaryKey = project.documentUrl
          ? pathWithoutQuery(project.documentUrl)
          : "";
        const rows: { href: string; label: string }[] = [];
        if (project.documentUrl) {
          rows.push({
            href: fileLinkHref(project.documentUrl),
            label:
              project.documentName || fileLabelFromPath(project.documentUrl),
          });
        }
        for (const att of attachments) {
          if (primaryKey && pathWithoutQuery(att.file) === primaryKey) {
            continue;
          }
          rows.push({
            href: fileLinkHref(att.file),
            label: fileLabelFromPath(att.file),
          });
        }
        setFilesModalRows(rows);
      } catch (e) {
        if (!cancelled) {
          setFilesModalError(
            e instanceof Error ? e.message : "Failed to load files",
          );
          setFilesModalRows([]);
        }
      } finally {
        if (!cancelled) setFilesModalLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filesModalProject]);

  const progressColor = (value: number) => {
    if (value > 75) return "#16a34a";
    if (value > 50) return "#2563eb";
    return "#dc2626";
  };

  const progressBar = (row: Project) => {
    const raw = progressBarValue(row.progressPercent);
    return (
      <div className="mx-auto w-[160px]">
        <Progress
          percent={raw}
          size="small"
          strokeColor={progressColor(row.progressPercent ?? 0)}
          trailColor="#e5e7eb"
          format={() => formatProgressLabel(row.progressPercent)}
        />
      </div>
    );
  };

  useEffect(() => {
    if (
      !previewProject ||
      !isDocx ||
      !absolutePreviewUrl ||
      !docxContainerRef.current
    ) {
      return;
    }

    const container = docxContainerRef.current;
    container.innerHTML = "";
    setPreviewError("");

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(absolutePreviewUrl);
        if (!res.ok) {
          throw new Error(`Unable to fetch DOCX (${res.status})`);
        }
        const buffer = await res.arrayBuffer();
        if (cancelled || !container) return;
        await renderAsync(buffer, container);
      } catch (_error) {
        setPreviewError("Unable to preview this DOCX file.");
      }
    })();

    return () => {
      cancelled = true;
      container.innerHTML = "";
    };
  }, [previewProject, isDocx, absolutePreviewUrl]);

  useEffect(() => {
    if (!previewProject || !isMarkdown || !absolutePreviewUrl) {
      setMarkdownContent("");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(absolutePreviewUrl);
        if (!res.ok)
          throw new Error(`Unable to fetch markdown (${res.status})`);
        const text = await res.text();
        if (!cancelled) setMarkdownContent(text);
      } catch {
        if (!cancelled) setMarkdownContent("Unable to load markdown preview.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [previewProject, isMarkdown, absolutePreviewUrl]);

  const columns: DataTableColumn[] = [
    { label: "Project", key: "name" },
    { label: "Start", key: "startDate" },
    { label: "End", key: "expectedDate" },
    { label: "Files", key: "document" },
    { label: "Progress", key: "progress" },
    { label: "Status", key: "status" },
    { label: "Actions", key: "actions" },
  ];

  return (
    <>
      <DataTable<Project>
        columns={columns}
        data={projects}
        highlightRowId={highlightRowId}
        renderers={{
          name: (row) => (
            <button
              type="button"
              onClick={() => {
                if (onOpenProject) {
                  onOpenProject(row.id);
                  return;
                }
                setPreviewProject(row);
              }}
              className="text-left text-sky-700 underline underline-offset-2 hover:text-sky-900"
            >
              {row.name}
            </button>
          ),
          document: (row) =>
            row.documentsCount > 0 ? (
              <button
                type="button"
                onClick={() => setFilesModalProject(row)}
                className="text-sm font-medium text-sky-700 tabular-nums underline underline-offset-2 hover:text-sky-900"
              >
                {row.documentsCount}{" "}
                {row.documentsCount === 1 ? "file" : "files"}
              </button>
            ) : (
              <span className="text-sm text-gray-400">No files</span>
            ),
          progress: (row: Project) => progressBar(row),

          actions: (row: Project) => (
            <div className="flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                className="flex h-8 w-8 items-center justify-center border-sky-200 !text-sky-600 hover:border-sky-200 hover:bg-sky-50 hover:!text-sky-700"
                onClick={() => onEdit(row)}
                aria-label={`Edit project ${row.name}`}
              >
                <Pencil size={16} />
              </Button>
              {allowDelete && onDelete ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="flex h-8 w-8 items-center justify-center border-red-200 !text-red-600 hover:border-red-200 hover:bg-red-50 hover:!text-red-700"
                  onClick={() => onDelete(row)}
                  aria-label={`Delete project ${row.name}`}
                >
                  <Trash2 size={16} />
                </Button>
              ) : null}
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
                  {previewProject.documentUrl
                    ? ` - ${previewProject.documentName || "Document"}`
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
              {!previewProject.documentUrl ? (
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

              {isMarkdown && previewProject.documentUrl ? (
                <MarkdownPreview content={markdownContent} />
              ) : null}

              {!isDocx && !isMarkdown && previewProject.documentUrl ? (
                <div className="flex h-full min-h-[300px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
                  Preview is not available for this file type.{" "}
                  <a
                    href={absolutePreviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-1 text-sky-700 underline underline-offset-2"
                  >
                    Open document
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <Modal
        title={
          filesModalProject ? `Files — ${filesModalProject.name}` : "Files"
        }
        open={filesModalProject != null}
        onCancel={() => setFilesModalProject(null)}
        footer={null}
        width={520}
        destroyOnHidden
      >
        {filesModalLoading ? (
          <p className="text-sm text-gray-600">Loading…</p>
        ) : null}
        {filesModalError ? (
          <p className="text-sm text-red-600">{filesModalError}</p>
        ) : null}
        {!filesModalLoading && !filesModalError ? (
          filesModalRows.length > 0 ? (
            <ul className="max-h-[min(60vh,320px)] space-y-2 overflow-y-auto text-sm">
              {filesModalRows.map((item, idx) => (
                <li
                  key={`${item.href}-${idx}`}
                  className="rounded-md border border-gray-100 bg-gray-50/80 px-3 py-2"
                >
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-sky-700 underline-offset-2 hover:underline"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No files found.</p>
          )
        ) : null}
      </Modal>
    </>
  );
}

function MarkdownPreview({ content }: { content: string }) {
  return (
    <div className="h-full min-h-[300px] rounded-lg border border-gray-200 bg-white p-4">
      <pre className="whitespace-pre-wrap break-words text-sm text-gray-800">
        {content}
      </pre>
    </div>
  );
}
