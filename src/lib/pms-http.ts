/**
 * Helpers for Django/DRF ViewSets: some actions return `{ success, message, data }`,
 * others return raw serializer JSON. List endpoints use paginated envelopes with `meta`.
 */

import {
  type AuthorizedFetchOptions,
  fetchWithAuth,
  maybeTriggerMailPopup,
  messageFromUnknownBody,
} from "@/lib/api-client";

export async function readDrfJson<T>(res: Response): Promise<T> {
  if (res.status === 204 || res.status === 205) {
    return undefined as T;
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      throw new Error(`Invalid JSON (HTTP ${res.status})`);
    }
  }

  if (!res.ok) {
    throw new Error(messageFromUnknownBody(data));
  }

  maybeTriggerMailPopup(data);

  if (data !== null && typeof data === "object" && "success" in data) {
    const e = data as {
      success: boolean;
      message?: string;
      data?: unknown;
    };
    if (!e.success) {
      throw new Error(e.message || "Request failed");
    }
    if ("data" in e && e.data !== undefined) {
      return e.data as T;
    }
  }

  return data as T;
}

/** Paginated list envelope from `StandardResultsSetPagination`. */
export type PaginatedListWrapper<T> = {
  results: T[];
};

type MetaPages = {
  meta?: {
    total_pages?: number;
    page?: number;
    page_size?: number;
  };
};

export async function fetchPaginatedPage<T>(
  pathWithQuery: string,
): Promise<{ results: T[]; totalPages: number }> {
  const res = await fetchWithAuth(pathWithQuery, { method: "GET" });
  const text = await res.text();
  let outer: unknown = null;
  if (text) {
    try {
      outer = JSON.parse(text) as unknown;
    } catch {
      throw new Error(`Invalid JSON (HTTP ${res.status})`);
    }
  }

  if (!res.ok) {
    throw new Error(messageFromUnknownBody(outer));
  }

  if (
    outer &&
    typeof outer === "object" &&
    "success" in outer &&
    (outer as { success?: boolean }).success &&
    "data" in outer
  ) {
    const data = (outer as { data: PaginatedListWrapper<T> }).data;
    const meta = (outer as MetaPages).meta;
    const totalPages = meta?.total_pages ?? 1;
    return { results: data?.results ?? [], totalPages };
  }

  throw new Error("Unexpected list response");
}

export async function fetchAllPages<T>(basePath: string): Promise<T[]> {
  const out: T[] = [];
  let page = 1;
  const pageSize = 100;
  for (;;) {
    const sep = basePath.includes("?") ? "&" : "?";
    const { results, totalPages } = await fetchPaginatedPage<T>(
      `${basePath}${sep}page=${page}&page_size=${pageSize}`,
    );
    out.push(...results);
    if (page >= totalPages || results.length === 0) break;
    page += 1;
  }
  return out;
}

export async function drfRequest<T>(
  path: string,
  options: AuthorizedFetchOptions = {},
): Promise<T> {
  const res = await fetchWithAuth(path, options);
  return readDrfJson<T>(res);
}

/** Multipart POST (create); response may be raw project/milestone/task object. */
export async function drfFormDataPost<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  const res = await fetchWithAuth(path, {
    method: "POST",
    body: formData,
  });
  return readDrfJson<T>(res);
}

/** POST each file to `POST /api/v1/files/` with `project` id (.docx / .md only enforced by API). */
export async function uploadProjectDocumentFiles(
  projectId: number,
  files: File[],
): Promise<void> {
  for (const file of files) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("project", String(projectId));
    await drfFormDataPost<unknown>("/api/v1/files/", fd);
  }
}

export async function drfFormDataPatch<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  const res = await fetchWithAuth(path, {
    method: "PATCH",
    body: formData,
  });
  return readDrfJson<T>(res);
}

export async function drfDelete(path: string): Promise<void> {
  const res = await fetchWithAuth(path, { method: "DELETE" });
  await readDrfJson<unknown>(res);
}
