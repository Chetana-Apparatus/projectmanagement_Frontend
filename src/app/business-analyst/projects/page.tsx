"use client";

import { Progress, Table, type TableColumnsType } from "antd";
import { renderAsync } from "docx-preview";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ProjectForm, {
  type ProjectFormValues,
} from "@/components/common/projects/ProjectForm";
import { useToast } from "@/components/common/toast/ToastProvider";
import Button from "@/components/ui/Button";
import { calculateProgress, getProgressColor } from "@/utils/progress";

type ProjectStatus = "Planned" | "In Progress" | "Completed";
type Project = ProjectFormValues & {
  id: string;
  status: ProjectStatus;
};

export default function BAProjectsPage() {
  const { showToast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const [previewError, setPreviewError] = useState("");
  const docxContainerRef = useRef<HTMLDivElement | null>(null);

  const previewFile = previewProject?.document ?? null;
  const isDocx = useMemo(
    () => Boolean(previewFile?.name.toLowerCase().endsWith(".docx")),
    [previewFile],
  );
  const isMarkdown = useMemo(
    () => Boolean(previewFile?.name.toLowerCase().endsWith(".md")),
    [previewFile],
  );

  useEffect(() => {
    if (!open) return undefined;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  useEffect(() => {
    if (
      !previewProject ||
      !isDocx ||
      !previewFile ||
      !docxContainerRef.current
    ) {
      return;
    }

    const container = docxContainerRef.current;
    container.innerHTML = "";
    setPreviewError("");

    let cancelled = false;
    const reader = new FileReader();
    reader.onload = async () => {
      if (cancelled || !container) return;
      const result = reader.result;
      if (!(result instanceof ArrayBuffer)) return;

      try {
        await renderAsync(result, container);
      } catch (_error) {
        setPreviewError("Unable to preview this DOCX file.");
      }
    };
    reader.readAsArrayBuffer(previewFile);

    return () => {
      cancelled = true;
      container.innerHTML = "";
    };
  }, [previewProject, isDocx, previewFile]);

  const columns: TableColumnsType<Project> = [
    {
      title: "PROJECT",
      dataIndex: "name",
      key: "name",
      render: (_, row) => (
        <button
          type="button"
          onClick={() => setPreviewProject(row)}
          className="text-left text-sky-700 underline underline-offset-2 hover:text-sky-900"
        >
          {row.name}
        </button>
      ),
    },
    { title: "START", dataIndex: "startDate", key: "startDate" },
    { title: "END", dataIndex: "endDate", key: "endDate" },
    {
      title: "PROGRESS",
      key: "progress",
      render: (_, row) => {
        const percent = calculateProgress(row.startDate, row.endDate);
        return (
          <div className="min-w-[140px] max-w-[180px]">
            <Progress
              percent={percent}
              strokeColor={getProgressColor(percent)}
              size="small"
              format={(value) => `${value ?? 0}%`}
            />
          </div>
        );
      },
    },
    { title: "STATUS", dataIndex: "status", key: "status" },
    {
      title: "ACTIONS",
      key: "actions",
      align: "right",
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            className="flex h-8 w-8 items-center justify-center border-sky-200 text-sky-600 hover:border-sky-200 hover:bg-sky-50"
            onClick={() => {
              setEditing(row);
              setOpen(true);
            }}
            aria-label={`Edit project ${row.name}`}
          >
            <Pencil size={16} />
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="flex h-8 w-8 items-center justify-center border-red-200 text-red-600 hover:border-red-200 hover:bg-red-50"
            onClick={() =>
              setProjects((prev) => prev.filter((x) => x.id !== row.id))
            }
            aria-label={`Delete project ${row.name}`}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  const handleSubmit = (values: ProjectFormValues) => {
    if (editing) {
      setProjects((prev) =>
        prev.map((p) => (p.id === editing.id ? { ...p, ...values } : p)),
      );
      showToast("Updated", "success");
    } else {
      setProjects((prev) => [
        {
          id: Date.now().toString(),
          ...values,
          status: "Planned",
        },
        ...prev,
      ]);
      showToast("Created", "success");
    }

    setOpen(false);
    setEditing(null);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between">
        <h1 className="text-xl font-bold">Project Management</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} /> Add
        </Button>
      </div>

      <Table<Project>
        rowKey="id"
        columns={columns}
        dataSource={projects}
        bordered
        pagination={{ pageSize: 5, showSizeChanger: false }}
        scroll={{ x: 980 }}
      />

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setOpen(false)}
            aria-label="Close modal"
          />

          <div className="relative z-[101] w-full max-w-xl">
            <div className="mb-2 flex justify-end">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setOpen(false)}
              >
                <X size={16} />
              </Button>
            </div>

            <ProjectForm
              initialValues={editing || undefined}
              onSubmit={handleSubmit}
              onCancel={() => setOpen(false)}
            />
          </div>
        </div>
      )}

      {previewProject ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setPreviewProject(null)}
            aria-label="Close document preview"
          />

          <div className="relative z-[121] flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-border bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div className="min-w-0">
                <h3 className="text-base font-semibold">
                  Project Document Preview
                </h3>
                <p className="truncate text-xs text-gray-500">
                  {previewProject.name}
                  {previewFile
                    ? ` - ${previewFile.name}`
                    : " - No document uploaded"}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => setPreviewProject(null)}
              >
                <X size={16} />
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto bg-gray-50 p-4">
              {!previewFile ? (
                <div className="flex h-full min-h-[300px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
                  No document uploaded for this project.
                </div>
              ) : null}

              {isDocx ? (
                <div className="h-full min-h-[300px] rounded-lg border border-gray-200 bg-white p-4">
                  {previewError ? (
                    <p className="text-sm text-red-600">{previewError}</p>
                  ) : (
                    <div
                      ref={docxContainerRef}
                      className="docx-preview-container mx-auto h-full max-w-3xl overflow-auto"
                    />
                  )}
                </div>
              ) : null}

              {isMarkdown && previewFile ? (
                <BAMarkdownPreview file={previewFile} />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BAMarkdownPreview({ file }: { file: File }) {
  const [content, setContent] = useState("");

  useEffect(() => {
    let cancelled = false;
    const reader = new FileReader();
    reader.onload = () => {
      if (cancelled) return;
      setContent(typeof reader.result === "string" ? reader.result : "");
    };
    reader.readAsText(file);

    return () => {
      cancelled = true;
    };
  }, [file]);

  return (
    <div className="h-full min-h-[300px] rounded-lg border border-gray-200 bg-white p-4">
      <pre className="whitespace-pre-wrap break-words text-sm text-gray-800">
        {content}
      </pre>
    </div>
  );
}
