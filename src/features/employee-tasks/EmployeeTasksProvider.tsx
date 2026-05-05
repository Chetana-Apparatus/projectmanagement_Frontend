"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useToast } from "@/components/common/toast/ToastProvider";
import {
  type EmployeeManagedTask,
  fileNameFromPath,
  isTransitionAllowed,
  type ManagedTaskStatus,
  mapApiTaskStatusToManaged,
  toDocumentType,
} from "@/features/employee-tasks/status";
import {
  fetchWorkTracking,
  type WorkTrackingPayload,
} from "@/lib/admin-dashboard-api";
import { apiFetch } from "@/lib/api-client";

type EmployeeDashboardPayload = {
  active_task: { id: number; title: string } | null;
  completed_tasks: number;
};

type EmployeeTaskApi = {
  id: number;
  /** Primary key of the project (serializer may use `project` or `project_id`). */
  project?: number | string | null;
  project_id?: number | string | null;
  project_name?: string;
  project_document?: string | null;
  project_files?: { id: number; file: string }[];
  milestone_name?: string | null;
  milestone_document?: string | null;
  title: string;
  assigned_to_name?: string | null;
  created_by_name?: string | null;
  status: string;
  created_at?: string;
  deadline?: string | null;
  document?: string | null;
  progress_percent?: number | null;
  planned_hours?: number | null;
};

type ActivityItem = {
  id: string;
  taskId: string;
  action: "STARTED" | "PAUSED" | "STOPPED" | "COMPLETED";
  description: string;
  time: string;
};

type EmployeeTasksContextValue = {
  loading: boolean;
  tasks: EmployeeManagedTask[];
  myTasks: EmployeeManagedTask[];
  historyTasks: EmployeeManagedTask[];
  activeTask: EmployeeManagedTask | null;
  completedTasksCount: number;
  recentActivity: ActivityItem[];
  startTask: (taskId: string) => Promise<void>;
  pauseTask: (taskId: string) => Promise<void>;
  stopTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  requestDeadlineChange: (
    taskId: string,
    newDeadline: string,
    reason: string,
  ) => Promise<boolean>;
  refresh: () => Promise<void>;
  canTransition: (
    status: ManagedTaskStatus,
    nextStatus: ManagedTaskStatus,
  ) => boolean;
};

const EmployeeTasksContext = createContext<EmployeeTasksContextValue | null>(
  null,
);

