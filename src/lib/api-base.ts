/**
 * When `NEXT_PUBLIC_API_BASE_URL` points at a local dev server (127.0.0.1 / localhost),
 * the browser should call same-origin `/api/...` so Next.js can rewrite to Django.
 * Cross-origin `localhost:3000` → `127.0.0.1:8000` often fails CORS or shows "Failed to fetch".
 */
function isLocalDevApiOrigin(origin: string): boolean {
  try {
    const withProto = origin.includes("://") ? origin : `http://${origin}`;
    const u = new URL(withProto);
    return (
      u.hostname === "localhost" ||
      u.hostname === "127.0.0.1" ||
      u.hostname === "[::1]"
    );
  } catch {
    return false;
  }
}

export function getPublicApiOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_base_url?.trim() ||
    "";
  return raw.replace(/\/+$/, "");
}

/**
 * API path (always starting with `/api/v1/...`). Uses same-origin relative URLs in the
 * browser when the configured API is local, so `next.config` rewrites apply.
 */
export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const origin = getPublicApiOrigin();

  if (typeof window !== "undefined") {
    if (!origin || isLocalDevApiOrigin(origin)) {
      return p;
    }
    return `${origin}${p}`;
  }

  if (origin) {
    return `${origin}${p}`;
  }
  return p;
}
