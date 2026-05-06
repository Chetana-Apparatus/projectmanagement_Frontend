"use client";

import { Modal } from "antd";
import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/common/toast/ToastProvider";
import Button from "@/components/ui/Button";
import type { ApiProject, ApiProjectFile } from "@/lib/admin-mappers";
import { fetchApiProject } from "@/lib/fetch-api-project";
import { drfDelete, drfFormDataPatch, fetchAllPages } from "@/lib/pms-http";
import {
  mergeProjectDocuments,
  type ProjectFileRow,
} from "@/lib/project-documents";

type ProjectFilesModalProps = {
  open: boolean;
  projectId: number | null;
  projectName?: string | null;
  onClose: () => void;
  /** Refresh parent lists (counts) after attachment changes */
  onFilesMutated?: () => void;
  allowDelete?: boolean;
};

export default function ProjectFilesModal({
  open,
  projectId,
  projectName,
  onClose,
  onFilesMutated,
  allowDelete = false,
}: ProjectFilesModalProps) {
  const { showToast } = useToast();
  const [project, setProject] = useState<ApiProject | null>(null);
  const [attachments, setAttachments] = useState<ApiProjectFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (projectId == null) return;
    setLoading(true);
    try {
      const [p, allFiles] = await Promise.all([
        fetchApiProject(projectId),
        fetchAllPages<ApiProjectFile>("/api/v1/files/").catch(() => []),
      ]);
      setProject(p);
      setAttachments(allFiles.filter((f) => Number(f.project) === projectId));
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Failed to load files",
        "error",
      );
      setProject(null);
      setAttachments([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, showToast]);

  useEffect(() => {
    if (!open || projectId == null) {
      setProject(null);
      setAttachments([]);
      return;
    }
    void reload();
  }, [open, projectId, reload]);

  const rows = mergeProjectDocuments(project, attachments);

  const removePrimaryDocument = async () => {
    if (projectId == null) return;
    const fd = new FormData();
    fd.append("document", "");
    await drfFormDataPatch(`/api/v1/projects/${projectId}/`, fd);
  };

  const handleDelete = async (row: ProjectFileRow) => {
    if (!allowDelete || projectId == null) return;
    setDeletingKey(row.key);
    try {
      if (row.source === "attachment" && row.attachmentId != null) {
        await drfDelete(`/api/v1/files/${row.attachmentId}/`);
        showToast("File removed", "success");
      } else if (row.source === "primary") {
        await removePrimaryDocument();
        showToast("Document removed", "success");
      }
      await reload();
      onFilesMutated?.();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Delete failed", "error");
    } finally {
      setDeletingKey(null);
    }
  };

  const title =
    projectName?.trim() ||
    project?.name?.trim() ||
    (projectId != null ? `Project #${projectId}` : "Project files");

  return (
    <Modal
      title={`Files — ${title}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      centered
      destroyOnHidden
    >
      {loading ? <p className="text-sm text-gray-600">Loading files…</p> : null}

      {!loading && rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-6 text-center text-sm text-gray-500">
          No documents uploaded for this project.
        </p>
      ) : null}

      {!loading && rows.length > 0 ? (
        <ul className="max-h-[min(360px,50vh)] space-y-2 overflow-y-auto pr-1">
          {rows.map((row) => (
            <li
              key={row.key}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2"
            >
              <a
                href={row.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate font-normal text-sm text-sky-600 underline decoration-sky-500 underline-offset-2 hover:text-sky-700"
              >
                {row.displayName}
              </a>
              {allowDelete ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="h-8 shrink-0 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                  disabled={deletingKey === row.key}
                  onClick={() => handleDelete(row)}
                  aria-label={`Remove ${row.displayName}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </Modal>
  );
}
