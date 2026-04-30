"use client";

import { Plus, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import MilestoneForm, {
  type MilestoneFormValues,
  type SelectOption,
} from "@/components/common/milestones/MilestoneForm";
import MilestoneTable, {
  type MilestoneRecord,
} from "@/components/common/milestones/MilestoneTable";
import { useToast } from "@/components/common/toast/ToastProvider";
import ProjectDetailModal from "@/components/common/work-tracking/ProjectDetailModal";
import Button from "@/components/ui/Button";
import { useNotificationTableHighlight } from "@/hooks/useNotificationTableHighlight";
import {
  type ApiMilestone,
  type ApiProject,
  apiMilestoneToRecord,
} from "@/lib/admin-mappers";
import {
  drfDelete,
  drfFormDataPatch,
  drfFormDataPost,
  fetchAllPages,
} from "@/lib/pms-http";
import { NOTIF_FOCUS_PARAM, stripDeepLinkParams } from "@/lib/url-deep-link";

function milestoneFormToFormData(values: MilestoneFormValues): FormData {
  const statusMap: Record<MilestoneFormValues["status"], string> = {
    "Not Started": "NOT_STARTED",
    "In Progress": "IN_PROGRESS",
    Completed: "COMPLETED",
    Delayed: "DELAYED",
  };
  const fd = new FormData();
  fd.append("project", values.projectId);
  fd.append("name", values.name.trim());
  fd.append("description", values.description?.trim() ?? "");
  fd.append("start_date", values.startDate);
  fd.append("end_date", values.expectedDate);
  fd.append("status", statusMap[values.status]);
  return fd;
}

function normalizeMilestoneFormStatus(
  status: MilestoneRecord["status"],
): MilestoneFormValues["status"] {
  if (status === "Completed") return "Completed";
  if (status === "In Progress") return "In Progress";
  if (status === "Delayed") return "Delayed";
  return "Not Started";
}

function AdminMilestonesPageContent() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<SelectOption[]>([]);
  const [milestones, setMilestones] = useState<MilestoneRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<MilestoneRecord | null>(
    null,
  );
  const [projectModalId, setProjectModalId] = useState<number | null>(null);
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [progressFilter, setProgressFilter] = useState("");

  const searchParams = useSearchParams();
  const milestoneIdFromUrl = searchParams.get("milestoneId");
  const nfFromUrl = searchParams.get(NOTIF_FOCUS_PARAM);

  const reload = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const [projRows, msRows] = await Promise.all([
        fetchAllPages<ApiProject>("/api/v1/projects/"),
        fetchAllPages<ApiMilestone>("/api/v1/milestones/"),
      ]);

      setProjects(
        projRows.map((p) => ({
          id: String(p.id),
          label: p.name,
          deadline: p.deadline,
        })),
      );

      setMilestones(msRows.map((m) => apiMilestoneToRecord(m)));
    } catch (e) {
      setLoadError(
        e instanceof Error ? e.message : "Failed to load milestones",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (loading) return;
    if (!milestoneIdFromUrl) return;
    if (nfFromUrl === "1") return;
    const m = milestones.find((row) => row.id === milestoneIdFromUrl);
    if (m) {
      setEditingMilestoneId(m.id);
      setFormMode("edit");
    }
  }, [loading, milestones, milestoneIdFromUrl, nfFromUrl]);

  const highlightRowId = useNotificationTableHighlight(
    loading,
    "milestoneId",
    milestones.length,
  );

  const projectNameMap = useMemo(
    () =>
      projects.reduce<Record<string, string>>((acc, project) => {
        acc[project.id] = project.label;
        return acc;
      }, {}),
    [projects],
  );

  const editingMilestone = useMemo(
    () =>
      milestones.find((milestone) => milestone.id === editingMilestoneId) ??
      null,
    [editingMilestoneId, milestones],
  );

  const initialValues = useMemo<MilestoneFormValues | undefined>(() => {
    if (!editingMilestone) return undefined;
    return {
      projectId: editingMilestone.projectId,
      name: editingMilestone.name,
      description: editingMilestone.description ?? "",
      startDate: editingMilestone.startDate,
      expectedDate: editingMilestone.expectedDate,
      status: normalizeMilestoneFormStatus(editingMilestone.status),
    };
  }, [editingMilestone]);

  const filteredMilestones = useMemo(
    () =>
      milestones.filter((m) => {
        if (projectFilter && m.projectId !== projectFilter) return false;
        if (statusFilter && m.status !== statusFilter) return false;
        const p = m.progressPercent ?? null;
        if (progressFilter === "0-50" && !(p != null && p <= 50)) return false;
        if (progressFilter === "51-75" && !(p != null && p > 50 && p <= 75))
          return false;
        if (progressFilter === "76-100" && !(p != null && p > 75)) return false;
        return true;
      }),
    [milestones, projectFilter, statusFilter, progressFilter],
  );

  const closeForm = () => {
    setFormMode(null);
    setEditingMilestoneId(null);
    stripDeepLinkParams(["milestoneId", NOTIF_FOCUS_PARAM]);
  };

  const handleCreate = async (values: MilestoneFormValues) => {
    try {
      const fd = milestoneFormToFormData(values);
      await drfFormDataPost<ApiMilestone>("/api/v1/milestones/", fd);
      showToast("Milestone created successfully", "success");
      closeForm();
      await reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Create failed", "error");
    }
  };

  const handleUpdate = async (values: MilestoneFormValues) => {
    if (!editingMilestoneId) return;
    try {
      const fd = milestoneFormToFormData(values);
      await drfFormDataPatch<ApiMilestone>(
        `/api/v1/milestones/${editingMilestoneId}/`,
        fd,
      );
      showToast("Milestone updated successfully", "success");
      closeForm();
      await reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Update failed", "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await drfDelete(`/api/v1/milestones/${deleteTarget.id}/`);
      showToast("Milestone deleted successfully", "success");
      setDeleteTarget(null);
      await reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Delete failed", "error");
    }
  };

  useEffect(() => {
    const isModalOpen = Boolean(formMode || deleteTarget);
    if (!isModalOpen) return undefined;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [formMode, deleteTarget]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="h2">Milestone Management</h3>
        </div>
        <Button type="button" onClick={() => setFormMode("create")}>
          <Plus size={16} />
          Add Milestone
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
                {project.label}
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

      <MilestoneTable
        milestones={filteredMilestones}
        projectNameMap={projectNameMap}
        highlightRowId={highlightRowId}
        onOpenProjectAction={(id) => setProjectModalId(Number(id))}
        onEdit={(milestone) => {
          setEditingMilestoneId(milestone.id);
          setFormMode("edit");
        }}
        onDelete={(milestone) => setDeleteTarget(milestone)}
      />

      <ProjectDetailModal
        open={projectModalId != null}
        projectId={projectModalId}
        onClose={() => setProjectModalId(null)}
      />

      {formMode ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={closeForm}
            aria-label="Close modal"
          />
          <div className="relative z-50 w-full max-w-4xl space-y-3">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-9 w-9"
                onClick={closeForm}
                aria-label="Close milestone form"
              >
                <X size={16} />
              </Button>
            </div>

            <MilestoneForm
              mode={formMode}
              projects={projects}
              initialValues={formMode === "edit" ? initialValues : undefined}
              onCancel={closeForm}
              onSubmit={formMode === "create" ? handleCreate : handleUpdate}
            />
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-white p-5 shadow-lg">
            <h2 className="h3">Delete Milestone</h2>
            <p className="ui-body mt-2">
              Are you sure you want to delete this milestone?
            </p>
            <p className="ui-caption mt-1 text-gray-600">{deleteTarget.name}</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-red-600 text-white hover:ring-red-200"
                onClick={handleConfirmDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminMilestonesPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-gray-500">Loading…</p>}>
      <AdminMilestonesPageContent />
    </Suspense>
  );
}