export function EmployeeTasksProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<EmployeeManagedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [activeTaskFromApi, setActiveTaskFromApi] = useState<number | null>(
    null,
  );
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  const buildManagedTask = useCallback(
    (task: EmployeeTaskApi): EmployeeManagedTask => {
      const projectFilePaths = (task.project_files ?? [])
        .map((row) => row.file)
        .filter((doc): doc is string => Boolean(doc));
      const documents = [
        task.project_document,
        ...projectFilePaths,
        task.milestone_document,
        task.document,
      ]
        .filter((doc): doc is string => Boolean(doc))
        .filter((doc, index, list) => {
          const withoutQuery = doc.split("?")[0];
          return (
            list.findIndex((item) => item.split("?")[0] === withoutQuery) ===
            index
          );
        })
        .map((doc) => ({
          name: fileNameFromPath(doc),
          url: doc,
          type: toDocumentType(doc),
        }));
      return {
        id: String(task.id),
        projectId: (() => {
          const raw = task.project ?? task.project_id;
          if (raw === null || raw === undefined || raw === "") return "";
          return String(raw).trim();
        })(),
        project: task.project_name ?? "-",
        milestone: task.milestone_name ?? "-",
        task: task.title,
        status: mapApiTaskStatusToManaged(task.status),
        startDate: task.created_at
          ? new Date(task.created_at).toISOString().slice(0, 10)
          : "-",
        deadline: task.deadline ?? "-",
        assignedBy: task.created_by_name ?? task.assigned_to_name ?? "-",
        documents,
        lastInteractionAt: Date.now(),
        progressPercent:
          typeof task.progress_percent === "number" ? task.progress_percent : 0,
      };
    },
    [],
  );

  const displayStatusFromActivity = useCallback(
    (
      task: EmployeeManagedTask,
      latestActionByTaskId: Record<string, ActivityItem["action"]>,
    ): EmployeeManagedTask => {
      const latestAction = latestActionByTaskId[task.id];
      if (!latestAction) return task;
      // Backend maps stop action to PAUSED status. Only reinterpret PAUSED
      // as STOPPED when latest activity confirms a stop event.
      if (latestAction === "STOPPED" && task.status === "Paused") {
        return { ...task, status: "Stopped" };
      }
      if (
        latestAction === "PAUSED" &&
        task.status !== "Completed" &&
        task.status !== "In Progress"
      ) {
        return { ...task, status: "Paused" };
      }
      if (latestAction === "STARTED" && task.status !== "Completed") {
        return { ...task, status: "In Progress" };
      }
      return task;
    },
    [],
  );

  const refresh = useCallback(async () => {
    try {
      const [dashboardRes, tasksRes] = await Promise.all([
        apiFetch<EmployeeDashboardPayload>("/api/v1/employee/dashboard", {
          method: "GET",
        }),
        apiFetch<EmployeeTaskApi[]>("/api/v1/my/tasks", { method: "GET" }),
      ]);

      if (dashboardRes.success && dashboardRes.data) {
        setCompletedTasksCount(dashboardRes.data.completed_tasks ?? 0);
        setActiveTaskFromApi(dashboardRes.data.active_task?.id ?? null);
      }

      let workTracking: WorkTrackingPayload = { recent_activity: [] };
      try {
        workTracking = await fetchWorkTracking();
      } catch {
        // Optional feed only; dashboard and /my/tasks must still load if this fails.
      }

      const activityRows = (workTracking.recent_activity ??
        []) as WorkTrackingPayload["recent_activity"];
      const normalizedActivity = (activityRows ?? [])
        .slice()
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        .map((item, idx) => ({
          id: `${item.task_id}-${item.timestamp}-${idx}`,
          taskId: String(item.task_id),
          action: item.action,
          description: `You ${item.action.toLowerCase()} task "${item.task_title}" in ${item.project_name}`,
          time: new Date(item.timestamp).toLocaleString(),
        }));
      setRecentActivity(normalizedActivity);

      const latestActionByTaskId: Record<string, ActivityItem["action"]> = {};
      for (const item of normalizedActivity) {
        if (!latestActionByTaskId[item.taskId]) {
          latestActionByTaskId[item.taskId] = item.action;
        }
      }

      if (tasksRes.success && tasksRes.data) {
        const mappedTasks = tasksRes.data.map(buildManagedTask);
        setTasks(
          mappedTasks.map((task) =>
            displayStatusFromActivity(task, latestActionByTaskId),
          ),
        );
      } else {
        setTasks([]);
      }
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Failed to load employee data",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [buildManagedTask, displayStatusFromActivity, showToast]);

  useEffect(() => {
    void refresh();
    const intervalId = window.setInterval(() => {
      void refresh();
    }, 30000);
    return () => window.clearInterval(intervalId);
  }, [refresh]);

  const startTask = useCallback(
    async (taskId: string) => {
      const res = await apiFetch<{ task_id: number }>(
        `/api/v1/tasks/${taskId}/start/`,
        {
          method: "POST",
        },
      );
      if (!res.success) {
        showToast(res.message || "Failed to start task", "error");
        return;
      }
      showToast("Task started", "success");
      await refresh();
    },
    [refresh, showToast],
  );

  const pauseTask = useCallback(
    async (taskId: string) => {
      const res = await apiFetch<{ task_id: number }>(
        `/api/v1/tasks/${taskId}/pause/`,
        {
          method: "POST",
        },
      );
      if (!res.success) {
        showToast(res.message || "Failed to pause task", "error");
        return;
      }
      showToast("Task paused", "success");
      await refresh();
    },
    [refresh, showToast],
  );

  const stopTask = useCallback(
    async (taskId: string) => {
      const res = await apiFetch<{ task_id: number }>(
        `/api/v1/tasks/${taskId}/stop/`,
        {
          method: "POST",
        },
      );
      if (!res.success) {
        showToast(res.message || "Failed to stop task", "error");
        return;
      }
      showToast("Task stopped", "success");
      await refresh();
    },
    [refresh, showToast],
  );

  const completeTask = useCallback(
    async (taskId: string) => {
      const res = await apiFetch<{ task_id: number }>(
        `/api/v1/tasks/${taskId}/status/`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: "COMPLETED" }),
        },
      );
      if (!res.success) {
        showToast(res.message || "Failed to complete task", "error");
        return;
      }
      showToast("Task completed", "success");
      await refresh();
    },
    [refresh, showToast],
  );

  const requestDeadlineChange = useCallback(
    async (taskId: string, newDeadline: string, reason: string) => {
      const res = await apiFetch<{ task_id: number }>(
        `/api/v1/tasks/${taskId}/request-deadline-change/`,
        {
          method: "POST",
          body: JSON.stringify({ new_deadline: newDeadline, reason }),
        },
      );
      if (!res.success) {
        showToast(res.message || "Deadline request failed", "error");
        return false;
      }
      await refresh();
      return true;
    },
    [refresh, showToast],
  );

  const myTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.status === "Not Started" ||
          task.status === "In Progress" ||
          task.status === "Paused" ||
          task.status === "Stopped" ||
          task.status === "Delayed",
      ),
    [tasks],
  );

  const historyTasks = useMemo(
    () => tasks.filter((task) => task.status === "Completed"),
    [tasks],
  );

  const activeTask = useMemo(() => {
    if (activeTaskFromApi !== null) {
      const inProgressTask = tasks.find(
        (task) => Number(task.id) === activeTaskFromApi,
      );
      if (inProgressTask) return inProgressTask;
    }
    const lastTracked = recentActivity.find(
      (item) => item.action !== "COMPLETED",
    );
    if (!lastTracked) return null;
    const fallbackTask = tasks.find((task) => task.id === lastTracked.taskId);
    if (!fallbackTask) return null;
    if (
      fallbackTask.status === "Completed" ||
      fallbackTask.status === "Not Started"
    ) {
      return null;
    }
    return fallbackTask;
  }, [activeTaskFromApi, recentActivity, tasks]);

  const value = useMemo<EmployeeTasksContextValue>(
    () => ({
      loading,
      tasks,
      myTasks,
      historyTasks,
      activeTask,
      completedTasksCount,
      recentActivity,
      startTask,
      pauseTask,
      stopTask,
      completeTask,
      requestDeadlineChange,
      refresh,
      canTransition: (status, nextStatus) =>
        isTransitionAllowed(status, nextStatus),
    }),
    [
      loading,
      tasks,
      myTasks,
      historyTasks,
      activeTask,
      completedTasksCount,
      recentActivity,
      startTask,
      pauseTask,
      stopTask,
      completeTask,
      requestDeadlineChange,
      refresh,
    ],
  );

  return (
    <EmployeeTasksContext.Provider value={value}>
      {children}
    </EmployeeTasksContext.Provider>
  );
}

export function useEmployeeTasks() {
  const context = useContext(EmployeeTasksContext);
  if (!context) {
    throw new Error(
      "useEmployeeTasks must be used within EmployeeTasksProvider",
    );
  }
  return context;
}
