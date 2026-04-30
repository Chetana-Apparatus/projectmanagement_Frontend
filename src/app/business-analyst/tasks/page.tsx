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

function BATasksPageContent() {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [milestones, setMilestones] = useState<
    { id: string; name: string; projectId: string }[]
  >([]);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [employeeNameById, setEmployeeNameById] = useState<
    Record<string, string>
  >({});
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
        names[String(u.id)] =
          `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email;
      }
      setEmployeeNameById(names);
      setEmployees(
        userRows
          .filter((u) => u.role === "EMPLOYEE")
          .map((u) => ({
            id: String(u.id),
            name:
              `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email,
          })),
      );
      setProjects(projectRows.map((p) => ({ id: String(p.id), name: p.name })));
      setMilestones(
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

  const projectNameById = useMemo(
    () =>
      Object.fromEntries(projects.map((project) => [project.id, project.name])),
    [projects],
  );
  const projectHrefMap = useMemo(
    () =>
      Object.fromEntries(
        projects.map((project) => [
          project.id,
          `/business-analyst/projects/${project.id}`,
        ]),
      ),
    [projects],
  );
  const milestoneNameById = useMemo(
    () =>
      Object.fromEntries(
        milestones.map((milestone) => [milestone.id, milestone.name]),
      ),
    [milestones],
  );

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
    <div className="space-y-6 p-6">
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
        projectNameMap={projectNameById}
        projectHrefMap={projectHrefMap}
        milestoneNameMap={milestoneNameById}
        assignedByNameMap={employeeNameById}
        highlightRowId={highlightRowId}
        onEdit={(task) => {
          setEditing(task);
          setOpen(true);
        }}
        onDelete={(task) => {
          void handleDelete(task);
        }}
      />

      {open && (
        <div className="fixed inset-0 z-50 flex justify-center overflow-y-auto p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={closeModal}
            aria-label="Close modal"
          />
          <div className="pointer-events-none relative z-50 my-6 w-full max-w-xl space-y-2">
            <div className="pointer-events-auto flex justify-end">
              <Button variant="secondary" size="icon" onClick={closeModal}>
                <X size={16} />
              </Button>
            </div>

            <div className="pointer-events-auto">
              <TaskForm
                initial={editing}
                employees={employees}
                projects={projects}
                milestones={milestones}
                showAssignedBy
                onSubmit={handleSubmit}
                onCancel={closeModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BATasksPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-gray-500">Loading…</p>}>
      <BATasksPageContent />
    </Suspense>
  );
}
