"use client";

import { AlertCircle, CheckCircle2, TriangleAlert, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning";

export type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastProps = {
  toast: ToastItem;
  onClose: (id: string) => void;
};

const toastStyles: Record<
  ToastType,
  { container: string; icon: React.ReactNode }
> = {
  success: {
    container: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />,
  },
  error: {
    container: "border-red-200 bg-red-50 text-red-800",
    icon: <AlertCircle className="h-5 w-5 text-red-600" aria-hidden />,
  },
  warning: {
    container: "border-amber-200 bg-amber-50 text-amber-900",
    icon: <TriangleAlert className="h-5 w-5 text-amber-600" aria-hidden />,
  },
};

export default function Toast({ toast, onClose }: ToastProps) {
  const style = toastStyles[toast.type];

  return (
    <output
      className={cn(
        "pointer-events-auto flex w-full max-w-sm flex-nowrap items-center gap-3 rounded-xl border p-4 shadow-lg",
        "animate-in slide-in-from-top-5 fade-in-50 duration-300",
        style.container,
      )}
      aria-live="polite"
    >
      <div className="shrink-0">{style.icon}</div>
      <p className="ui-body min-w-0 flex-1 truncate whitespace-nowrap">
        {toast.message}
      </p>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 rounded-lg text-current/70 hover:bg-black/5 hover:text-current"
        onClick={() => onClose(toast.id)}
        aria-label="Close notification"
      >
        <X size={14} />
      </Button>
    </output>
  );
}
