"use client";

import { Modal, Table } from "antd";
import { Trash2 } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/common/toast/ToastProvider";
import Button from "@/components/ui/Button";
import type {
  ApiMilestone,
  ApiProject,
  ApiProjectFile,
  ApiTask,
} from "@/lib/admin-mappers";
import { fetchApiProject } from "@/lib/fetch-api-project";
import { drfDelete, drfFormDataPatch, fetchAllPages } from "@/lib/pms-http";
import {
  mergeProjectDocuments,
  type ProjectFileRow,
} from "@/lib/project-documents";

type ProjectDetailModalProps = {
  open: boolean;
  projectId: number | null;
  onClose: () => void;
  /** Admin / BA: allow DELETE on `/api/v1/files/` and clearing primary `document`. */
  allowDeleteProjectFiles?: boolean;
  onFilesMutated?: () => void;
};

function projectStatusLabel(status: string): string {
  if (status === "ACTIVE") return "In progress";
  if (status === "DELAYED") return "Delayed";
  if (status === "COMPLETED" || status === "ARCHIVED") return "Completed";
  return "Not started";
}

function milestoneStatusLabel(status: string): string {
  if (status === "COMPLETED") return "Completed";
  if (status === "IN_PROGRESS") return "In progress";
  if (status === "DELAYED") return "Delayed";
  return "Not started";
}

function taskStatusLabel(status: string): string {
  switch (status) {
    case "NOT_STARTED":
      return "Not started";
    case "IN_PROGRESS":
      return "In progress";
    case "PAUSED":
      return "Paused";
    case "COMPLETED":
      return "Completed";
    case "DELAYED":
      return "Delayed";
    case "BLOCKED":
      return "Blocked";
    default:
      return status;
  }
}

