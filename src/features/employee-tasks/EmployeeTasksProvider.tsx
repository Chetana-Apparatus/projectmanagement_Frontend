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
  applyAutoStop,
  type EmployeeManagedTask,
  isTransitionAllowed,
  loadEmployeeTasks,
  type ManagedTaskStatus,
  saveEmployeeTasks,
  transitionTaskStatus,
} from "@/features/employee-tasks/status";

type EmployeeTasksContextValue = {
  tasks: EmployeeManagedTask[];
  myTasks: EmployeeManagedTask[];
  historyTasks: EmployeeManagedTask[];
  activeTask: EmployeeManagedTask | null;
  startTask: (taskId: string) => void;
  pauseTask: (taskId: string) => void;
  stopTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
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
  const [tasks, setTasks] = useState<EmployeeManagedTask[]>(() =>
    loadEmployeeTasks(),
  );

  useEffect(() => {
    saveEmployeeTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const now = new Date();
      if (now.getHours() < 20) {
        return;
      }

      setTasks((prevTasks) => {
        const { nextTasks, autoStoppedIds } = applyAutoStop(prevTasks);
        if (autoStoppedIds.length > 0) {
          showToast(
            "Task was automatically stopped due to inactivity",
            "warning",
          );
        }
        return nextTasks;
      });
    }, 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, [showToast]);

  const runTransition = useCallback(
    (taskId: string, nextStatus: ManagedTaskStatus, toastMessage: string) => {
      setTasks((prevTasks) => {
        const { nextTasks, didTransition } = transitionTaskStatus(
          prevTasks,
          taskId,
          nextStatus,
        );
        if (didTransition) {
          showToast(
            toastMessage,
            nextStatus === "Completed" ? "success" : "warning",
          );
        }
        return nextTasks;
      });
    },
    [showToast],
  );

  const myTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.status === "Not Started" ||
          task.status === "Pending" ||
          task.status === "In Progress" ||
          task.status === "Paused",
      ),
    [tasks],
  );

  const historyTasks = useMemo(
    () =>
      tasks.filter(
        (task) => task.status === "Completed" || task.status === "Auto-stopped",
      ),
    [tasks],
  );

  const activeTask = useMemo(() => {
    const inProgress = tasks
      .filter((task) => task.status === "In Progress")
      .sort((a, b) => b.lastInteractionAt - a.lastInteractionAt);
    if (inProgress.length > 0) {
      return inProgress[0];
    }

    const paused = tasks
      .filter((task) => task.status === "Paused")
      .sort((a, b) => b.lastInteractionAt - a.lastInteractionAt);
    return paused[0] ?? null;
  }, [tasks]);

  const value = useMemo<EmployeeTasksContextValue>(
    () => ({
      tasks,
      myTasks,
      historyTasks,
      activeTask,
      startTask: (taskId) =>
        runTransition(taskId, "In Progress", "Task started"),
      pauseTask: (taskId) => runTransition(taskId, "Paused", "Task paused"),
      stopTask: (taskId) => runTransition(taskId, "Completed", "Task stopped"),
      completeTask: (taskId) =>
        runTransition(taskId, "Completed", "Task completed"),
      canTransition: (status, nextStatus) =>
        isTransitionAllowed(status, nextStatus),
    }),
    [tasks, myTasks, historyTasks, activeTask, runTransition],
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
