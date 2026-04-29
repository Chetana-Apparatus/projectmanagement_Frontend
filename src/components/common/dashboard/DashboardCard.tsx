import type { LucideIcon } from "lucide-react";
import Card from "@/components/common/card/Card";

export type DashboardCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  valueClassName?: string;
};

export default function DashboardCard({
  title,
  value,
  icon: Icon,
  description,
  valueClassName = "text-blue-600",
}: DashboardCardProps) {
  return (
    <Card
      variant="surface"
      padding="md"
      height="sm"
      className="w-full !items-stretch !justify-start p-5 text-left"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-xs uppercase tracking-wide text-gray-500">
            {title}
          </p>
          <p className={`text-3xl font-bold leading-none ${valueClassName}`}>
            {value}
          </p>
          {description ? <p className="ui-caption">{description}</p> : null}
        </div>
        <div className="ml-auto flex items-center justify-center rounded-lg bg-gray-100 p-3 text-gray-600">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
      </div>
    </Card>
  );
}
