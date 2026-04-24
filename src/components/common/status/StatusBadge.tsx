export type ProjectStatusVariant =
  | "onTrack"
  | "delayed"
  | "active"
  | "deactivated";

const variantStyles: Record<ProjectStatusVariant, string> = {
  onTrack: "bg-emerald-50 text-emerald-700 ring-emerald-200/80",
  delayed: "bg-rose-50 text-rose-700 ring-rose-200/80",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200/80",
  deactivated: "bg-gray-100 text-gray-700 ring-gray-200/80",
};

export type StatusBadgeProps = {
  children: React.ReactNode;
  variant: ProjectStatusVariant;
};

export default function StatusBadge({ children, variant }: StatusBadgeProps) {
  return (
    <span
      className={`ui-badge inline-flex items-center rounded-full px-2.5 py-1 ring-1 ring-inset ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
