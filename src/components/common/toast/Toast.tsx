"use client";

import { AlertCircle, CheckCircle2, TriangleAlert, X } from "lucide-react";
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
        "pointer-events-auto flex w-full max-w-sm flex-nowrap items-center justify-between gap-3 overflow-hidden rounded-xl border px-4 py-3 shadow-lg",
        "animate-in slide-in-from-top-5 fade-in-50 duration-300",
        style.container,
      )}
      aria-live="polite"
    >
      <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-2 overflow-hidden">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center">
          {style.icon}
        </div>
        <p className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm leading-5">
          {toast.message}
        </p>
      </div>
      <button
        type="button"
        className="inline-flex h-7 w-7 shrink-0 flex-none items-center justify-center self-center rounded-lg text-current/70 leading-none transition-colors hover:bg-black/5 hover:text-current"
        onClick={() => onClose(toast.id)}
        aria-label="Close notification"
      >
        <X size={14} />
      </button>
    </output>
  );
}
