"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { type AppToastType, showToast } from "@/utils/toast";

type ToastContextValue = {
  showToast: (message: string, type?: AppToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const notify = useCallback(
    (message: string, type: AppToastType = "success") => {
      showToast(message, type);
    },
    [],
  );

  const value = useMemo<ToastContextValue>(
    () => ({ showToast: notify }),
    [notify],
  );

  useEffect(() => {
    const onMailTriggered = (ev: Event) => {
      const custom = ev as CustomEvent<{ message?: string }>;
      const msg = custom.detail?.message?.trim() || "Mail sent successfully";
      showToast(msg, "success");
    };
    window.addEventListener("pms:mail-triggered", onMailTriggered);
    return () =>
      window.removeEventListener("pms:mail-triggered", onMailTriggered);
  }, []);

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
