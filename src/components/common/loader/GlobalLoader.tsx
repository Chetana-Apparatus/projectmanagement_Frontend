"use client";

import { useLoader } from "@/context/LoaderContext";

export default function GlobalLoader() {
  const { loading } = useLoader();

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/35 backdrop-blur-[1px]">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/40 border-t-white" />
    </div>
  );
}
