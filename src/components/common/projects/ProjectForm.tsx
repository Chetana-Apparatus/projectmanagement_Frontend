"use client";

import { Trash2, Upload, X } from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import Card from "@/components/common/card/Card";
import { useToast } from "@/components/common/toast/ToastProvider";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { getPublicApiOrigin } from "@/lib/api-base";
import {
  drfDelete,
  drfRequest,
  fetchAllPages,
  uploadProjectDocumentFiles,
} from "@/lib/pms-http";
import type { ProjectFileRow } from "@/lib/project-documents";

export type ProjectFormValues = {
  name: string;
  description: string;
  startDate: string;
  expectedDate: string;
  status: "Not Started" | "In Progress" | "Completed" | "Delayed";
  documents: File[];
  /** When editing, the current main project file URL (if any). */
  existingPrimaryUrl?: string | null;
};

type ProjectFileAttachment = {
  id: number;
  file: string;
  project: number | null;
};

type Props = {
  initialValues?: ProjectFormValues;
  /** When set (edit mode), documents can be listed, deleted, and uploaded via the files API. */
  projectId?: number | null;
  /**
   * Create: return the new project’s numeric `id` after saving so selected `.docx`/`.md` files
   * are uploaded as attachments. Edit: return nothing (or omit return).
   */
  onSubmit: (
    values: ProjectFormValues,
  ) => undefined | number | Promise<undefined | number>;
  onCancel: () => void;
  /** Called after a new project is saved and any initial documents are uploaded. */
  onSuccessfulCreate?: () => void | Promise<void>;
  statusEditable?: boolean;
  /** Server-side files when editing (primary + `/api/v1/files/`). */
  existingServerFiles?: ProjectFileRow[];
  onRemoveExistingServerFile?: (row: ProjectFileRow) => void | Promise<void>;
  removingExistingServerKey?: string | null;
};

const DOC_NAME_RE = /\.(docx|md)$/i;

