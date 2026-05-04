import type { MilestoneRecord } from "@/components/common/milestones/MilestoneTable";
import type { Project } from "@/components/common/projects/ProjectTable";
import type { TaskFormValues } from "@/components/common/tasks/TaskForm";
import type { Task, TaskProgress } from "@/components/common/tasks/TaskTable";
import type { UserRecord } from "@/components/common/users/UserTable";
import type { RecentActivityAction } from "@/lib/recent-activity";
import { isAutoStopLastSource } from "@/lib/work-tracking-display";

/** --- Users --- */

export type ApiUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role?: string | null;
  status?: string | null;
  experience_level?: string | null;
  department?: string | null;
  tech_stack?: string | null;
  tech_notes?: string | null;
};

export function apiRoleToDisplay(
  r: string | null | undefined,
): UserRecord["role"] {
  if (r === "ADMIN") return "Admin";
  if (r === "BA") return "BA";
  return "Employee";
}

export function displayRoleToApi(
  r: UserRecord["role"],
): "ADMIN" | "BA" | "EMPLOYEE" {
  if (r === "Admin") return "ADMIN";
  if (r === "BA") return "BA";
  return "EMPLOYEE";
}

function expLevelToDesignation(exp: string | null | undefined): string {
  switch (exp) {
    case "JUNIOR":
      return "Junior Developer";
    case "SENIOR":
      return "Senior Developer";
    default:
      return "";
  }
}

function departmentToDevType(d: string | null | undefined): string {
  switch (d) {
    case "FRONTEND":
      return "Frontend";
    case "BACKEND":
      return "Backend";
    case "FULLSTACK":
      return "Fullstack";
    default:
      return "";
  }
}

function techStackLabel(t: string | null | undefined): string[] {
  if (!t) return [];
  const map: Record<string, string> = {
    PYTHON: "Python",
    JAVA: "Java",
    NESTJS: "NestJS",
    NEXTJS: "Next.js",
    REACT: "React",
  };
  return [map[t] ?? t];
}

/**
 * Build `tech_notes` sent to API: presets + optional Other line.
 */
export function buildTechNotes(techStack: string[], techOther: string): string {
  const parts = techStack.map((s) => s.trim()).filter(Boolean);
  const o = techOther.trim();
  if (o) {
    parts.push(
      ...o
        .split(/\r?\n|,/)
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }
  return parts.join(", ");
}

/** Parse saved `tech_notes` + fallback enum into form fields. */
export function parseTechFromApi(
  tech_stack: string | null | undefined,
  tech_notes: string | null | undefined,
): { techStack: string[]; techOther: string } {
  const notes = (tech_notes || "").trim();
  if (notes) {
    const parts = notes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.replace(/^other:\s*/i, "").trim())
      .filter(Boolean);
    return { techStack: parts, techOther: "" };
  }
  return { techStack: techStackLabel(tech_stack), techOther: "" };
}

export function apiUserToRecord(u: ApiUser): UserRecord {
  const role = apiRoleToDisplay(u.role);
  const notes = (u.tech_notes || "").trim();
  const techStackDisplay = notes
    ? notes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) =>
          /^other:/i.test(s)
            ? `Other: ${s.replace(/^other:\s*/i, "").trim()}`
            : s,
        )
    : techStackLabel(u.tech_stack);
  const employeeOnlyFields =
    role === "Employee"
      ? {
          designation: expLevelToDesignation(u.experience_level),
          developerType: departmentToDevType(u.department),
          techStack: techStackDisplay,
        }
      : {
          designation: "-",
          developerType: "-",
          techStack: [],
        };

  return {
    id: String(u.id),
    firstName: u.first_name,
    lastName: u.last_name,
    email: u.email,
    ...employeeOnlyFields,
    techNotes: u.tech_notes ?? "",
    apiTechStack: u.tech_stack ?? null,
    role,
    status: u.status === "INACTIVE" ? "Deactivated" : "Active",
  };
}

function designationToExp(d: string): "JUNIOR" | "SENIOR" | "" {
  if (d === "Senior Developer") return "SENIOR";
  if (d === "Intern" || d === "Junior Developer") {
    return "JUNIOR";
  }
  return d.trim() as "JUNIOR" | "SENIOR" | "";
}

function devTypeToDepartment(
  t: string,
): "FRONTEND" | "BACKEND" | "FULLSTACK" | "" {
  if (t === "Frontend") return "FRONTEND";
  if (t === "Backend") return "BACKEND";
  if (t === "Fullstack") return "FULLSTACK";
  return t.trim() as "FRONTEND" | "BACKEND" | "FULLSTACK" | "";
}

const TECH_TO_API: Record<string, string> = {
  "Next.js": "NEXTJS",
  React: "REACT",
  Python: "PYTHON",
  Java: "JAVA",
  NestJS: "NESTJS",
};

