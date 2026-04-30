"use client";

import { Plus, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
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
import { type ApiProject, apiProjectToRow } from "@/lib/admin-mappers";
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
  if (values.documents[0]) {
    fd.append("document", values.documents[0]);
  }
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

function AdminProjectsPageContent() {
  const { showToast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [projectModalId, setProjectModalId] = useState<number | null>(null);
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [progressFilter, setProgressFilter] = useState("");

  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get("projectId");
  const nfFromUrl = searchParams.get(NOTIF_FOCUS_PARAM);

  const loadProjects = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const rows = await fetchAllPages<ApiProject>("/api/v1/projects/");
      setProjects(rows.map(apiProjectToRow));
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
    if (loading) return;
    if (!projectIdFromUrl) return;
    if (nfFromUrl === "1") return;
    const p = projects.find((row) => row.id === projectIdFromUrl);
    if (p) {
      setEditing(p);
      setOpen(true);
    }
  }, [loading, projects, projectIdFromUrl, nfFromUrl]);

  const highlightRowId = useNotificationTableHighlight(
    loading,
    "projectId",
    projects.length,
  );

  useEffect(() => {
    if (!open) return undefined;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  const uploadExtraProjectFiles = async (projectId: string, files: File[]) => {
    const extras = files.slice(1);
    await Promise.all(
      extras.map(async (file) => {
        const fd = new FormData();
        fd.append("project", projectId);
        fd.append("file", file);
        await drfFormDataPost("/api/v1/files/", fd);
      }),
    );
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

  const handleSubmit = async (values: ProjectFormValues) => {
    try {
      const fd = buildProjectFormData(values);
      if (editing) {
        const updated = await drfFormDataPatch<ApiProject>(
          `/api/v1/projects/${editing.id}/`,
          fd,
        );
        await uploadExtraProjectFiles(String(updated.id), values.documents);
        showToast("Project updated", "success");
      } else {
        const created = await drfFormDataPost<ApiProject>(
          "/api/v1/projects/",
          fd,
        );
        await uploadExtraProjectFiles(String(created.id), values.documents);
        showToast("Project created", "success");
      }

      closeProjectModal();
      await loadProjects();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Save failed", "error");
    }
  };

  const handleDelete = async (p: Project) => {
    if (!confirm(`Delete project “${p.name}”?`)) return;
    try {
      await drfDelete(`/api/v1/projects/${p.id}/`);
      showToast("Project deleted", "success");
      await loadProjects();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Delete failed", "error");
    }
  };

  const closeProjectModal = () => {
    setOpen(false);
    setEditing(null);
    stripDeepLinkParams(["projectId", NOTIF_FOCUS_PARAM]);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between">
        <h1 className="text-xl font-bold">Project Management</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus size={16} /> Add
        </Button>
      </div>

      {loading ? <p className="text-sm text-gray-500">Loading…</p> : null}
      {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}

      <div className="rounded-xl border border-gray-200 bg-white p-3">
        <div className="flex min-w-0 flex-nowrap items-center gap-x-2.5 overflow-x-auto py-0.5 sm:gap-x-3">
          <select
            className="h-10 min-w-[12rem] rounded-md border border-cs-border bg-white px-3 text-sm text-cs-text"
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
            className="h-10 min-w-[12rem] rounded-md border border-cs-border bg-white px-3 text-sm text-cs-text"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All status</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Delayed">Delayed</option>
          </select>
          <select
            className="h-10 min-w-[12rem] rounded-md border border-cs-border bg-white px-3 text-sm text-cs-text"
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
            variant="secondary"
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
        highlightRowId={highlightRowId}
        onOpenProject={(id) => setProjectModalId(Number(id))}
        onEdit={(p: Project) => {
          setEditing(p);
          setOpen(true);
        }}
        onDelete={handleDelete}
      />

      <ProjectDetailModal
        open={projectModalId != null}
        projectId={projectModalId}
        onClose={() => setProjectModalId(null)}
      />

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <button
            type="button"
            className="absolute inset-0"
            onClick={closeProjectModal}
            aria-label="Close modal"
          />

          <div className="relative z-[101] w-full max-w-xl">
            <div className="flex justify-end mb-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={closeProjectModal}
              >
                <X size={16} />
              </Button>
            </div>

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
              onSubmit={handleSubmit}
              onCancel={closeProjectModal}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ProjectPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-gray-500">Loading…</p>}>
      <AdminProjectsPageContent />
    </Suspense>
  );
}
