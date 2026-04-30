"use client";

export type DocumentType = "docx" | "md";

export type ManagedTaskStatus =
  | "Not Started"
  | "In Progress"
  | "Paused"
  | "Stopped"
  | "Completed"
  | "Delayed"
  | "Blocked";

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

export const allowedTransitions: Record<
  ManagedTaskStatus,
  ManagedTaskStatus[]
> = {
  "Not Started": ["In Progress"],
  "In Progress": ["Paused", "Stopped"],
  Paused: ["In Progress", "Stopped", "Completed"],
  Stopped: ["In Progress", "Completed"],
  Delayed: ["In Progress", "Paused", "Stopped", "Completed"],
  Blocked: [],
  Completed: [],
};

export const statusClassMap: Record<ManagedTaskStatus, string> = {
  "Not Started": "bg-gray-100 text-gray-600",
  "In Progress": "bg-blue-100 text-blue-700",
  Paused: "bg-violet-100 text-violet-700",
  Stopped: "bg-slate-200 text-slate-700",
  Completed: "bg-green-100 text-green-700",
  Delayed: "bg-rose-100 text-rose-700",
  Blocked: "bg-zinc-200 text-zinc-800",
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

export function mapApiTaskStatusToManaged(status: string): ManagedTaskStatus {
  switch (status) {
    case "NOT_STARTED":
      return "Not Started";
    case "IN_PROGRESS":
      return "In Progress";
    case "PAUSED":
      return "Paused";
    case "STOPPED":
      return "Stopped";
    case "COMPLETED":
      return "Completed";
    case "DELAYED":
      return "Delayed";
    case "BLOCKED":
      return "Blocked";
    default:
      return "Not Started";
  }
}

export function toDocumentType(fileName: string): DocumentType {
  return /\.md($|\?)/i.test(fileName) ? "md" : "docx";
}

export function fileNameFromPath(path: string): string {
  const normalized = path.split("?")[0];
  const parts = normalized.split("/");
  return parts[parts.length - 1] || "Document";
}