export function userFormToCreateBody(values: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRecord["role"];
  designation: string;
  developerType: string;
  techStack: string[];
  techOther: string;
}): Record<string, unknown> {
  const role = displayRoleToApi(values.role);
  const experience_level = designationToExp(values.designation);
  const department = devTypeToDepartment(values.developerType);
  let tech_stack = "";
  for (const t of values.techStack) {
    const normalized = t.trim();
    if (!normalized) continue;
    if (TECH_TO_API[normalized]) {
      tech_stack = TECH_TO_API[normalized];
      break;
    }
    tech_stack = normalized;
    break;
  }
  const tech_notes =
    role === "EMPLOYEE"
      ? buildTechNotes(values.techStack, values.techOther)
      : "";
  const hasEmpTech = values.techStack.length > 0 || !!values.techOther.trim();
  if (role === "EMPLOYEE" && hasEmpTech && !tech_stack) {
    tech_stack = "PYTHON";
  }

  return {
    email: values.email.trim(),
    password: values.password,
    first_name: values.firstName.trim(),
    last_name: values.lastName.trim(),
    role,
    status: "ACTIVE",
    experience_level: role === "EMPLOYEE" ? experience_level : "",
    department: role === "EMPLOYEE" ? department : "",
    tech_stack:
      role === "EMPLOYEE"
        ? tech_stack || (tech_notes.trim() ? "PYTHON" : "")
        : "",
    tech_notes: role === "EMPLOYEE" ? tech_notes : "",
  };
}

export function userFormToPatchBody(values: {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRecord["role"];
  designation: string;
  developerType: string;
  techStack: string[];
  techOther: string;
  password?: string;
}): Record<string, unknown> {
  const role = displayRoleToApi(values.role);
  const experience_level = designationToExp(values.designation);
  const department = devTypeToDepartment(values.developerType);
  let tech_stack = "";
  for (const t of values.techStack) {
    const normalized = t.trim();
    if (!normalized) continue;
    if (TECH_TO_API[normalized]) {
      tech_stack = TECH_TO_API[normalized];
      break;
    }
    tech_stack = normalized;
    break;
  }
  const tech_notes =
    role === "EMPLOYEE"
      ? buildTechNotes(values.techStack, values.techOther)
      : "";

  const body: Record<string, unknown> = {
    email: values.email.trim(),
    first_name: values.firstName.trim(),
    last_name: values.lastName.trim(),
    role,
    status: "ACTIVE",
    experience_level: role === "EMPLOYEE" ? experience_level : "",
    department: role === "EMPLOYEE" ? department : "",
    tech_stack:
      role === "EMPLOYEE"
        ? tech_stack || (tech_notes.trim() ? "PYTHON" : "")
        : "",
    tech_notes: role === "EMPLOYEE" ? tech_notes : "",
  };
  if (values.password?.trim()) {
    body.password = values.password.trim();
  }
  return body;
}

/** --- Projects --- */

export type ApiProject = {
  id: number;
  name: string;
  description: string;
  start_date: string;
  deadline: string;
  status: string;
  document?: string | null;
  progress_percent?: number | null;
};

function fileNameFromPath(path: string | null | undefined): string {
  if (!path) return "";
  const normalized = path.split("?")[0];
  const parts = normalized.split("/");
  return parts[parts.length - 1] || "";
}

export function apiProjectToRow(p: ApiProject): Project {
  let statusLabel: Project["status"] = "Not Started";
  if (p.status === "ACTIVE") statusLabel = "In Progress";
  if (p.status === "DELAYED") statusLabel = "Delayed";
  if (p.status === "COMPLETED" || p.status === "ARCHIVED")
    statusLabel = "Completed";

  return {
    id: String(p.id),
    name: p.name,
    description: p.description ?? "",
    startDate: p.start_date,
    expectedDate: p.deadline,
    documentUrl: p.document ?? null,
    documentName: fileNameFromPath(p.document),
    status: statusLabel,
    progressPercent:
      typeof p.progress_percent === "number" ? p.progress_percent : 0,
  };
}

/** --- Milestones --- */

export type ApiMilestone = {
  id: number;
  project: number;
  milestone_no?: number;
  project_name?: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: string;
  progress_percent?: number | null;
};

export function apiMilestoneToRecord(m: ApiMilestone): MilestoneRecord {
  const milestoneStatus: MilestoneRecord["status"] =
    m.status === "COMPLETED"
      ? "Completed"
      : m.status === "IN_PROGRESS"
        ? "In Progress"
        : m.status === "DELAYED"
          ? "Delayed"
          : "Not Started";
  return {
    id: String(m.id),
    projectId: String(m.project),
    name: m.name,
    description: m.description ?? "",
    startDate: m.start_date,
    expectedDate: m.end_date,
    status: milestoneStatus,
    progressPercent:
      typeof m.progress_percent === "number" ? m.progress_percent : 0,
    assignedEmployees: [],
    watchers: [],
  };
}

