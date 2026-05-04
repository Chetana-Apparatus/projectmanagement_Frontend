import { statusBadgeLayoutClass } from "@/features/employee-tasks/status";

export type ProjectStatusVariant =
  | "onTrack"
  | "delayed"
  | "active"
  | "deactivated"
  /** Task / work status (aligned with `statusClassMap` in employee-tasks). */
  | "taskInProgress"
  | "taskPaused"
  | "taskStopped"
  | "taskCompleted";

const variantStyles: Record<ProjectStatusVariant, string> = {
  onTrack: "bg-emerald-50 text-emerald-700 ring-emerald-200/80",
  delayed: "bg-rose-50 text-rose-700 ring-rose-200/80",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200/80",
  deactivated: "bg-gray-100 text-gray-700 ring-gray-200/80",
  taskInProgress: "bg-blue-100 text-blue-700 ring-blue-200/80",
  taskPaused: "bg-yellow-100 text-yellow-700 ring-yellow-200/80",
  taskStopped: "bg-red-100 text-red-700 ring-red-200/80",
  taskCompleted: "bg-green-100 text-green-700 ring-green-200/80",
};

export type StatusBadgeProps = {
  children: React.ReactNode;
  variant: ProjectStatusVariant;
};

export default function StatusBadge({ children, variant }: StatusBadgeProps) {
  return (
    <span
      className={`ui-badge ring-1 ring-inset ${statusBadgeLayoutClass} ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
