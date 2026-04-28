"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Toast, {
  type ToastItem,
  type ToastType,
} from "@/components/common/toast/Toast";

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);
const AUTO_DISMISS_MS = 3000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mailPopup, setMailPopup] = useState<string | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, AUTO_DISMISS_MS);
    },
    [],
  );

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  useEffect(() => {
    const onMailTriggered = (ev: Event) => {
      const custom = ev as CustomEvent<{ message?: string }>;
      const msg = custom.detail?.message?.trim() || "Mail sent successfully";
      setMailPopup(msg);
      window.setTimeout(() => setMailPopup(null), AUTO_DISMISS_MS);
    };
    window.addEventListener("pms:mail-triggered", onMailTriggered);
    return () =>
      window.removeEventListener("pms:mail-triggered", onMailTriggered);
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {!mailPopup ? (
        <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onClose={removeToast} />
          ))}
        </div>
      ) : null}
      {mailPopup ? (
        <div className="pointer-events-none fixed inset-0 z-[120] flex items-center justify-center">
          <div className="rounded-xl border border-emerald-100 bg-white/95 px-6 py-4 text-sm font-medium text-emerald-700 shadow-xl backdrop-blur">
            {mailPopup}
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
