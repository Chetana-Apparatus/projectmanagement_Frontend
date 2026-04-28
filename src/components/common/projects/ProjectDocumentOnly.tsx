"use client";

import { renderAsync } from "docx-preview";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import type { ApiProject } from "@/lib/admin-mappers";
import { getPublicApiOrigin } from "@/lib/api-base";
import {
  apiFetch,
  fetchWithAuth,
  messageFromUnknownBody,
} from "@/lib/api-client";

type ProjectDocumentOnlyProps = {
  projectId: string;
};

export default function ProjectDocumentOnly({
  projectId,
}: ProjectDocumentOnlyProps) {
  const router = useRouter();
  const [project, setProject] = useState<ApiProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [markdownContent, setMarkdownContent] = useState("");
  const docxContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoadError(null);
      setLoading(true);
      try {
        const res = await apiFetch<ApiProject>(
          `/api/v1/projects/${projectId}/`,
          {
            method: "GET",
          },
        );
        if (!res.success || !res.data) {
          throw new Error(res.message || "Failed to load project");
        }
        setProject(res.data);
      } catch (e) {
        // Some DRF detail endpoints return raw serializer JSON instead of api_response envelope.
        if (
          e instanceof Error &&
          e.message.includes("Unexpected API response shape")
        ) {
          try {
            const rawRes = await fetchWithAuth(
              `/api/v1/projects/${projectId}/`,
              {
                method: "GET",
              },
            );
            const rawBody = (await rawRes.json()) as unknown;
            if (!rawRes.ok) {
              setLoadError(messageFromUnknownBody(rawBody));
              return;
            }
            setProject(rawBody as ApiProject);
            return;
          } catch (fallbackErr) {
            setLoadError(
              fallbackErr instanceof Error
                ? fallbackErr.message
                : "Failed to load project",
            );
            return;
          }
        }
        setLoadError(e instanceof Error ? e.message : "Failed to load project");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [projectId]);

  const documentPath = project?.document ?? "";
  const absolutePreviewUrl = useMemo(() => {
    if (!documentPath) return "";
    if (/^https?:\/\//i.test(documentPath)) return documentPath;
    return `${getPublicApiOrigin() || "http://127.0.0.1:8000"}${documentPath}`;
  }, [documentPath]);

  const isDocx = /\.docx($|\?)/i.test(documentPath);
  const isMarkdown = /\.md($|\?)/i.test(documentPath);

  useEffect(() => {
    if (!isDocx || !absolutePreviewUrl || !docxContainerRef.current) return;
    const container = docxContainerRef.current;
    container.innerHTML = "";
    setPreviewError("");
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(absolutePreviewUrl);
        if (!res.ok) throw new Error(`Unable to fetch DOCX (${res.status})`);
        const buffer = await res.arrayBuffer();
        if (cancelled) return;
        await renderAsync(buffer, container);
      } catch {
        setPreviewError("Unable to preview this DOCX file.");
      }
    })();
    return () => {
      cancelled = true;
      container.innerHTML = "";
    };
  }, [isDocx, absolutePreviewUrl]);

  useEffect(() => {
    if (!isMarkdown || !absolutePreviewUrl) {
      setMarkdownContent("");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(absolutePreviewUrl);
        if (!res.ok)
          throw new Error(`Unable to fetch markdown (${res.status})`);
        const text = await res.text();
        if (!cancelled) setMarkdownContent(text);
      } catch {
        if (!cancelled) setMarkdownContent("Unable to load markdown preview.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isMarkdown, absolutePreviewUrl]);

  return (
    <div className="space-y-4 p-6">
      <div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back
        </Button>
      </div>
      <h1 className="ui-page-title">Project Document</h1>
      {loading ? <p className="text-sm text-gray-500">Loading…</p> : null}
      {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}

      {!loading && !loadError && !documentPath ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
          No document uploaded for this project.
        </div>
      ) : null}

      {!loading && !loadError && documentPath ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          {isDocx ? (
            previewError ? (
              <p className="text-sm text-red-600">{previewError}</p>
            ) : (
              <div
                ref={docxContainerRef}
                className="docx-preview-container mx-auto max-h-[75vh] overflow-auto"
              />
            )
          ) : null}

          {isMarkdown ? (
            <pre className="max-h-[75vh] whitespace-pre-wrap break-words overflow-auto text-sm text-gray-800">
              {markdownContent}
            </pre>
          ) : null}

          {!isDocx && !isMarkdown ? (
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-600">
                Preview is not available for this file type.
              </p>
              <a href={absolutePreviewUrl} target="_blank" rel="noreferrer">
                <Button type="button">Open Document</Button>
              </a>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