/** --- Tasks --- */

export type ApiTask = {
  id: number;
  project: number;
  project_document?: string | null;
  milestone?: number | null;
  title: string;
  description?: string;
  assigned_to?: number | null;
  assigned_to_name?: string;
  created_by?: number;
  created_by_name?: string;
  status: string;
  deadline?: string | null;
  created_at?: string;
  /** Work-tracking progress 0–100 from backend. */
  progress_percent?: number | null;
  planned_hours?: number | null;
  /** Present when assignee has an active TimeLog (timer running). */
  timer_state?: string | null;
  /** When `timer_state` is `STOPPED`, distinguishes manual vs backend auto-stop. */
  last_stop_source?: string | null;
};

function taskDeadlineYmd(deadline: string | null | undefined): string | null {
  if (!deadline) return null;
  return deadline.split("T")[0];
}

/** Progress column: timer + status + overdue (expected date < today, not complete). */
export function deriveTaskProgress(
  t: ApiTask,
  latestActivity?: RecentActivityAction,
): TaskProgress {
  const ymd = taskDeadlineYmd(t.deadline ?? null);
  const today = new Date().toISOString().split("T")[0];
  const overdue = Boolean(ymd && ymd < today && t.status !== "COMPLETED");
  if (overdue || t.status === "DELAYED") return "Delayed";
  if (t.status === "COMPLETED") return "Complete";
  const timer = t.timer_state ?? "";
  const lastStop = t.last_stop_source;

  /* Backend maps stop to PAUSED; latest activity confirms STOPPED (EmployeeTasksProvider). */
  if (
    latestActivity === "STOPPED" &&
    (t.status === "PAUSED" || timer === "PAUSED")
  ) {
    return "Stopped";
  }

  if (timer === "STARTED") return "Running";
  if (timer === "PAUSED") return "Paused";
  if (timer === "AUTO_STOPPED") return "Auto stop";
  if (timer === "STOPPED") {
    return isAutoStopLastSource(lastStop) ? "Auto stop" : "Stopped";
  }
  /* Auto-stop may clear `timer_state` but keep last_stop_source + task still PAUSED in DB */
  if (
    !timer &&
    isAutoStopLastSource(lastStop) &&
    t.status !== "COMPLETED" &&
    t.status !== "NOT_STARTED"
  ) {
    return "Auto stop";
  }
  /* Fallback when API omits timer_state */
  if (t.status === "PAUSED") return "Paused";
  if (t.status === "IN_PROGRESS") return "Stopped";
  if (t.status === "BLOCKED") return "Stopped";
  if (t.status === "NOT_STARTED") return "Not Started";
  return "Not Started";
}

function apiTaskStatusToUi(s: string): Task["status"] {
  switch (s) {
    case "NOT_STARTED":
      return "Not Started";
    case "IN_PROGRESS":
      return "In Progress";
    case "COMPLETED":
      return "Completed";
    case "PAUSED":
      return "Paused";
    case "DELAYED":
      return "Delayed";
    case "BLOCKED":
      return "Stopped";
    default:
      return "Not Started";
  }
}

function uiTaskStatusToApi(s: Task["status"]): string {
  switch (s) {
    case "Not Started":
      return "NOT_STARTED";
    case "In Progress":
      return "IN_PROGRESS";
    case "Paused":
      return "PAUSED";
    case "Stopped":
      return "BLOCKED";
    case "Completed":
      return "COMPLETED";
    case "Delayed":
      return "DELAYED";
    default:
      return "NOT_STARTED";
  }
}

export function apiTaskToRow(
  t: ApiTask,
  latestActivity?: RecentActivityAction,
): Task {
  const created = t.created_at?.split("T")[0] ?? "";
  const deadline = t.deadline ?? "";
  return {
    id: String(t.id),
    name: t.title,
    description: t.description ?? "",
    project: String(t.project),
    milestone: t.milestone != null ? String(t.milestone) : "",
    employee: t.assigned_to_name ?? "",
    assignedBy: t.assigned_to != null ? String(t.assigned_to) : "",
    startDate: created,
    expectedDate: deadline,
    status: apiTaskStatusToUi(t.status),
    progress: deriveTaskProgress(t, latestActivity),
    progressPercent:
      typeof t.progress_percent === "number" ? t.progress_percent : 0,
  };
}

export function buildTaskFormData(v: TaskFormValues): FormData {
  const fd = new FormData();
  fd.append("title", v.name.trim());
  fd.append("description", v.description.trim());
  fd.append("project", v.project);
  if (v.milestone) {
    fd.append("milestone", v.milestone);
  }
  fd.append("status", uiTaskStatusToApi(v.status));
  if (v.expectedDate) {
    fd.append("deadline", v.expectedDate);
  }
  if (v.assignedBy.trim()) {
    fd.append("assigned_to", v.assignedBy.trim());
  }
  return fd;
}
