"use client";

import { Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import ProjectFilesModal from "@/components/common/projects/ProjectFilesModal";
import ProjectForm, {
  type ProjectFormValues,
} from "@/components/common/projects/ProjectForm";
import ProjectTable, {
  type Project,
} from "@/components/common/projects/ProjectTable";
import { useToast } from "@/components/common/toast/ToastProvider";
import ProjectDetailModal from "@/components/common/work-tracking/ProjectDetailModal";
import Button from "@/components/ui/Button";
import { useNotificationTableHighlight } from "@/hooks/useNotificationTableHighlight";
import type { ApiProject, ApiProjectFile } from "@/lib/admin-mappers";
import { apiProjectToRow } from "@/lib/admin-mappers";
import { fetchApiProject } from "@/lib/fetch-api-project";
import {
  mergeProjectDocuments,
  type ProjectFileRow,
} from "@/lib/project-documents";
import { apiFetch } from "@/lib/api-client";
import {
  drfDelete,
  drfFormDataPatch,
  drfFormDataPost,
  fetchAllPages,
} from "@/lib/pms-http";
import { NOTIF_FOCUS_PARAM, stripDeepLinkParams } from "@/lib/url-deep-link";

function buildProjectFormData(values: ProjectFormValues): FormData {
  const statusMap: Record<ProjectFormValues["status"], string> = {
    "Not Started": "PLANNED",
    "In Progress": "ACTIVE",
    Completed: "COMPLETED",
    Delayed: "DELAYED",
  };
  const fd = new FormData();
  fd.append("name", values.name.trim());
  fd.append("description", values.description ?? "");
  fd.append("start_date", values.startDate);
  fd.append("deadline", values.expectedDate);
  fd.append("status", statusMap[values.status]);
  if (values.documents[0]) fd.append("document", values.documents[0]);
  return fd;
}

function normalizeProjectFormStatus(
  status: Project["status"],
): ProjectFormValues["status"] {
  if (status === "Completed") return "Completed";
  if (status === "In Progress") return "In Progress";
  if (status === "Delayed") return "Delayed";
  return "Not Started";
}

function BAProjectsPageContent() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [editingOriginalexpectedDate, setEditingOriginalexpectedDate] =
    useState<string>("");
  const [pendingDeadlineRequest, setPendingDeadlineRequest] = useState<{
    projectId: string;
    values: ProjectFormValues;
    requestedDeadline: string;
  } | null>(null);
  const [deadlineReason, setDeadlineReason] = useState("");
  const [submittingDeadlineRequest, setSubmittingDeadlineRequest] =
    useState(false);
  const [projectModalId, setProjectModalId] = useState<number | null>(null);
  const [filesModalProject, setFilesModalProject] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [editExistingFiles, setEditExistingFiles] = useState<ProjectFileRow[]>(
    [],
  );
  const [removingEditFileKey, setRemovingEditFileKey] = useState<string | null>(
    null,
  );
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [progressFilter, setProgressFilter] = useState("");
  const uploadExtraProjectFiles = async (projectId: string, files: File[]) => {
    const extras = files.slice(1);
    await Promise.all(
      extras.map(async (file) => {
        const attachFd = new FormData();
        attachFd.append("project", projectId);
        attachFd.append("file", file);
        await drfFormDataPost("/api/v1/files/", attachFd);
      }),
    );
  };

  const handleRemoveExistingServerFile = async (row: ProjectFileRow) => {
    if (!editing) return;
    setRemovingEditFileKey(row.key);
    try {
      if (row.source === "attachment" && row.attachmentId != null) {
        await drfDelete(`/api/v1/files/${row.attachmentId}/`);
      } else if (row.source === "primary") {
        const fd = new FormData();
        fd.append("document", "");
        await drfFormDataPatch(`/api/v1/projects/${editing.id}/`, fd);
      } else {
        return;
      }
      showToast("File removed", "success");
      const [p, allFiles] = await Promise.all([
        fetchApiProject(Number(editing.id)),
        fetchAllPages<ApiProjectFile>("/api/v1/files/").catch(() => []),
      ]);
      setEditExistingFiles(
        mergeProjectDocuments(
          p,
          allFiles.filter((f) => Number(f.project) === Number(editing.id)),
        ),
      );
      await loadProjects();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Remove failed", "error");
    } finally {
      setRemovingEditFileKey(null);
    }
  };

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        if (projectFilter && project.id !== projectFilter) return false;
        if (statusFilter && project.status !== statusFilter) return false;
        const p = project.progressPercent ?? null;
        if (progressFilter === "0-50" && !(p != null && p <= 50)) return false;
        if (progressFilter === "51-75" && !(p != null && p > 50 && p <= 75))
          return false;
        if (progressFilter === "76-100" && !(p != null && p > 75)) return false;
        return true;
      }),
    [projects, projectFilter, statusFilter, progressFilter],
  );

  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get("projectId");
  const nfFromUrl = searchParams.get(NOTIF_FOCUS_PARAM);

  const loadProjects = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const rows = await fetchAllPages<ApiProject>("/api/v1/projects/");
      let attachmentRows: ApiProjectFile[] = [];
      try {
        attachmentRows = await fetchAllPages<ApiProjectFile>("/api/v1/files/");
      } catch {
        attachmentRows = [];
      }
      setProjects(
        rows.map((p) => ({
          ...apiProjectToRow(p),
          fileCount: mergeProjectDocuments(
            p,
            attachmentRows.filter((f) => Number(f.project) === p.id),
          ).length,
        })),
      );
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!open || !editing) {
      setEditExistingFiles([]);
      setRemovingEditFileKey(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const [p, allFiles] = await Promise.all([
          fetchApiProject(Number(editing.id)),
          fetchAllPages<ApiProjectFile>("/api/v1/files/").catch(() => []),
        ]);
        if (cancelled) return;
        setEditExistingFiles(
          mergeProjectDocuments(
            p,
            allFiles.filter((f) => Number(f.project) === Number(editing.id)),
          ),
        );
      } catch {
        if (!cancelled) setEditExistingFiles([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, editing?.id]);

  useEffect(() => {
    if (loading) return;
    if (!projectIdFromUrl) return;
    if (nfFromUrl === "1") return;
    const p = projects.find((row) => row.id === projectIdFromUrl);
    if (p) {
      setEditing(p);
      setEditingOriginalexpectedDate(p.expectedDate);
      setOpen(true);
    }
  }, [loading, projects, projectIdFromUrl, nfFromUrl]);

  const highlightRowId = useNotificationTableHighlight(
    loading,
    "projectId",
    projects.length,
  );

  useEffect(() => {
    const isModalOpen = open || Boolean(pendingDeadlineRequest);
    if (!isModalOpen) return undefined;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open, pendingDeadlineRequest]);

  const closeForm = () => {
    setOpen(false);
    setEditing(null);
    setEditingOriginalexpectedDate("");
    setEditExistingFiles([]);
    setRemovingEditFileKey(null);
    stripDeepLinkParams(["projectId", NOTIF_FOCUS_PARAM]);
  };

  const submitDeadlineRequest = async () => {
    if (!pendingDeadlineRequest) return;
    setSubmittingDeadlineRequest(true);
    try {
      const { projectId, values, requestedDeadline } = pendingDeadlineRequest;
      const reason =
        deadlineReason.trim() || "Deadline adjustment requested by BA";
      const req = await apiFetch<{ project_id: number }>(
        `/api/v1/projects/${projectId}/request-deadline-change/`,
        {
          method: "POST",
          body: JSON.stringify({
            new_deadline: requestedDeadline,
            reason,
          }),
        },
      );
      if (!req.success) {
        throw new Error(req.message || "Deadline change request failed");
      }
      // Keep editable fields except deadline in normal BA update.
      const fdWithoutDeadline = new FormData();
      fdWithoutDeadline.append("name", values.name.trim());
      fdWithoutDeadline.append("description", values.description ?? "");
      fdWithoutDeadline.append("start_date", values.startDate);
      const statusMap: Record<ProjectFormValues["status"], string> = {
        "Not Started": "PLANNED",
        "In Progress": "ACTIVE",
        Completed: "COMPLETED",
        Delayed: "DELAYED",
      };
      fdWithoutDeadline.append("status", statusMap[values.status]);
      if (values.documents[0])
        fdWithoutDeadline.append("document", values.documents[0]);
      await drfFormDataPatch<ApiProject>(
        `/api/v1/projects/${projectId}/`,
        fdWithoutDeadline,
      );
      await uploadExtraProjectFiles(projectId, values.documents);
      showToast("Project updated. Deadline request sent to admin.", "success");
      await loadProjects();
      setPendingDeadlineRequest(null);
      setDeadlineReason("");
      closeForm();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Deadline change request failed",
        "error",
      );
    } finally {
      setSubmittingDeadlineRequest(false);
    }
  };

  const handleSubmit = async (values: ProjectFormValues) => {
    try {
      const fd = buildProjectFormData(values);
      if (editing) {
        const requestedDeadline = values.expectedDate;
        if (
          editingOriginalexpectedDate &&
          requestedDeadline !== editingOriginalexpectedDate
        ) {
          setPendingDeadlineRequest({
            projectId: editing.id,
            values,
            requestedDeadline,
          });
          return;
        } else {
          const updated = await drfFormDataPatch<ApiProject>(
            `/api/v1/projects/${editing.id}/`,
            fd,
          );
          await uploadExtraProjectFiles(String(updated.id), values.documents);
          showToast("Project updated", "success");
        }
      } else {
        const created = await drfFormDataPost<ApiProject>(
          "/api/v1/projects/",
          fd,
        );
        await uploadExtraProjectFiles(String(created.id), values.documents);
        showToast("Project created", "success");
      }
      await loadProjects();
      closeForm();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Save failed", "error");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between">
        <h2 className="h2 ">Project Management</h2>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} /> Add Project
        </Button>
      </div>

      {loading ? <p className="text-sm text-gray-500">Loading…</p> : null}
      {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-center">
          <select
            className="h-10 w-full min-w-0 rounded-md border border-cs-border bg-white px-3 text-sm text-cs-text"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="">All projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <select
            className="h-10 w-full min-w-0 rounded-md border border-cs-border bg-white px-3 text-sm text-cs-text"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All status</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Delayed">Delayed</option>
            <option value="Paused">Paused</option>
            <option value="Blocked">Blocked</option>
          </select>
          <select
            className="h-10 w-full min-w-0 rounded-md border border-cs-border bg-white px-3 text-sm text-cs-text"
            value={progressFilter}
            onChange={(e) => setProgressFilter(e.target.value)}
          >
            <option value="">Any progress</option>
            <option value="0-50">0% - 50%</option>
            <option value="51-75">51% - 75%</option>
            <option value="76-100">76% - 100%</option>
          </select>
          <Button
            type="button"
            className="h-10 w-full justify-center px-5 lg:w-auto lg:shrink-0"
            onClick={() => {
              setProjectFilter("");
              setStatusFilter("");
              setProgressFilter("");
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      <ProjectTable
        projects={filteredProjects}
        allowDelete={false}
        highlightRowId={highlightRowId}
        onOpenProject={(id) => setProjectModalId(Number(id))}
        onOpenDocumentFiles={(id) => {
          const proj = projects.find((x) => x.id === id);
          setFilesModalProject({
            id: Number(id),
            name: proj?.name ?? "Project",
          });
        }}
        onEdit={(project) => {
          setEditing(project);
          setEditingOriginalexpectedDate(project.expectedDate);
          setOpen(true);
        }}
      />

      <ProjectDetailModal
        open={projectModalId != null}
        projectId={projectModalId}
        onClose={() => setProjectModalId(null)}
        allowDeleteProjectFiles
        onFilesMutated={() => void loadProjects()}
      />

      <ProjectFilesModal
        open={filesModalProject != null}
        projectId={filesModalProject?.id ?? null}
        projectName={filesModalProject?.name}
        onClose={() => setFilesModalProject(null)}
        onFilesMutated={() => void loadProjects()}
      />

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <button
            type="button"
            className="absolute inset-0"
            onClick={closeForm}
            aria-label="Close modal"
          />

          <div className="relative z-[101] w-full max-w-4xl">
            <ProjectForm
              initialValues={
                editing
                  ? {
                      name: editing.name,
                      description: editing.description,
                      startDate: editing.startDate,
                      expectedDate: editing.expectedDate,
                      status: normalizeProjectFormStatus(editing.status),
                      documents: [],
                    }
                  : undefined
              }
              existingServerFiles={editing ? editExistingFiles : undefined}
              onRemoveExistingServerFile={
                editing ? handleRemoveExistingServerFile : undefined
              }
              removingExistingServerKey={removingEditFileKey}
              onSubmit={handleSubmit}
              onCancel={closeForm}
              statusEditable={false}
            />
          </div>
        </div>
      )}

      {pendingDeadlineRequest ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/45 p-4">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setPendingDeadlineRequest(null)}
            aria-label="Close deadline request reason modal"
          />
          <div className="relative z-[131] w-full max-w-lg rounded-xl border border-border bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-cs-heading">
              Deadline Change Request
            </h2>
            <p className="mt-1 text-sm text-cs-text">
              Provide a reason to request deadline change from Admin.
            </p>
            <textarea
              value={deadlineReason}
              onChange={(e) => setDeadlineReason(e.target.value)}
              rows={4}
              className="mt-3 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cs-primary-100/40"
              placeholder="Reason for deadline change"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPendingDeadlineRequest(null)}
                disabled={submittingDeadlineRequest}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void submitDeadlineRequest()}
                disabled={submittingDeadlineRequest}
              >
                {submittingDeadlineRequest ? "Sending..." : "Send Request"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function BAProjectsPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-gray-500">Loading…</p>}>
      <BAProjectsPageContent />
    </Suspense>
  );
}
