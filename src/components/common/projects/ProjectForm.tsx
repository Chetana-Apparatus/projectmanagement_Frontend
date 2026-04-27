"use client";

import { Upload } from "lucide-react";
import { useEffect, useState } from "react";
import Card from "@/components/common/card/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export type ProjectFormValues = {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  document: File | null;
};

type Props = {
  initialValues?: ProjectFormValues;
  onSubmit: (values: ProjectFormValues) => void;
  onCancel: () => void;
};

export default function ProjectForm({
  initialValues,
  onSubmit,
  onCancel,
}: Props) {
  const [form, setForm] = useState<ProjectFormValues>({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    document: null,
  });

  const [dragOver, setDragOver] = useState(false);
  const [documentError, setDocumentError] = useState("");

  useEffect(() => {
    if (!initialValues) return;
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

  const updateDocument = (file: File | null) => {
    if (!file) return;
    if (!isSupportedFile(file)) {
      setDocumentError("Only .docx and .md files are allowed.");
      return;
    }
    setDocumentError("");
    setForm((prev) => ({ ...prev, document: file }));
  };

  return (
    <Card
      padding="none"
      className="flex max-h-[calc(100vh-8rem)] w-full max-w-xl !flex-col !items-stretch !justify-start overflow-hidden rounded-lg border border-border/80 bg-white shadow-2xl"
    >
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        {/* HEADER */}
        <div className="shrink-0 border-b border-gray-100 px-6 py-4 text-center">
          <h2 className="text-xl font-semibold">
            {initialValues ? "Edit Project" : "Add Project"}
          </h2>
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
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="project-end-date" className="text-sm font-medium">
                End Date
              </label>
              <Input
                id="project-end-date"
                type="date"
                className="h-11 w-full rounded-lg px-3"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>

          {/* DOCUMENT */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Document</p>

            <fieldset
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                updateDocument(e.dataTransfer.files?.[0] || null);
              }}
              className={`rounded-lg border-2 border-dashed p-5 text-center transition ${
                dragOver
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 bg-gray-50"
              }`}
            >
              <Upload size={22} className="mx-auto mb-2 text-gray-500" />

              <p className="text-sm font-medium">
                Drag & drop .docx or .md file here
              </p>
              <p className="mb-3 text-xs text-gray-500">or upload manually</p>

              <label className="inline-block cursor-pointer rounded-md border px-3 py-1.5 text-sm hover:bg-gray-100">
                Browse file
                <input
                  type="file"
                  accept=".docx,.md"
                  className="hidden"
                  onChange={(e) => updateDocument(e.target.files?.[0] || null)}
                />
              </label>

              {form.document && (
                <p className="mt-3 truncate text-xs text-green-600">
                  {form.document.name}
                </p>
              )}
              {documentError && (
                <p className="mt-2 text-xs text-red-600">{documentError}</p>
              )}
            </fieldset>
          </div>
        </div>

        {/* FIXED FOOTER */}
        <div className="flex shrink-0 justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Card>
  );
}
