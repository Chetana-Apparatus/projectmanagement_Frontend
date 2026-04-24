import type { LucideIcon } from "lucide-react";
import Card from "@/components/common/card/Card";

export type DashboardCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
};

export default function DashboardCard({
  title,
  value,
  icon: Icon,
  description,
}: DashboardCardProps) {
  return (
    <Card variant="surface" padding="md" height="sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="ui-overline whitespace-nowrap">{title}</p>
          <p className="ui-metric-value">{value}</p>
          {description ? <p className="ui-caption">{description}</p> : null}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-600 ring-1 ring-gray-100">
          <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </div>
      </div>
    </Card>
  );
}
