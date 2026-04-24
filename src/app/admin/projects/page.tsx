"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import ProjectForm, {
  type ProjectFormValues,
} from "@/components/common/projects/ProjectForm";
import ProjectTable, {
  type Project,
} from "@/components/common/projects/ProjectTable";
import { useToast } from "@/components/common/toast/ToastProvider";
import Button from "@/components/ui/Button";

export default function ProjectPage() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const handleSubmit = (values: ProjectFormValues) => {
    if (editing) {
      setProjects((prev) =>
        prev.map((p) => (p.id === editing.id ? { ...p, ...values } : p)),
      );
      showToast("Project updated successfully", "success");
    } else {
      setProjects((prev) => [
        { id: Date.now().toString(), ...values },
        ...prev,
      ]);
      showToast("Project created successfully", "success");
    }

    setOpen(false);
    setEditing(null);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="ui-page-title">Project Management</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} />
          Add Project
        </Button>
      </div>

      {/* Table */}
      <ProjectTable
        projects={projects}
        onEdit={(p) => {
          setEditing(p);
          setOpen(true);
        }}
        onDelete={(p) => {
          setProjects((prev) => prev.filter((x) => x.id !== p.id));
          showToast("Project deleted successfully", "success");
        }}
      />

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={closeModal}
            aria-label="Close modal"
          />
          <div className="relative z-50 my-6 w-full max-w-3xl space-y-2 pointer-events-none">
            <div className="flex justify-end pointer-events-auto">
              <Button variant="secondary" size="icon" onClick={closeModal}>
                <X size={16} />
              </Button>
            </div>

            <div className="pointer-events-auto">
              <ProjectForm
                initialValues={editing || undefined}
                onSubmit={handleSubmit}
                onCancel={closeModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
