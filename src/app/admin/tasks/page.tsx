"use client";

import { Plus, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import TaskForm, {
  type TaskFormValues,
} from "@/components/common/tasks/TaskForm";
import TaskTable, { type Task } from "@/components/common/tasks/TaskTable";
import { useToast } from "@/components/common/toast/ToastProvider";
import Button from "@/components/ui/Button";
import { useNotificationTableHighlight } from "@/hooks/useNotificationTableHighlight";
import {
  type ApiMilestone,
  type ApiProject,
  type ApiTask,
  type ApiUser,
  apiTaskToRow,
  buildTaskFormData,
} from "@/lib/admin-mappers";
import {
  drfDelete,
  drfFormDataPatch,
  drfFormDataPost,
  fetchAllPages,
} from "@/lib/pms-http";
import { NOTIF_FOCUS_PARAM, stripDeepLinkParams } from "@/lib/url-deep-link";

function AdminTasksPageContent() {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [projectOptions, setProjectOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [milestoneOptions, setMilestoneOptions] = useState<
    { id: string; name: string; projectId: string }[]
  >([]);
  const [employeeOptions, setEmployeeOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [userNameMap, setUserNameMap] = useState<Record<string, string>>({});
  const searchParams = useSearchParams();
  const taskIdFromUrl = searchParams.get("taskId");
  const nfFromUrl = searchParams.get(NOTIF_FOCUS_PARAM);

  const load = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const [userRows, projectRows, milestoneRows, taskRows] =
        await Promise.all([
          fetchAllPages<ApiUser>("/api/v1/users/"),
          fetchAllPages<ApiProject>("/api/v1/projects/"),
          fetchAllPages<ApiMilestone>("/api/v1/milestones/"),
          fetchAllPages<ApiTask>("/api/v1/tasks/"),
        ]);

      const names: Record<string, string> = {};
      for (const u of userRows) {
        const label =
          `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email;
        names[String(u.id)] = label;
      }
      setUserNameMap(names);

      setEmployeeOptions(
        userRows
          .filter((u) => u.role === "EMPLOYEE")
          .map((u) => ({
            id: String(u.id),
            name:
              `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email,
          })),
      );

      setProjectOptions(
        projectRows.map((p) => ({ id: String(p.id), name: p.name })),
      );

      setMilestoneOptions(
        milestoneRows.map((m) => ({
          id: String(m.id),
          name: m.name,
          projectId: String(m.project),
        })),
      );

      setTasks(taskRows.map(apiTaskToRow));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (loading) return;
    if (!taskIdFromUrl) return;
    if (nfFromUrl === "1") return;
    const task = tasks.find((t) => t.id === taskIdFromUrl);
    if (task) {
      setEditing(task);
      setOpen(true);
    }
  }, [loading, tasks, taskIdFromUrl, nfFromUrl]);

  const highlightRowId = useNotificationTableHighlight(
    loading,
    "taskId",
    tasks.length,
  );

  const projectNameMap = useMemo(
    () => Object.fromEntries(projectOptions.map((p) => [p.id, p.name])),
    [projectOptions],
  );
  const projectHrefMap = useMemo(
    () =>
      Object.fromEntries(
        projectOptions.map((p) => [p.id, `/admin/projects/${p.id}`]),
      ),
    [projectOptions],
  );

  const milestoneNameMap = useMemo(
    () => Object.fromEntries(milestoneOptions.map((m) => [m.id, m.name])),
    [milestoneOptions],
  );

  /** Maps created_by ids to labels */
  const assignedByNameMap = userNameMap;

  const handleSubmit = async (data: TaskFormValues) => {
    try {
      const fd = buildTaskFormData(data);
      if (editing) {
        await drfFormDataPatch<ApiTask>(`/api/v1/tasks/${editing.id}/`, fd);
        showToast("Task updated successfully", "success");
      } else {
        await drfFormDataPost<ApiTask>("/api/v1/tasks/", fd);
        showToast("Task created successfully", "success");
      }

      closeModal();
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Save failed", "error");
    }
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    stripDeepLinkParams(["taskId", NOTIF_FOCUS_PARAM]);
  };

  const handleEdit = (task: Task) => {
    setEditing(task);
    setOpen(true);
  };

  const handleDelete = async (task: Task) => {
    if (!confirm(`Delete task “${task.name}”?`)) return;
    try {
      await drfDelete(`/api/v1/tasks/${task.id}/`);
      showToast("Task deleted successfully", "success");
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Delete failed", "error");
    }
  };

  useEffect(() => {
    if (!open) return undefined;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between">
        <h1 className="ui-page-title">Tasks</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus size={16} /> Add Task
        </Button>
      </div>

      {loading ? <p className="text-sm text-gray-500">Loading…</p> : null}
      {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}

      <TaskTable
        tasks={tasks}
        projectNameMap={projectNameMap}
        projectHrefMap={projectHrefMap}
        milestoneNameMap={milestoneNameMap}
        assignedByNameMap={assignedByNameMap}
        highlightRowId={highlightRowId}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {open ? (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={closeModal}
            aria-label="Close modal"
          />
          <div className="relative z-50 my-6 w-full max-w-xl space-y-2 pointer-events-none">
            <div className="flex justify-end pointer-events-auto">
              <Button variant="secondary" size="icon" onClick={closeModal}>
                <X size={16} />
              </Button>
            </div>

            <div className="pointer-events-auto">
              <TaskForm
                initial={editing}
                employees={employeeOptions}
                projects={projectOptions}
                milestones={milestoneOptions}
                showAssignedBy
                onSubmit={handleSubmit}
                onCancel={closeModal}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function TaskPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-gray-500">Loading…</p>}>
      <AdminTasksPageContent />
    </Suspense>
  );
}
