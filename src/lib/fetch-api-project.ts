import type { ApiProject } from "@/lib/admin-mappers";
import {
  apiFetch,
  fetchWithAuth,
  messageFromUnknownBody,
} from "@/lib/api-client";

/** Single project GET — shared by detail modal, files modal, edit form. */
export async function fetchApiProject(id: number): Promise<ApiProject> {
  try {
    const res = await apiFetch<ApiProject>(`/api/v1/projects/${id}/`, {
      method: "GET",
    });
    if (res.success && res.data) return res.data;
    throw new Error(res.message || "Failed to load project");
  } catch (e) {
    if (
      e instanceof Error &&
      e.message.includes("Unexpected API response shape")
    ) {
      const rawRes = await fetchWithAuth(`/api/v1/projects/${id}/`, {
        method: "GET",
      });
      const rawBody = (await rawRes.json()) as unknown;
      if (!rawRes.ok) {
        throw new Error(messageFromUnknownBody(rawBody));
      }
      return rawBody as ApiProject;
    }
    throw e;
  }
}
