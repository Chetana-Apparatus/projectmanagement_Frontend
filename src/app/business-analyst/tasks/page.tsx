"use client";

import { Plus, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import TaskForm, {
  type TaskFormValues,
} from "@/components/common/tasks/TaskForm";
import TaskTable, { type Task } from "@/components/common/tasks/TaskTable";
import { useToast } from "@/components/common/toast/ToastProvider";
import ProjectDetailModal from "@/components/common/work-tracking/ProjectDetailModal";
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
  const [saving, setSaving] = useState(false);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [projectModalId, setProjectModalId] = useState<number | null>(null);
  const [projectFilter, setProjectFilter] = useState("");
  const [milestoneFilter, setMilestoneFilter] = useState("");
  const [taskFilter, setTaskFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [progressFilter, setProgressFilter] = useState("");
  const [projects, setProjects] = useState<
    { id: string; name: string; deadline: string }[]
  >([]);
  const [milestones, setMilestones] = useState<
    { id: string; name: string; projectId: string; endDate: string }[]
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
      setProjects(
        projectRows.map((p) => ({
          id: String(p.id),
          name: p.name,
          deadline: p.deadline ? p.deadline.split("T")[0] : "",
        })),
      );
      setMilestones(
        milestoneRows.map((m) => ({
          id: String(m.id),
          name: m.name,
          projectId: String(m.project),
          endDate: m.end_date ? m.end_date.split("T")[0] : "",
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
  const milestoneNameById = useMemo(
    () =>
      Object.fromEntries(
        milestones.map((milestone) => [milestone.id, milestone.name]),
      ),
    [milestones],
  );
  const employeeOptionNameById = useMemo(
    () =>
      Object.fromEntries(
        employees.map((employee) => [employee.id, employee.name]),
      ),
    [employees],
  );

  const filteredMilestones = useMemo(
    () =>
      projectFilter
        ? milestones.filter(
            (milestone) => milestone.projectId === projectFilter,
          )
        : milestones,
    [milestones, projectFilter],
  );

  const progressOptions = useMemo(
    () =>
      Array.from(new Set(tasks.map((task) => task.progress))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [tasks],
  );

  const taskFilterOptions = useMemo(() => {
    let list = tasks;
    if (projectFilter) list = list.filter((t) => t.project === projectFilter);
    if (milestoneFilter)
      list = list.filter((t) => t.milestone === milestoneFilter);
    return list;
  }, [tasks, projectFilter, milestoneFilter]);

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (projectFilter && task.project !== projectFilter) return false;
        if (milestoneFilter && task.milestone !== milestoneFilter) return false;
        if (taskFilter && task.id !== taskFilter) return false;
        const taskEmployee =
          task.employee || employeeOptionNameById[task.assignedBy] || "";
        if (
          employeeFilter &&
          taskEmployee.trim().toLowerCase() !==
            employeeFilter.trim().toLowerCase()
        ) {
          return false;
        }
        if (progressFilter && task.progress !== progressFilter) return false;
        return true;
      }),
    [
      tasks,
      projectFilter,
      milestoneFilter,
      taskFilter,
      employeeFilter,
      progressFilter,
      employeeOptionNameById,
    ],
  );

  const handleSubmit = async (data: TaskFormValues) => {
    if (saving) return;
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    stripDeepLinkParams(["taskId", NOTIF_FOCUS_PARAM]);
  };

  const handleDelete = async (task: Task) => {
    if (!confirm(`Delete task “${task.name}”?`)) return;
    if (deleteBusyId) return;
    setDeleteBusyId(task.id);
    try {
      await drfDelete(`/api/v1/tasks/${task.id}/`);
      showToast("Task deleted successfully", "success");
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Delete failed", "error");
    } finally {
      setDeleteBusyId(null);
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
      <div className="flex flex-wrap items-end justify-between gap-4">
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
      {loading ? <p className="ui-body-muted">Loading…</p> : null}
      {loadError ? <p className="ui-body text-red-600">{loadError}</p> : null}

      <div className="rounded-xl border border-gray-200 bg-white p-3">
        <div className="flex min-w-0 flex-nowrap items-center gap-x-2.5 overflow-x-auto py-0.5 [-ms-overflow-style:none] [scrollbar-width:thin] sm:gap-x-3 [&::-webkit-scrollbar]:h-1">
          <select
            className="h-10 min-w-[10rem] rounded-md border border-cs-border bg-white px-3 text-sm text-cs-text"
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
          >
            <option value="">All employees</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.name}>
                {employee.name}
              </option>
            ))}
          </select>

          <select
            className="h-10 w-full rounded-md border border-cs-border bg-white px-3 text-sm text-cs-text"
            value={projectFilter}
            onChange={(e) => {
              setProjectFilter(e.target.value);
              setMilestoneFilter("");
              setTaskFilter("");
            }}
          >
            <option value="">All projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          <select
            className="h-10 w-full rounded-md border border-cs-border bg-white px-3 text-sm text-cs-text"
            value={milestoneFilter}
            onChange={(e) => {
              setMilestoneFilter(e.target.value);
              setTaskFilter("");
            }}
          >
            <option value="">All milestones</option>
            {filteredMilestones.map((milestone) => (
              <option key={milestone.id} value={milestone.id}>
                {milestone.name}
              </option>
            ))}
          </select>

          <select
            className="h-10 min-w-[12rem] rounded-md border border-cs-border bg-white px-3 text-sm text-cs-text"
            value={taskFilter}
            onChange={(e) => setTaskFilter(e.target.value)}
          >
            <option value="">All tasks</option>
            {taskFilterOptions.map((task) => (
              <option key={task.id} value={task.id}>
                {task.name}
              </option>
            ))}
          </select>

          <select
            className="h-10 w-full rounded-md border border-cs-border bg-white px-3 text-sm text-cs-text"
            value={progressFilter}
            onChange={(e) => setProgressFilter(e.target.value)}
          >
            <option value="">Any progress</option>
            {progressOptions.map((progress) => (
              <option key={progress} value={progress}>
                {progress}
              </option>
            ))}
          </select>

          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setProjectFilter("");
              setMilestoneFilter("");
              setTaskFilter("");
              setEmployeeFilter("");
              setProgressFilter("");
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      <TaskTable
        tasks={filteredTasks}
        projectNameMap={projectNameById}
        milestoneNameMap={milestoneNameById}
        assignedByNameMap={employeeNameById}
        highlightRowId={highlightRowId}
        onOpenProject={(id) => setProjectModalId(Number(id))}
        deleteBusyId={deleteBusyId}
        onEdit={(task) => {
          setEditing(task);
          setOpen(true);
        }}
        onDelete={(task) => {
          void handleDelete(task);
        }}
      />

      <ProjectDetailModal
        open={projectModalId != null}
        projectId={projectModalId}
        onClose={() => setProjectModalId(null)}
      />

      {open && (
        <div className="fixed inset-0 z-50 flex justify-center overflow-y-auto p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={() => {
              if (!saving) closeModal();
            }}
            aria-label="Close modal"
          />
          <div className="pointer-events-none relative z-50 my-6 w-full max-w-xl space-y-2">
            <div className="pointer-events-auto flex justify-end">
              <Button
                variant="secondary"
                size="icon"
                onClick={closeModal}
                disabled={saving}
              >
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
                submitting={saving}
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
    <Suspense fallback={<p className="p-6 ui-body-muted">Loading…</p>}>
      <BATasksPageContent />
    </Suspense>
  );
}