function statusPillClass(status: string): string {
  switch (status) {
    case "ACTIVE":
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-700";
    case "PAUSED":
      return "bg-amber-100 text-amber-700";
    case "COMPLETED":
    case "ARCHIVED":
      return "bg-green-100 text-green-700";
    case "DELAYED":
      return "bg-rose-100 text-rose-700";
    case "BLOCKED":
      return "bg-zinc-200 text-zinc-800";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function renderStatusPill(label: string, status: string): ReactNode {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusPillClass(status)}`}
    >
      {label}
    </span>
  );
}

function truncateDesc(text: string | null | undefined): ReactNode {
  const s = (text ?? "").trim();
  if (!s) return <span className="text-gray-400">—</span>;
  return (
    <span
      className="line-clamp-2 block max-w-[min(280px,28vw)] whitespace-pre-wrap break-words text-sm text-gray-700"
      title={s}
    >
      {s}
    </span>
  );
}

export default function ProjectDetailModal({
  open,
  projectId,
  onClose,
  allowDeleteProjectFiles = false,
  onFilesMutated,
}: ProjectDetailModalProps) {
  const { showToast } = useToast();
  const [project, setProject] = useState<ApiProject | null>(null);
  const [attachments, setAttachments] = useState<ApiProjectFile[]>([]);
  const [milestones, setMilestones] = useState<ApiMilestone[]>([]);
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  useEffect(() => {
    if (!open || projectId == null) {
      setProject(null);
      setAttachments([]);
      setMilestones([]);
      setTasks([]);
      setError(null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const [p, ms, ts, allFiles] = await Promise.all([
          fetchApiProject(projectId),
          fetchAllPages<ApiMilestone>("/api/v1/milestones/"),
          fetchAllPages<ApiTask>("/api/v1/tasks/"),
          fetchAllPages<ApiProjectFile>("/api/v1/files/").catch(() => []),
        ]);
        if (cancelled) return;
        setProject(p);
        setAttachments(allFiles.filter((f) => Number(f.project) === projectId));
        setMilestones(ms.filter((m) => m.project === projectId));
        setTasks(ts.filter((t) => t.project === projectId));
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load project");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [open, projectId]);

  const fileRows = useMemo(
    () => mergeProjectDocuments(project, attachments),
    [project, attachments],
  );

  const refreshDocumentsOnly = async () => {
    if (projectId == null) return;
    try {
      const [p, allFiles] = await Promise.all([
        fetchApiProject(projectId),
        fetchAllPages<ApiProjectFile>("/api/v1/files/").catch(() => []),
      ]);
      setProject(p);
      setAttachments(allFiles.filter((f) => Number(f.project) === projectId));
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Refresh failed", "error");
    }
  };

  const removePrimaryDocument = async () => {
    if (projectId == null) return;
    const fd = new FormData();
    fd.append("document", "");
    await drfFormDataPatch(`/api/v1/projects/${projectId}/`, fd);
  };

  const handleDeleteFile = async (row: ProjectFileRow) => {
    if (!allowDeleteProjectFiles || projectId == null) return;
    setDeletingKey(row.key);
    try {
      if (row.source === "attachment" && row.attachmentId != null) {
        await drfDelete(`/api/v1/files/${row.attachmentId}/`);
        showToast("File removed", "success");
      } else if (row.source === "primary") {
        await removePrimaryDocument();
        showToast("Document removed", "success");
      }
      await refreshDocumentsOnly();
      onFilesMutated?.();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Delete failed", "error");
    } finally {
      setDeletingKey(null);
    }
  };

  const milestoneColumns = useMemo(
    () => [
      {
        title: "#",
        dataIndex: "milestone_no",
        key: "milestone_no",
        width: 56,
        render: (n: number | undefined) => n ?? "—",
      },
      { title: "Name", dataIndex: "name", key: "name", width: 140 },
      {
        title: "Description",
        dataIndex: "description",
        key: "description",
        ellipsis: true,
        render: (_: unknown, row: ApiMilestone) =>
          truncateDesc(row.description),
      },
      {
        title: "Start",
        dataIndex: "start_date",
        key: "start_date",
        width: 110,
      },
      {
        title: "End",
        dataIndex: "end_date",
        key: "end_date",
        width: 110,
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (s: string) => renderStatusPill(milestoneStatusLabel(s), s),
      },
    ],
    [],
  );

  const taskColumns = useMemo(
    () => [
      {
        title: "Task",
        dataIndex: "title",
        key: "title",
        width: 160,
        ellipsis: true,
      },
      {
        title: "Description",
        dataIndex: "description",
        key: "description",
        render: (_: unknown, row: ApiTask) => truncateDesc(row.description),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (s: string) => renderStatusPill(taskStatusLabel(s), s),
      },
      {
        title: "Deadline",
        dataIndex: "deadline",
        key: "deadline",
        width: 120,
        render: (d: string | null | undefined) => d ?? "—",
      },
      {
        title: "Assignee",
        dataIndex: "assigned_to_name",
        key: "assigned_to_name",
        width: 160,
        render: (n: string | null | undefined) => n ?? "—",
      },
    ],
    [],
  );

  return (
    <Modal
      title={
        project
          ? project.name
          : projectId != null
            ? `Project #${projectId}`
            : "Project"
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={920}
      centered
      destroyOnHidden
      styles={{
        root: {
          maxHeight: "min(92vh, calc(100vh - 1.5rem))",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          paddingBottom: 0,
        },
        header: { flexShrink: 0 },
        body: {
          maxHeight: "calc(min(92vh, 100vh - 1.5rem) - 4.5rem)",
          overflowX: "hidden",
          overflowY: "auto",
          overscrollBehavior: "contain",
          paddingTop: 12,
        },
      }}
    >
      {loading ? (
        <p className="text-sm text-gray-600">Loading project…</p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading && project ? (
        <div className="mt-2 space-y-6 text-[15px] leading-relaxed text-gray-800">
          <div className="flex flex-wrap items-center gap-2">
            {renderStatusPill(
              projectStatusLabel(project.status),
              project.status,
            )}
            <span className="text-sm text-gray-500">
              Start{" "}
              <strong className="text-gray-800">{project.start_date}</strong>
              {" · "}Due{" "}
              <strong className="text-gray-800">{project.deadline}</strong>
            </span>
          </div>

          {project.description ? (
            <div>
              <h3 className="mb-1 h3 font-semibold uppercase tracking-wide text-gray-500">
                Description
              </h3>
              <p className="whitespace-pre-wrap text-gray-700">
                {project.description}
              </p>
            </div>
          ) : null}

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Files ({fileRows.length})
            </h3>
            {fileRows.length === 0 ? (
              <p className="text-sm text-gray-500">No documents uploaded.</p>
            ) : (
              <ul className="space-y-2">
                {fileRows.map((row) => (
                  <li
                    key={row.key}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2"
                  >
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 flex-1 truncate font-normal text-sm text-sky-600 underline decoration-sky-500 underline-offset-2 hover:text-sky-700"
                    >
                      {row.displayName}
                    </a>
                    {allowDeleteProjectFiles ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-8 shrink-0 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                        disabled={deletingKey === row.key}
                        onClick={() => handleDeleteFile(row)}
                        aria-label={`Remove ${row.displayName}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Milestones ({milestones.length})
            </h3>
            <Table<ApiMilestone>
              size="small"
              scroll={{ x: 720 }}
              pagination={milestones.length > 8 ? { pageSize: 8 } : false}
              rowKey="id"
              dataSource={[...milestones].sort(
                (a, b) => (a.milestone_no ?? 0) - (b.milestone_no ?? 0),
              )}
              columns={milestoneColumns}
              locale={{ emptyText: "No milestones for this project." }}
            />
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Tasks ({tasks.length})
            </h3>
            <Table<ApiTask>
              size="small"
              scroll={{ x: 800 }}
              pagination={tasks.length > 8 ? { pageSize: 8 } : false}
              rowKey="id"
              dataSource={tasks}
              columns={taskColumns}
              locale={{ emptyText: "No tasks for this project." }}
            />
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
