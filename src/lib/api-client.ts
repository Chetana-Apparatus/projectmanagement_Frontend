import { apiUrl } from "@/lib/api-base";
import {
  clearSession,
  getStoredAccess,
  getStoredRefresh,
  getStoredUser,
} from "@/lib/auth-storage";
import type { ApiEnvelope } from "@/types/api";

/** First human-readable message from Django/DRF or our `api_response` body. */
export function messageFromUnknownBody(body: unknown): string {
  if (!body || typeof body !== "object") return "Request failed.";
  const b = body as Record<string, unknown>;
  if (typeof b.message === "string" && b.message) return b.message;
  if (typeof b.detail === "string") return b.detail;
  if (Array.isArray(b.non_field_errors) && b.non_field_errors[0]) {
    return String(b.non_field_errors[0]);
  }
  for (const v of Object.values(b)) {
    if (Array.isArray(v) && v[0]) return String(v[0]);
  }
  return "Request failed.";
}

function inferMailMessage(body: Record<string, unknown>): string | null {
  const message = typeof body.message === "string" ? body.message : "";
  if (
    message &&
    /(mail|email|otp).*(sent|triggered)|sent.*(mail|email|otp)/i.test(message)
  ) {
    return "Mail sent successfully";
  }

  const data = body.data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (d.mail_triggered === true) return "Mail sent successfully";
  }
  return null;
}

export function maybeTriggerMailPopup(body: unknown): void {
  if (typeof window === "undefined" || !body || typeof body !== "object")
    return;
  const b = body as Record<string, unknown>;
  const popupMessage = inferMailMessage(b);
  if (!popupMessage) return;
  window.dispatchEvent(
    new CustomEvent("pms:mail-triggered", {
      detail: { message: popupMessage },
    }),
  );
}

let refreshInFlight: Promise<string | null> | null = null;

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const refresh = getStoredRefresh();
      if (!refresh || typeof window === "undefined") return null;

      let res: Response;
      try {
        res = await fetch(apiUrl("/api/v1/auth/refresh"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
          cache: "no-store",
        });
      } catch {
        clearSession();
        return null;
      }
      const body = (await parseJsonSafe(res)) as ApiEnvelope<{
        access?: string;
        refresh?: string;
      }>;
      const access =
        body?.success && body.data?.access ? body.data.access : null;
      if (!access) {
        clearSession();
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
        return null;
      }
      window.localStorage.setItem("pms_access_token", access);
      if (body.data?.refresh) {
        window.localStorage.setItem("pms_refresh_token", body.data.refresh);
      }
      return access;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export type ApiFetchOptions = RequestInit & {
  skipAuth?: boolean;
  retryOn401?: boolean;
};

export type AuthorizedFetchOptions = RequestInit & {
  skipAuth?: boolean;
  retryOn401?: boolean;
};

/**
 * Same as `fetch` + auth (+ optional 401 refresh). Use for multipart or non-envelope DRF endpoints.
 */
export async function fetchWithAuth(
  path: string,
  options: AuthorizedFetchOptions = {},
): Promise<Response> {
  const { skipAuth, retryOn401 = true, headers, ...rest } = options;
  const h = new Headers(headers);

  const isForm = rest.body instanceof FormData;
  if (!isForm && rest.body !== undefined && !h.has("Content-Type")) {
    h.set("Content-Type", "application/json");
  }

  if (!skipAuth) {
    const token = getStoredAccess();
    if (token) h.set("Authorization", `Bearer ${token}`);
  }

  const doFetch = async () => {
    try {
      return await fetch(apiUrl(path), {
        ...rest,
        headers: h,
        cache: "no-store",
      });
    } catch (e) {
      const msg =
        e instanceof TypeError && e.message === "Failed to fetch"
          ? "Cannot reach the API. Start the Django server, or use same-origin /api routes (see next.config rewrites)."
          : e instanceof Error
            ? e.message
            : "Network error";
      throw new Error(msg);
    }
  };

  let res = await doFetch();

  if (res.status === 401 && !skipAuth && retryOn401) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      h.set("Authorization", `Bearer ${newAccess}`);
      res = await doFetch();
    } else if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
  }

  return res;
}

/**
 * Calls the Django API (`api_response` wrapper). Attaches Bearer token unless `skipAuth`.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<ApiEnvelope<T>> {
  const res = await fetchWithAuth(path, options);

  const body = (await parseJsonSafe(res)) as ApiEnvelope<T>;
  maybeTriggerMailPopup(body);

  if (typeof body !== "object" || body === null || !("success" in body)) {
    throw new Error(
      res.ok
        ? "Unexpected API response shape"
        : `Request failed (${res.status})`,
    );
  }

  return body;
}

export async function postJson<T>(
  path: string,
  data: unknown,
  opts: ApiFetchOptions = {},
): Promise<ApiEnvelope<T>> {
  return apiFetch<T>(path, {
    ...opts,
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function routeForRole(role: string | null | undefined): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "BA":
      return "/business-analyst";
    case "EMPLOYEE":
      return "/employee";
    default:
      return "/auth/login";
  }
}

export { getStoredUser };
