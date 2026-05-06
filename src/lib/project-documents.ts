import type { ApiProject, ApiProjectFile } from "@/lib/admin-mappers";
import { fileNameFromPath } from "@/lib/admin-mappers";
import { getPublicApiOrigin } from "@/lib/api-base";

export type ProjectFileRow = {
  key: string;
  url: string;
  displayName: string;
  source: "attachment" | "primary";
  attachmentId?: number;
};

export function absoluteProjectFileUrl(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `${getPublicApiOrigin() || "http://127.0.0.1:8000"}${trimmed}`;
}

function normalizeDocKey(url: string): string {
  return url.split("?")[0].toLowerCase();
}

/** Primary project document plus `/api/v1/files/` rows, deduped by URL. */
export function mergeProjectDocuments(
  project: Pick<ApiProject, "document"> | null,
  attachments: ApiProjectFile[],
): ProjectFileRow[] {
  const byKey = new Map<string, ProjectFileRow>();

  for (const a of attachments) {
    if (!a.file?.trim()) continue;
    const url = absoluteProjectFileUrl(a.file);
    const key = normalizeDocKey(url);
    byKey.set(key, {
      key,
      url,
      displayName: fileNameFromPath(a.file) || "File",
      source: "attachment",
      attachmentId: a.id,
    });
  }

  if (project?.document?.trim()) {
    const path = project.document.trim();
    const url = absoluteProjectFileUrl(path);
    const key = normalizeDocKey(url);
    if (!byKey.has(key)) {
      byKey.set(key, {
        key,
        url,
        displayName: fileNameFromPath(path) || "Document",
        source: "primary",
      });
    }
  }

  return [...byKey.values()];
}
