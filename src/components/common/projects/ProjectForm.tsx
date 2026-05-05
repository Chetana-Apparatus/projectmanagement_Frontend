"use client";

import { Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import Card from "@/components/common/card/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export type ProjectFormValues = {
  name: string;
  description: string;
  startDate: string;
  expectedDate: string;
  status: "Not Started" | "In Progress" | "Completed" | "Delayed";
  documents: File[];
};

type Props = {
  initialValues?: ProjectFormValues;
  onSubmit: (values: ProjectFormValues) => void;
  onCancel: () => void;
  statusEditable?: boolean;
};

export default function ProjectForm({
  initialValues,
  onSubmit,
  onCancel,
  statusEditable = true,
}: Props) {
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
      return;
    }
    setForm(initialValues);
  }, [initialValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const isSupportedFile = (file: File) => {
    const lowerName = file.name.toLowerCase();
    return lowerName.endsWith(".docx") || lowerName.endsWith(".md");
  };

  const updateDocuments = (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const next = Array.from(files);
    const bad = next.find((file) => !isSupportedFile(file));
    if (bad) {
      setDocumentError("Only .docx and .md files are allowed.");
      return;
    }
    setDocumentError("");
    setForm((prev) => ({ ...prev, documents: next }));
  };

  /** Label → control gap (keep in sync with Task/Milestone/User forms) */
  const fieldClass = "flex flex-col gap-1.5";
  const labelClass = "text-sm font-medium text-cs-heading";
  const selectClass =
    "h-11 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cs-primary-100/30";
  const title = initialValues ? "Edit Project" : "Add Project";

  return (
    <Card
      variant="surface"
      padding="none"
      className="flex max-h-[calc(100vh-8rem)] w-full !flex-col !items-stretch !justify-start overflow-hidden rounded-lg border border-border/80 !bg-white shadow-2xl"
    >
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-start border-b border-gray-100 bg-white px-4 py-4 sm:px-6">
          <div className="w-9 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1 text-center">
            <h2 className="h2 font-semibold">{title}</h2>
          </div>
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

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6 pr-4">
          <div className={`${fieldClass}`}>
            <label htmlFor="project-name" className={labelClass}>
              Project Name
            </label>
            <Input
              id="project-name"
              className="h-11 w-full rounded-lg border px-3 text-sm"
              placeholder="Enter project name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className={fieldClass}>
            <label htmlFor="project-description" className={labelClass}>
              Description
            </label>
            <textarea
              id="project-description"
              className="min-h-[90px] w-full resize-none rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cs-primary-100/30"
              placeholder="Describe the project…"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className={fieldClass}>
              <label htmlFor="project-start-date" className={labelClass}>
                Start Date
              </label>
              <Input
                id="project-start-date"
                type="date"
                className="h-11 w-full rounded-lg border px-3 text-sm"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
              />
            </div>

            <div className={fieldClass}>
              <label htmlFor="project-end-date" className={labelClass}>
                Expected Date
              </label>
              <Input
                id="project-end-date"
                type="date"
                className="h-11 w-full rounded-lg border px-3 text-sm"
                value={form.expectedDate}
                onChange={(e) =>
                  setForm({ ...form, expectedDate: e.target.value })
                }
              />
            </div>
          </div>

          <div className={fieldClass}>
            <label htmlFor="project-status" className={labelClass}>
              Status
            </label>
            <select
              id="project-status"
              className={selectClass}
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

          <div className={fieldClass}>
            <span className={labelClass}>Project document</span>

            <section
              aria-label="Upload project document, drag and drop or browse"
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
              className={cn(
                "rounded-lg border border-dashed border-input bg-white px-4 py-3 transition-colors",
                dragOver && "border-cs-primary-100 bg-cs-primary-100/5",
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-input bg-gray-50/80"
                  aria-hidden
                >
                  <Upload
                    className="h-5 w-5 text-gray-500"
                    strokeWidth={1.75}
                  />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm text-cs-text">
                    Drag & drop{" "}
                    <span className="font-medium text-cs-heading">.docx</span>{" "}
                    or <span className="font-medium text-cs-heading">.md</span>{" "}
                    here
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Or use Browse to pick files from your device.
                  </p>
                </div>
                <label className="shrink-0 cursor-pointer self-start sm:self-center">
                  <span className="inline-flex h-10 items-center justify-center rounded-lg border border-input bg-white px-4 text-sm font-medium text-cs-text shadow-sm transition-colors hover:bg-gray-50">
                    Browse files
                  </span>
                  <input
                    type="file"
                    accept=".docx,.md"
                    multiple
                    className="sr-only"
                    onChange={(e) => updateDocuments(e.target.files)}
                  />
                </label>
              </div>

              {form.documents.length > 0 && (
                <p className="mt-3 border-t border-gray-100 pt-3 text-left text-xs font-medium text-emerald-700">
                  {form.documents.length} file(s) selected
                </p>
              )}
              {documentError ? (
                <p className="mt-2 text-left text-xs text-red-600">
                  {documentError}
                </p>
              ) : null}
            </section>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-100 bg-white px-6 py-4">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {initialValues ? "Save Changes" : "Create Project"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