function documentHref(documentPath: string): string {
  if (!documentPath) return "";
  if (/^https?:\/\//i.test(documentPath)) return documentPath;
  return `${getPublicApiOrigin() || "http://127.0.0.1:8000"}${documentPath}`;
}

function docDisplayName(path: string | null | undefined): string {
  if (!path) return "";
  const normalized = path.split("?")[0];
  const parts = normalized.split("/");
  return parts[parts.length - 1] || path;
}

export default function ProjectForm({
  initialValues,
  projectId = null,
  onSubmit,
  onCancel,
  onSuccessfulCreate,
  statusEditable = true,
  existingServerFiles,
  onRemoveExistingServerFile,
  removingExistingServerKey,
}: Props) {
  const { showToast } = useToast();
  const [form, setForm] = useState<ProjectFormValues>({
    name: "",
    description: "",
    startDate: "",
    expectedDate: "",
    status: "Not Started",
    documents: [],
  });

  const [dragOver, setDragOver] = useState(false);
  const [documentError, setDocumentError] = useState("");
  const [dateError, setDateError] = useState("");
  const [attachments, setAttachments] = useState<ProjectFileAttachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [primaryPath, setPrimaryPath] = useState<string | null>(null);
  const [primaryRemoving, setPrimaryRemoving] = useState(false);
  const [attachmentDeletingId, setAttachmentDeletingId] = useState<
    number | null
  >(null);
  const [uploadBusy, setUploadBusy] = useState(false);

  const isEdit = projectId != null;
  const fieldClass = "flex flex-col gap-1.5";
  const labelClass = "text-sm font-medium text-cs-heading";

  const refreshAttachments = useCallback(async (pid: number) => {
    const rows = await fetchAllPages<ProjectFileAttachment>(
      `/api/v1/files/?project=${pid}`,
    );
    setAttachments(rows);
  }, []);

  useEffect(() => {
    if (!initialValues) {
      setForm({
        name: "",
        description: "",
        startDate: "",
        expectedDate: "",
        status: "Not Started",
        documents: [],
      });
      setPrimaryPath(null);
      setDateError("");
      return;
    }
    setForm(initialValues);
    setPrimaryPath(initialValues.existingPrimaryUrl ?? null);
    setDateError("");
  }, [initialValues]);

  useEffect(() => {
    if (!projectId) {
      setAttachments([]);
      return;
    }
    let cancelled = false;
    setAttachmentsLoading(true);
    void (async () => {
      try {
        await refreshAttachments(projectId);
      } catch {
        if (!cancelled) setAttachments([]);
      } finally {
        if (!cancelled) setAttachmentsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, refreshAttachments]);

  const isSupportedFile = (file: File) => DOC_NAME_RE.test(file.name);

  const updateDocuments = (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const next = Array.from(files);
    const bad = next.find((file) => !isSupportedFile(file));
    if (bad) {
      setDocumentError("Only .docx and .md files are allowed.");
      return;
    }
    setDocumentError("");
    setForm((prev) => {
      const merged = [...prev.documents];
      for (const f of next) {
        const dup = merged.some(
          (x) =>
            x.name === f.name &&
            x.size === f.size &&
            x.lastModified === f.lastModified,
        );
        if (!dup) merged.push(f);
      }
      return { ...prev, documents: merged };
    });
  };

  const removePendingDocument = (index: number) => {
    setForm((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  const clearPrimaryDocument = async () => {
    if (projectId == null || !primaryPath) return;
    setPrimaryRemoving(true);
    try {
      await drfRequest(`/api/v1/projects/${projectId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: null }),
      });
      setPrimaryPath(null);
      showToast("File removed.", "success");
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Could not remove main file.",
        "error",
      );
    } finally {
      setPrimaryRemoving(false);
    }
  };

  const deleteAttachment = async (attachmentId: number) => {
    if (!window.confirm("Remove this file from the project?")) return;
    setAttachmentDeletingId(attachmentId);
    try {
      await drfDelete(`/api/v1/files/${attachmentId}/`);
      if (projectId != null) await refreshAttachments(projectId);
      showToast("File removed.", "success");
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Could not delete file.",
        "error",
      );
    } finally {
      setAttachmentDeletingId(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (
      form.startDate &&
      form.expectedDate &&
      form.expectedDate < form.startDate
    ) {
      setDateError("Expected date cannot be before the start date.");
      return;
    }
    setDateError("");

    if (isEdit) {
      if (form.documents.length > 0) {
        setUploadBusy(true);
        const pendingCount = form.documents.length;
        const pending = [...form.documents];
        try {
          if (projectId != null) {
            await uploadProjectDocumentFiles(projectId, pending);
          }
          setForm((prev) => ({ ...prev, documents: [] }));
          if (projectId != null) await refreshAttachments(projectId);
          showToast(
            pendingCount === 1
              ? "New file added to project."
              : `${pendingCount} files added to project.`,
            "success",
          );
        } catch (err) {
          showToast(
            err instanceof Error ? err.message : "Upload failed.",
            "error",
          );
          setUploadBusy(false);
          return;
        }
        setUploadBusy(false);
      }
      await Promise.resolve(
        onSubmit({
          ...form,
          documents: [],
          existingPrimaryUrl: primaryPath,
        }),
      );
      return;
    }

    const pendingDocs = [...form.documents];
    if (pendingDocs.length > 0) {
      setUploadBusy(true);
    }
    try {
      const createdId = await Promise.resolve(
        onSubmit({
          ...form,
          documents: pendingDocs,
        }),
      );
      if (typeof createdId === "number") {
        if (pendingDocs.length > 0) {
          await uploadProjectDocumentFiles(createdId, pendingDocs);
          setForm((prev) => ({ ...prev, documents: [] }));
        }
        showToast(
          pendingDocs.length > 0
            ? `Project created with ${pendingDocs.length} document(s).`
            : "Project created.",
          "success",
        );
        await Promise.resolve(onSuccessfulCreate?.());
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Could not save project.",
        "error",
      );
    } finally {
      setUploadBusy(false);
    }
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateDocuments(e.target.files);
    e.target.value = "";
  };

  return (
    <Card
      padding="none"
      className="flex max-h-[calc(100vh-8rem)] w-full max-w-xl !flex-col !items-stretch !justify-start overflow-hidden rounded-lg border border-border/80 bg-white shadow-2xl"
    >
      <form
        onSubmit={(ev) => void handleSubmit(ev)}
        className="flex min-h-0 flex-1 flex-col"
      >
        {/* HEADER */}
        <div className="flex shrink-0 items-center border-b border-gray-100 px-6 py-4">
          <div className="w-9 shrink-0" aria-hidden />
          <h2 className="min-w-0 flex-1 text-center text-xl font-semibold">
            {initialValues ? "Edit Project" : "Add Project"}
          </h2>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={onCancel}
            aria-label="Close project form"
          >
            <X size={16} />
          </Button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6 pr-4">
          {/* PROJECT NAME */}
          <div className="space-y-1.5">
            <label htmlFor="project-name" className="text-sm font-medium">
              Project Name
            </label>
            <Input
              id="project-name"
              className="h-11 w-full rounded-lg px-3"
              placeholder="Enter project name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* DESCRIPTION */}
          <div className="space-y-1.5">
            <label
              htmlFor="project-description"
              className="text-sm font-medium"
            >
              Description
            </label>
            <Input
              id="project-description"
              className="h-11 w-full rounded-lg px-3"
              placeholder="Enter description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          {/* DATES */}
          <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6">
            <div className="space-y-1.5">
              <label
                htmlFor="project-start-date"
                className="text-sm font-medium"
              >
                Start Date
              </label>
              <Input
                id="project-start-date"
                type="date"
                className="h-11 w-full rounded-lg px-3"
                value={form.startDate}
                onChange={(e) => {
                  setDateError("");
                  setForm({ ...form, startDate: e.target.value });
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="project-end-date" className="text-sm font-medium">
                Expected Date
              </label>
              <Input
                id="project-end-date"
                type="date"
                className="h-11 w-full rounded-lg px-3"
                min={form.startDate || undefined}
                value={form.expectedDate}
                onChange={(e) => {
                  setDateError("");
                  setForm({ ...form, expectedDate: e.target.value });
                }}
              />
            </div>
          </div>
          {dateError ? (
            <p className="text-sm text-red-600">{dateError}</p>
          ) : null}

          <div className="space-y-1.5">
            <label htmlFor="project-status" className="text-sm font-medium">
              Status
            </label>
            <select
              id="project-status"
              className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cs-primary-100/30"
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as ProjectFormValues["status"],
                })
              }
              disabled={!statusEditable}
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>

          {/* FILES */}
          <div className={fieldClass}>
            <span className={labelClass}>Project documents</span>

            {existingServerFiles && existingServerFiles.length > 0 ? (
              <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2">
                <p className="mb-2 text-xs font-medium text-gray-600">
                  Current uploads ({existingServerFiles.length})
                </p>
                <ul className="max-h-36 space-y-1.5 overflow-y-auto pr-0.5">
                  {existingServerFiles.map((row) => (
                    <li
                      key={row.key}
                      className="flex items-center justify-between gap-2 rounded-md border border-white bg-white px-2 py-1.5 text-sm shadow-sm"
                    >
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-w-0 flex-1 truncate font-normal text-sky-600 underline decoration-sky-500 underline-offset-2 hover:text-sky-700"
                      >
                        {row.displayName}
                      </a>
                      {onRemoveExistingServerFile ? (
                        <button
                          type="button"
                          className="shrink-0 rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          disabled={removingExistingServerKey === row.key}
                          onClick={() => {
                            void onRemoveExistingServerFile(row);
                          }}
                          aria-label={`Delete ${row.displayName}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {isEdit ? (
              <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50/80 p-3">
                {attachmentsLoading ? (
                  <p className="text-xs text-gray-500">Loading files…</p>
                ) : null}
                {!attachmentsLoading &&
                !primaryPath &&
                attachments.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    No files yet. Use the area below to add some.
                  </p>
                ) : null}

                {primaryPath ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white bg-white px-3 py-2 text-sm">
                    <a
                      href={documentHref(primaryPath)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 flex-1 truncate font-medium text-sky-700 underline-offset-2 hover:underline"
                      title={docDisplayName(primaryPath)}
                    >
                      {docDisplayName(primaryPath)}
                    </a>
                    <button
                      type="button"
                      className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-50"
                      disabled={primaryRemoving}
                      onClick={() => {
                        void clearPrimaryDocument();
                      }}
                    >
                      {primaryRemoving ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                ) : null}

                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white bg-white px-3 py-2 text-sm"
                  >
                    <a
                      href={documentHref(att.file)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 flex-1 truncate font-medium text-sky-700 underline-offset-2 hover:underline"
                      title={docDisplayName(att.file)}
                    >
                      {docDisplayName(att.file)}
                    </a>
                    <button
                      type="button"
                      className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-50"
                      disabled={attachmentDeletingId === att.id}
                      onClick={() => {
                        void deleteAttachment(att.id);
                      }}
                    >
                      {attachmentDeletingId === att.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <fieldset
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                updateDocuments(e.dataTransfer.files);
              }}
              className={`rounded-lg border-2 border-dashed p-5 text-center transition ${
                dragOver
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 bg-gray-50"
              }`}
            >
              <Upload size={22} className="mx-auto mb-2 text-gray-500" />

              <p className="text-sm font-medium">
                Drag & drop .docx or .md files here
              </p>
              <p className="mb-3 text-xs text-gray-500">
                {isEdit
                  ? "Adds to this project when you save"
                  : "Attach after create — return new project id from Save"}
              </p>

              <label className="inline-block cursor-pointer rounded-md border px-3 py-1.5 text-sm hover:bg-gray-100">
                Browse files
                <input
                  type="file"
                  accept=".docx,.md,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown"
                  multiple
                  className="hidden"
                  onChange={onFileInputChange}
                />
              </label>

              {form.documents.length > 0 ? (
                <ul className="mt-3 space-y-1 text-left text-xs text-gray-700">
                  {form.documents.map((f, i) => (
                    <li
                      key={`${f.name}-${i}-${f.size}`}
                      className="flex items-center justify-between gap-2 rounded bg-white/80 px-2 py-1"
                    >
                      <span className="min-w-0 truncate">{f.name}</span>
                      <button
                        type="button"
                        className="shrink-0 text-rose-600 hover:underline"
                        onClick={() => removePendingDocument(i)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {documentError ? (
                <p className="mt-2 text-xs text-red-600">{documentError}</p>
              ) : null}
            </fieldset>
          </div>
        </div>

        {/* FIXED FOOTER */}
        <div className="flex shrink-0 justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={uploadBusy}>
            {uploadBusy ? "Uploading…" : "Save"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
