"use client";

import { Plus, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import ProjectForm, {
  type ProjectFormValues,
} from "@/components/common/projects/ProjectForm";
import ProjectTable, {
  type Project,
} from "@/components/common/projects/ProjectTable";
import { useToast } from "@/components/common/toast/ToastProvider";
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
  const fd = new FormData();
  fd.append("name", values.name.trim());
  fd.append("description", values.description ?? "");
  fd.append("start_date", values.startDate);
  fd.append("deadline", values.endDate);
  if (values.document) {
    fd.append("document", values.document);
  }
  return fd;
}

function AdminProjectsPageContent() {
  const { showToast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

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

  const handleSubmit = async (values: ProjectFormValues) => {
    try {
      const fd = buildProjectFormData(values);
      if (editing) {
        await drfFormDataPatch<ApiProject>(
          `/api/v1/projects/${editing.id}/`,
          fd,
        );
        showToast("Project updated", "success");
      } else {
        await drfFormDataPost<ApiProject>("/api/v1/projects/", fd);
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

      <ProjectTable
        projects={projects}
        highlightRowId={highlightRowId}
        onEdit={(p: Project) => {
          setEditing(p);
          setOpen(true);
        }}
        onDelete={handleDelete}
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
                      endDate: editing.endDate,
                      document: null,
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
