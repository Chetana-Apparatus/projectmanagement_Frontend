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
  const fd = new FormData();
  fd.append("project", values.projectId);
  fd.append("name", values.name.trim());
  fd.append("description", values.description?.trim() ?? "");
  fd.append("start_date", values.startDate);
  fd.append("end_date", values.endDate);
  return fd;
}

function BAMilestonesPageContent() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<SelectOption[]>([]);
  const [milestones, setMilestones] = useState<MilestoneRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<MilestoneRecord | null>(
    null,
  );

  const searchParams = useSearchParams();
  const milestoneIdFromUrl = searchParams.get("milestoneId");
  const nfFromUrl = searchParams.get(NOTIF_FOCUS_PARAM);

  const reload = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const [projectRows, milestoneRows] = await Promise.all([
        fetchAllPages<ApiProject>("/api/v1/projects/"),
        fetchAllPages<ApiMilestone>("/api/v1/milestones/"),
      ]);
      setProjects(
        projectRows.map((project) => ({
          id: String(project.id),
          label: project.name,
        })),
      );
      setMilestones(
        milestoneRows.map((milestone) => apiMilestoneToRecord(milestone)),
      );
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
      endDate: editingMilestone.endDate,
    };
  }, [editingMilestone]);

  const closeForm = () => {
    setFormMode(null);
    setEditingMilestoneId(null);
    stripDeepLinkParams(["milestoneId", NOTIF_FOCUS_PARAM]);
  };

  const handleCreate = (values: MilestoneFormValues) => {
    void (async () => {
      try {
        const fd = milestoneFormToFormData(values);
        await drfFormDataPost<ApiMilestone>("/api/v1/milestones/", fd);
        showToast("Milestone created successfully", "success");
        closeForm();
        await reload();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Create failed", "error");
      }
    })();
  };

  const handleUpdate = (values: MilestoneFormValues) => {
    if (!editingMilestoneId) return;
    void (async () => {
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
    })();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    void (async () => {
      try {
        await drfDelete(`/api/v1/milestones/${deleteTarget.id}/`);
        showToast("Milestone deleted successfully", "success");
        setDeleteTarget(null);
        await reload();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Delete failed", "error");
      }
    })();
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
          <h3 className="h3">Milestone Management</h3>
          <p className="ui-body-muted">
            Plan project milestones, assign employees, and track stakeholder
            watchers.
          </p>
        </div>
        <Button type="button" onClick={() => setFormMode("create")}>
          <Plus size={16} />
          Add Milestone
        </Button>
      </div>

      {loading ? <p className="text-sm text-gray-500">Loading…</p> : null}
      {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}

      <MilestoneTable
        milestones={milestones}
        projectNameMap={projectNameMap}
        highlightRowId={highlightRowId}
        onEdit={(milestone) => {
          setEditingMilestoneId(milestone.id);
          setFormMode("edit");
        }}
        onDelete={(milestone) => setDeleteTarget(milestone)}
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
                onClick={handleDelete}
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

export default function BAMilestonesPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-gray-500">Loading…</p>}>
      <BAMilestonesPageContent />
    </Suspense>
  );
}
