"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/components/common/toast/ToastProvider";
import Button from "@/components/ui/Button";
import ProjectForm, {
  type ProjectFormValues,
} from "../../../components/common/projects/ProjectForm";
import ProjectTable, {
  type Project,
} from "../../../components/common/projects/ProjectTable";

export default function ProjectPage() {
  const { showToast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  useEffect(() => {
    if (!open) return undefined;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

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
    <div className="p-6 space-y-6">
      <div className="flex justify-between">
        <h1 className="text-xl font-bold">Project Management</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} /> Add
        </Button>
      </div>

      <ProjectTable
        projects={projects}
        onEdit={(p: Project) => {
          setEditing(p);
          setOpen(true);
        }}
        onDelete={(p: Project) =>
          setProjects((prev) => prev.filter((x) => x.id !== p.id))
        }
      />

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setOpen(false)}
            aria-label="Close modal"
          />

          <div className="relative z-[101] w-full max-w-xl">
            <div className="flex justify-end mb-2">
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
    </div>
  );
}
