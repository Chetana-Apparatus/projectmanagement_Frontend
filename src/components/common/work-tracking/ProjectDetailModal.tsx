"use client";

import { Modal, Table } from "antd";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import type { ApiMilestone, ApiProject, ApiTask } from "@/lib/admin-mappers";
import { getPublicApiOrigin } from "@/lib/api-base";
import {
  apiFetch,
  fetchWithAuth,
  messageFromUnknownBody,
} from "@/lib/api-client";
import { fetchAllPages } from "@/lib/pms-http";

type ProjectDetailModalProps = {
  open: boolean;
  projectId: number | null;
  onClose: () => void;
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

async function loadProject(id: number): Promise<ApiProject> {
  try {
    const res = await apiFetch<ApiProject>(`/api/v1/projects/${id}/`, {
      method: "GET",
    });
    if (res.success && res.data) return res.data;
    throw new Error(res.message || "Failed to load project");
  } catch (e) {
    if (
      e instanceof Error &&
      e.message.includes("Unexpected API response shape")
    ) {
      const rawRes = await fetchWithAuth(`/api/v1/projects/${id}/`, {
        method: "GET",
      });
      const rawBody = (await rawRes.json()) as unknown;
      if (!rawRes.ok) {
        throw new Error(messageFromUnknownBody(rawBody));
      }
      return rawBody as ApiProject;
    }
    throw e;
  }
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

function documentHref(documentPath: string): string {
  if (!documentPath) return "";
  if (/^https?:\/\//i.test(documentPath)) return documentPath;
  return `${getPublicApiOrigin() || "http://127.0.0.1:8000"}${documentPath}`;
}

export default function ProjectDetailModal({
  open,
  projectId,
  onClose,
}: ProjectDetailModalProps) {
  const [project, setProject] = useState<ApiProject | null>(null);
  const [milestones, setMilestones] = useState<ApiMilestone[]>([]);
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || projectId == null) {
      setProject(null);
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
        const [p, ms, ts] = await Promise.all([
          loadProject(projectId),
          fetchAllPages<ApiMilestone>("/api/v1/milestones/"),
          fetchAllPages<ApiTask>("/api/v1/tasks/"),
        ]);
        if (cancelled) return;
        setProject(p);
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
        render: (s: string) => milestoneStatusLabel(s),
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
        render: (s: string) => taskStatusLabel(s),
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

  const docUrl = project?.document ? documentHref(project.document) : "";

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
      destroyOnHidden
    >
      {loading ? (
        <p className="text-sm text-gray-600">Loading project…</p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading && project ? (
        <div className="mt-2 space-y-6 text-[15px] leading-relaxed text-gray-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
              {projectStatusLabel(project.status)}
            </span>
            <span className="text-sm text-gray-500">
              Start{" "}
              <strong className="text-gray-800">{project.start_date}</strong>
              {" · "}Due{" "}
              <strong className="text-gray-800">{project.deadline}</strong>
            </span>
          </div>

          {project.description ? (
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Description
              </h3>
              <p className="whitespace-pre-wrap text-gray-700">
                {project.description}
              </p>
            </div>
          ) : null}

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Document
            </h3>
            {docUrl ? (
              <a
                href={docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-sky-700 underline-offset-2 hover:underline"
              >
                Open project document
              </a>
            ) : (
              <p className="text-sm text-gray-500">No document uploaded.</p>
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
