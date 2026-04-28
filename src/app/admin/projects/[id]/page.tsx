"use client";

import { useParams } from "next/navigation";
import ProjectDocumentOnly from "@/components/common/projects/ProjectDocumentOnly";

export default function AdminProjectDocumentPage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id ?? "";
  return <ProjectDocumentOnly projectId={projectId} />;
}
