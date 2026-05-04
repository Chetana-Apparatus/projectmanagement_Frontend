"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";
import GlobalLoader from "@/components/common/loader/GlobalLoader";
import { ToastProvider } from "@/components/common/toast/ToastProvider";
import { LoaderProvider } from "@/context/LoaderContext";

export default function ClientWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <LoaderProvider>
        <ToastProvider>
          {children}
          <GlobalLoader />
        </ToastProvider>
      </LoaderProvider>
    </QueryClientProvider>
  );
}
