"use client";

import { Plus } from "lucide-react";
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
  const [projectModalId, setProjectModalId] = useState<number | null>(null);
  const [projectFilter, setProjectFilter] = useState("");
  const [milestoneFilter, setMilestoneFilter] = useState("");
  const [progressFilter, setProgressFilter] = useState("");

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
          deadline: project.deadline ? project.deadline.split("T")[0] : "",
          startDate: project.start_date
            ? project.start_date.split("T")[0]
            : "",
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

  const milestoneSelectOptions = useMemo(() => {
    let list = milestones;
    if (projectFilter) {
      list = list.filter((m) => m.projectId === projectFilter);
    }
    return [...list].sort((a, b) => {
      const pa = projectNameMap[a.projectId] ?? a.projectId;
      const pb = projectNameMap[b.projectId] ?? b.projectId;
      const byP = pa.localeCompare(pb, undefined, { sensitivity: "base" });
      if (byP !== 0) return byP;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
  }, [milestones, projectFilter, projectNameMap]);

  useEffect(() => {
    if (!milestoneFilter) return;
    const ok = milestoneSelectOptions.some((m) => m.id === milestoneFilter);
    if (!ok) setMilestoneFilter("");
  }, [milestoneFilter, milestoneSelectOptions]);

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
        if (milestoneFilter && m.id !== milestoneFilter) return false;
        const p = m.progressPercent ?? null;
        if (progressFilter === "0-50" && !(p != null && p <= 50)) return false;
        if (progressFilter === "51-75" && !(p != null && p > 50 && p <= 75))
          return false;
        if (progressFilter === "76-100" && !(p != null && p > 75)) return false;
        return true;
      }),
    [milestones, projectFilter, milestoneFilter, progressFilter],
  );

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

  const handleDeleteMilestone = async (milestone: MilestoneRecord) => {
    try {
      await drfDelete(`/api/v1/milestones/${milestone.id}/`);
      showToast("Milestone deleted successfully", "success");
      await reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Delete failed", "error");
    }
  };

  useEffect(() => {
    if (!formMode) return undefined;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [formMode]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="h2 font-semibold">Milestone Management</h2>
        </div>
        <Button type="button" onClick={() => setFormMode("create")}>
          <Plus size={16} />
          Add Milestone
        </Button>
      </div>

      {loading ? <p className="text-sm text-gray-500">Loading…</p> : null}
      {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-center">
          <select
            className="h-10 w-full min-w-0 rounded-md border border-cs-border bg-white px-3 text-sm text-cs-text"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            aria-label="Filter by project"
          >
            <option value="">All projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.label}
              </option>
            ))}
          </select>
          <select
            className="h-10 w-full min-w-0 rounded-md border border-cs-border bg-white px-3 text-sm text-cs-text"
            value={milestoneFilter}
            onChange={(e) => setMilestoneFilter(e.target.value)}
            aria-label="Filter by milestone"
          >
            <option value="">All milestones</option>
            {milestoneSelectOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {projectFilter
                  ? m.name
                  : `${projectNameMap[m.projectId] ?? "Project"} · ${m.name}`}
              </option>
            ))}
          </select>
          <select
            className="h-10 w-full min-w-0 rounded-md border border-cs-border bg-white px-3 text-sm text-cs-text"
            value={progressFilter}
            onChange={(e) => setProgressFilter(e.target.value)}
            aria-label="Filter by progress"
          >
            <option value="">Any progress</option>
            <option value="0-50">0% - 50%</option>
            <option value="51-75">51% - 75%</option>
            <option value="76-100">76% - 100%</option>
          </select>
          <Button
            type="button"
            className="h-10 w-full justify-center px-5 sm:col-span-2 xl:col-span-1 2xl:col-span-1 2xl:shrink-0"
            onClick={() => {
              setProjectFilter("");
              setMilestoneFilter("");
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
        onDelete={(milestone) => {
          void handleDeleteMilestone(milestone);
        }}
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
          <div className="relative z-50 w-full max-w-4xl">
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
