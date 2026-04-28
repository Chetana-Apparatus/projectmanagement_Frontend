"use client";

export type DocumentType = "docx" | "md";

export type ManagedTaskStatus =
  | "Not Started"
  | "In Progress"
  | "Pending"
  | "Paused"
  | "Completed"
  | "Auto-stopped";

export type TaskDocument = {
  name: string;
  url: string;
  type: DocumentType;
};

export type EmployeeManagedTask = {
  id: string;
  project: string;
  milestone: string;
  task: string;
  status: ManagedTaskStatus;
  startDate: string;
  deadline: string;
  assignedBy: string;
  documents: TaskDocument[];
  lastInteractionAt: number;
};

type LegacyManagedTaskStatus = ManagedTaskStatus | "Stopped" | "Auto Stopped";
type PersistedEmployeeTask = Omit<EmployeeManagedTask, "status"> & {
  status: LegacyManagedTaskStatus;
};

const now = Date.now();

export const seedEmployeeTasks: EmployeeManagedTask[] = [
  {
    id: "T-101",
    project: "Retail Revamp",
    milestone: "Checkout Upgrade",
    task: "Implement discount rules validation",
    status: "In Progress",
    startDate: "Apr 20, 2026",
    deadline: "May 02, 2026",
    assignedBy: "Anita BA",
    documents: [{ name: "SOW.docx", url: "/docs/sow.docx", type: "docx" }],
    lastInteractionAt: now,
  },
  {
    id: "T-102",
    project: "Planning Hub",
    milestone: "Sprint Board",
    task: "Add loading state for task timeline",
    status: "Not Started",
    startDate: "Apr 24, 2026",
    deadline: "May 04, 2026",
    assignedBy: "Rahul BA",
    documents: [
      { name: "SprintPlan.docx", url: "/docs/sprint-plan.docx", type: "docx" },
    ],
    lastInteractionAt: now,
  },
  {
    id: "T-103",
    project: "Finance Suite",
    milestone: "Invoice Sprint",
    task: "Refactor invoice export flow",
    status: "Pending",
    startDate: "Apr 23, 2026",
    deadline: "May 05, 2026",
    assignedBy: "Mira BA",
    documents: [
      { name: "InvoiceFlow.md", url: "/docs/invoice-flow.md", type: "md" },
    ],
    lastInteractionAt: now,
  },
  {
    id: "T-104",
    project: "Access Control",
    milestone: "Security Patch",
    task: "Fix role-based route permission bug",
    status: "Pending",
    startDate: "Apr 22, 2026",
    deadline: "May 01, 2026",
    assignedBy: "Vivek BA",
    documents: [
      {
        name: "AccessRules.docx",
        url: "/docs/access-rules.docx",
        type: "docx",
      },
    ],
    lastInteractionAt: now,
  },
  {
    id: "T-105",
    project: "Internal Ops",
    milestone: "QA Readiness",
    task: "Create regression checklist for dashboard",
    status: "Completed",
    startDate: "Apr 10, 2026",
    deadline: "Apr 28, 2026",
    assignedBy: "Priya BA",
    documents: [
      { name: "QAChecklist.md", url: "/docs/qa-checklist.md", type: "md" },
    ],
    lastInteractionAt: now,
  },
  {
    id: "T-106",
    project: "PM Toolkit",
    milestone: "Docs V2",
    task: "Update handoff notes template",
    status: "Not Started",
    startDate: "Apr 25, 2026",
    deadline: "May 06, 2026",
    assignedBy: "Karan BA",
    documents: [],
    lastInteractionAt: now,
  },
];

export const AUTO_STOP_AFTER_MS = 5 * 60 * 1000;
export const EMPLOYEE_TASKS_STORAGE_KEY = "employee-managed-tasks";

export const allowedTransitions: Record<
  ManagedTaskStatus,
  ManagedTaskStatus[]
> = {
  "Not Started": ["In Progress"],
  Pending: ["In Progress", "Paused", "Completed"],
  "In Progress": ["Paused", "Completed", "Auto-stopped"],
  Paused: ["In Progress", "Completed"],
  Completed: [],
  "Auto-stopped": [],
};

export const statusClassMap: Record<ManagedTaskStatus, string> = {
  "Not Started": "bg-gray-100 text-gray-600",
  "In Progress": "bg-blue-100 text-blue-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Paused: "bg-violet-100 text-violet-700",
  Completed: "bg-green-100 text-green-700",
  "Auto-stopped": "bg-orange-100 text-orange-700",
};

export function isTransitionAllowed(
  from: ManagedTaskStatus,
  to: ManagedTaskStatus,
) {
  return allowedTransitions[from].includes(to);
}

export function transitionTaskStatus<T extends EmployeeManagedTask>(
  tasks: T[],
  taskId: string,
  nextStatus: ManagedTaskStatus,
  nowMs = Date.now(),
) {
  let didTransition = false;
  const nextTasks = tasks.map((task) => {
    if (task.id !== taskId || !isTransitionAllowed(task.status, nextStatus)) {
      return task;
    }
    didTransition = true;
    return { ...task, status: nextStatus, lastInteractionAt: nowMs };
  });

  return { nextTasks, didTransition };
}

export function applyAutoStop<T extends EmployeeManagedTask>(
  tasks: T[],
  nowMs = Date.now(),
) {
  const autoStoppedIds: string[] = [];

  const nextTasks = tasks.map((task) => {
    if (
      task.status === "In Progress" &&
      nowMs - task.lastInteractionAt >= AUTO_STOP_AFTER_MS &&
      isTransitionAllowed(task.status, "Auto-stopped")
    ) {
      autoStoppedIds.push(task.id);
      return { ...task, status: "Auto-stopped", lastInteractionAt: nowMs };
    }
    return task;
  });

  return { nextTasks, autoStoppedIds };
}

export function loadEmployeeTasks() {
  if (typeof window === "undefined") {
    return seedEmployeeTasks;
  }

  const raw = window.localStorage.getItem(EMPLOYEE_TASKS_STORAGE_KEY);
  if (!raw) {
    return seedEmployeeTasks;
  }

  try {
    const parsed = JSON.parse(raw) as PersistedEmployeeTask[];
    const normalized = Array.isArray(parsed)
      ? parsed.map((task) => {
          const normalizedStatus: ManagedTaskStatus =
            task.status === "Stopped"
              ? "Completed"
              : task.status === "Auto Stopped"
                ? "Auto-stopped"
                : task.status;
          return { ...task, status: normalizedStatus };
        })
      : [];

    return normalized.length > 0 ? normalized : seedEmployeeTasks;
  } catch {
    return seedEmployeeTasks;
  }
}

export function saveEmployeeTasks(tasks: EmployeeManagedTask[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(
    EMPLOYEE_TASKS_STORAGE_KEY,
    JSON.stringify(tasks),
  );
}
