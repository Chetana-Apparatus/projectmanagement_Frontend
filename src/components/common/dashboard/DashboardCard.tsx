import type { LucideIcon } from "lucide-react";
import Card from "@/components/common/card/Card";
import { cn } from "@/lib/utils";

export type DashboardCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  valueClassName?: string;
  /** Icon stroke/fill color (e.g. text-blue-600). */
  iconClassName?: string;
  /** Icon tile background (e.g. bg-blue-100). */
  iconWrapperClassName?: string;
};

export default function DashboardCard({
  title,
  value,
  icon: Icon,
  description,
  valueClassName = "text-blue-600",
  iconClassName = "text-gray-600",
  iconWrapperClassName = "bg-gray-100",
}: DashboardCardProps) {
  return (
    <Card
      variant="surface"
      padding="md"
      height="sm"
      className="w-full !items-stretch !justify-start p-5 text-left"
    >
      <div className="flex w-full items-center justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate p1 uppercase tracking-wide text-gray-500">
            {title}
          </p>
          <p className={`text-3xl font-bold leading-none ${valueClassName}`}>
            {value}
          </p>
          {description ? <p className="ui-caption">{description}</p> : null}
        </div>
        <div
          className={cn(
            "shrink-0 self-start rounded-lg p-3",
            iconWrapperClassName,
          )}
        >
          <Icon className={cn("h-5 w-5", iconClassName)} strokeWidth={1.75} />
        </div>
      </div>
    </Card>
  );
}
