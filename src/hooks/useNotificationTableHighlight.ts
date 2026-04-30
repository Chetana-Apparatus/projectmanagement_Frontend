"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { NOTIF_FOCUS_PARAM } from "@/lib/url-deep-link";

/**
 * Highlights and scrolls to a table row when URL has `nf=1` and the given id param (from notifications).
 * Uses `useSearchParams` so client-side navigations that only change the query string still re-run logic.
 */
export function useNotificationTableHighlight(
  loading: boolean,
  idParam: "taskId" | "projectId" | "milestoneId",
  dataRevision: unknown,
) {
  const searchParams = useSearchParams();
  const id = searchParams.get(idParam);
  const nf = searchParams.get(NOTIF_FOCUS_PARAM);

  const [highlightRowId, setHighlightRowId] = useState<string | null>(null);

  useEffect(() => {
    void dataRevision;
    if (loading) return;
    if (id && nf === "1") {
      setHighlightRowId(id);
      const timer = window.setTimeout(() => setHighlightRowId(null), 14_000);
      return () => window.clearTimeout(timer);
    }
    setHighlightRowId(null);
  }, [loading, id, nf, dataRevision]);

  useEffect(() => {
    if (!highlightRowId) return;
    const raf = requestAnimationFrame(() => {
      document
        .querySelector(`tr[data-row-key="${highlightRowId}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => cancelAnimationFrame(raf);
  }, [highlightRowId]);

  return highlightRowId;
}
