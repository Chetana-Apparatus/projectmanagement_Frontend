import { Activity } from "lucide-react";
import Card from "@/components/common/card/Card";

export type ActivityLogItem = {
  id: string;
  label: string;
  detail?: string;
  time: string;
};

export type ActivityLogProps = {
  items: ActivityLogItem[];
  title?: string;
};

export default function ActivityLog({
  items,
  title = "Activity",
}: ActivityLogProps) {
  return (
    <Card
      variant="surface"
      padding="lg"
      className="!items-stretch !justify-start text-left"
    >
      {/* HEADER */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-600 ring-1 ring-gray-100">
          <Activity className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <h2 className="ui-card-title">{title}</h2>
      </div>

      {/* LIST */}
      <ul className="divide-y divide-gray-100">
        {items.map((item) => (
          <li key={item.id} className="py-3 first:pt-0 last:pb-0">
            {/* TOP ROW */}
            <div className="flex items-start justify-between gap-2">
              <p className="ui-body font-medium text-left text-[var(--cs-heading)]">
                {item.label}
              </p>

              <time className="ui-caption tabular-nums opacity-70 whitespace-nowrap">
                {item.time}
              </time>
            </div>

            {/* DETAIL */}
            {item.detail && (
              <p className="ui-caption text-left mt-1">{item.detail}</p>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
