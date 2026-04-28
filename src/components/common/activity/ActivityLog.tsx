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

export default function ActivityLog({ items, title }: ActivityLogProps) {
  const actionBadge = (label: string) => {
    const normalized = label.toUpperCase();
    const style =
      normalized === "COMPLETED"
        ? "bg-emerald-100 text-emerald-700"
        : normalized === "STARTED"
          ? "bg-blue-100 text-blue-700"
          : normalized === "PAUSED"
            ? "bg-amber-100 text-amber-700"
            : "bg-slate-100 text-slate-700";
    return (
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${style}`}
      >
        {label}
      </span>
    );
  };

  return (
    <Card
      variant="surface"
      padding="lg"
      className="!items-stretch !justify-start text-left"
    >
      {title ? (
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-600 ring-1 ring-gray-100">
            <Activity className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <h2 className="ui-card-title">{title}</h2>
        </div>
      ) : null}

      {!items.length ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/60 px-4 py-8 text-center text-sm text-gray-500">
          No recent activity yet.
        </div>
      ) : (
        <div className="w-full">
          <ul className="w-full space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="w-full rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                    {actionBadge(item.label)}
                  </div>
                  <time className="shrink-0 text-[11px] font-medium tabular-nums text-gray-500">
                    {item.time}
                  </time>
                </div>

                {item.detail ? (
                  <p className="mt-2 text-sm leading-5 text-gray-700">
                    {item.detail}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
