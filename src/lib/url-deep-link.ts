/** Read / clear `?taskId=` / `?projectId=` / `?milestoneId=` without Next.js searchParams (avoids Suspense). */

export const NOTIF_FOCUS_PARAM = "nf";

export function getDeepLinkParam(key: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(key);
}

export function stripDeepLinkParams(keys: string[]) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  let changed = false;
  for (const key of keys) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (!changed) return;
  const q = url.searchParams.toString();
  window.history.replaceState(
    null,
    "",
    q ? `${url.pathname}?${q}` : url.pathname,
  );
}
