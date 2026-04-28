"use client";

import { Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import ProjectForm, {
  type ProjectFormValues,
} from "@/components/common/projects/ProjectForm";
import ProjectTable, {
  type Project,
} from "@/components/common/projects/ProjectTable";
import { useToast } from "@/components/common/toast/ToastProvider";
import Button from "@/components/ui/Button";
import { type ApiProject, apiProjectToRow } from "@/lib/admin-mappers";
import { apiFetch } from "@/lib/api-client";
import {
  drfFormDataPatch,
  drfFormDataPost,
  fetchAllPages,
} from "@/lib/pms-http";

function buildProjectFormData(values: ProjectFormValues): FormData {
  const fd = new FormData();
  fd.append("name", values.name.trim());
  fd.append("description", values.description ?? "");
  fd.append("start_date", values.startDate);
  fd.append("deadline", values.endDate);
  if (values.document) fd.append("document", values.document);
  return fd;
}

export default function BAProjectsPage() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [editingOriginalEndDate, setEditingOriginalEndDate] =
    useState<string>("");
  const [pendingDeadlineRequest, setPendingDeadlineRequest] = useState<{
    projectId: string;
    values: ProjectFormValues;
    requestedDeadline: string;
  } | null>(null);
  const [deadlineReason, setDeadlineReason] = useState("");
  const [submittingDeadlineRequest, setSubmittingDeadlineRequest] =
    useState(false);

  const loadProjects = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const rows = await fetchAllPages<ApiProject>("/api/v1/projects/");
      setProjects(rows.map(apiProjectToRow));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    const isModalOpen = open || Boolean(pendingDeadlineRequest);
    if (!isModalOpen) return undefined;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open, pendingDeadlineRequest]);

  const closeForm = () => {
    setOpen(false);
    setEditing(null);
    setEditingOriginalEndDate("");
  };

  const submitDeadlineRequest = async () => {
    if (!pendingDeadlineRequest) return;
    setSubmittingDeadlineRequest(true);
    try {
      const { projectId, values, requestedDeadline } = pendingDeadlineRequest;
      const reason =
        deadlineReason.trim() || "Deadline adjustment requested by BA";
      const req = await apiFetch<{ project_id: number }>(
        `/api/v1/projects/${projectId}/request-deadline-change/`,
        {
          method: "POST",
          body: JSON.stringify({
            new_deadline: requestedDeadline,
            reason,
          }),
        },
      );
      if (!req.success) {
        throw new Error(req.message || "Deadline change request failed");
      }
      // Keep editable fields except deadline in normal BA update.
      const fdWithoutDeadline = new FormData();
      fdWithoutDeadline.append("name", values.name.trim());
      fdWithoutDeadline.append("description", values.description ?? "");
      fdWithoutDeadline.append("start_date", values.startDate);
      if (values.document)
        fdWithoutDeadline.append("document", values.document);
      await drfFormDataPatch<ApiProject>(
        `/api/v1/projects/${projectId}/`,
        fdWithoutDeadline,
      );
      showToast("Project updated. Deadline request sent to admin.", "success");
      await loadProjects();
      setPendingDeadlineRequest(null);
      setDeadlineReason("");
      closeForm();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Deadline change request failed",
        "error",
      );
    } finally {
      setSubmittingDeadlineRequest(false);
    }
  };

  const handleSubmit = async (values: ProjectFormValues) => {
    try {
      const fd = buildProjectFormData(values);
      if (editing) {
        const requestedDeadline = values.endDate;
        if (
          editingOriginalEndDate &&
          requestedDeadline !== editingOriginalEndDate
        ) {
          setPendingDeadlineRequest({
            projectId: editing.id,
            values,
            requestedDeadline,
          });
          return;
        } else {
          await drfFormDataPatch<ApiProject>(
            `/api/v1/projects/${editing.id}/`,
            fd,
          );
          showToast("Project updated", "success");
        }
      } else {
        await drfFormDataPost<ApiProject>("/api/v1/projects/", fd);
        showToast("Project created", "success");
      }
      await loadProjects();
      closeForm();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Save failed", "error");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between">
        <h1 className="text-xl font-bold">Project Management</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} /> Add
        </Button>
      </div>

      {loading ? <p className="text-sm text-gray-500">Loading…</p> : null}
      {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}

      <ProjectTable
        projects={projects}
        allowDelete={false}
        onEdit={(project) => {
          setEditing(project);
          setEditingOriginalEndDate(project.endDate);
          setOpen(true);
        }}
      />

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <button
            type="button"
            className="absolute inset-0"
            onClick={closeForm}
            aria-label="Close modal"
          />

          <div className="relative z-[101] w-full max-w-xl">
            <div className="mb-2 flex justify-end">
              <Button variant="secondary" size="icon" onClick={closeForm}>
                <X size={16} />
              </Button>
            </div>

            <ProjectForm
              initialValues={
                editing
                  ? {
                      name: editing.name,
                      description: editing.description,
                      startDate: editing.startDate,
                      endDate: editing.endDate,
                      document: null,
                    }
                  : undefined
              }
              onSubmit={handleSubmit}
              onCancel={closeForm}
            />
          </div>
        </div>
      )}

      {pendingDeadlineRequest ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/45 p-4">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setPendingDeadlineRequest(null)}
            aria-label="Close deadline request reason modal"
          />
          <div className="relative z-[131] w-full max-w-lg rounded-xl border border-border bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-cs-heading">
              Deadline Change Request
            </h2>
            <p className="mt-1 text-sm text-cs-text">
              Provide a reason to request deadline change from Admin.
            </p>
            <textarea
              value={deadlineReason}
              onChange={(e) => setDeadlineReason(e.target.value)}
              rows={4}
              className="mt-3 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cs-primary-100/40"
              placeholder="Reason for deadline change"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPendingDeadlineRequest(null)}
                disabled={submittingDeadlineRequest}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void submitDeadlineRequest()}
                disabled={submittingDeadlineRequest}
              >
                {submittingDeadlineRequest ? "Sending..." : "Send Request"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
