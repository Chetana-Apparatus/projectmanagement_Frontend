"use client";
import type { MenuProps } from "antd";
import { Dropdown, Modal, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  Check,
  ChevronDown,
  Download,
  FileText,
  FolderOpen,
  PauseCircle,
  PlayCircle,
  StopCircle,
} from "lucide-react";
import { type CSSProperties, Suspense, useEffect, useState } from "react";
import { useToast } from "@/components/common/toast/ToastProvider";
import ProjectDetailModal from "@/components/common/work-tracking/ProjectDetailModal";
import Button from "@/components/ui/Button";
import { useEmployeeTasks } from "@/features/employee-tasks/EmployeeTasksProvider";
import {
  type EmployeeManagedTask,
  employeeProjectLinkTableClass,
  fileNameFromPath,
  statusBadgeLayoutClass,
  statusClassMap,
  toDocumentType,
} from "@/features/employee-tasks/status";
import { useNotificationTableHighlight } from "@/hooks/useNotificationTableHighlight";
import type { ApiProjectFile } from "@/lib/admin-mappers";
import { getPublicApiOrigin } from "@/lib/api-base";
import { cn } from "@/lib/utils";
import { fetchApiProject } from "@/lib/fetch-api-project";
import {
  mergeProjectDocuments,
  type ProjectFileRow,
} from "@/lib/project-documents";
import { fetchAllPages } from "@/lib/pms-http";

const singleLineHeaderStyle: CSSProperties = { whiteSpace: "nowrap" };
const singleLineCellStyle: CSSProperties = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

/** “More” menu — stop / complete match primary action semantics (red / green). */
const MORE_MENU_STOP_ITEM_CLASS =
  "!mx-1 !my-0.5 !rounded-md !text-red-900 !bg-red-50 hover:!bg-red-100 active:!bg-red-200 [&.ant-dropdown-menu-item-active]:!bg-red-200 [&.ant-dropdown-menu-item-selected]:!bg-red-200";
const MORE_MENU_COMPLETE_ITEM_CLASS =
  "!mx-1 !my-0.5 !rounded-md !text-green-900 !bg-green-50 hover:!bg-green-100 active:!bg-green-200 [&.ant-dropdown-menu-item-active]:!bg-green-200 [&.ant-dropdown-menu-item-selected]:!bg-green-200";

function formatExpectedEndDate(value: string) {
  if (!value || value === "-") return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
}

function documentHref(documentPath: string): string {
  if (!documentPath) return "";
  if (/^https?:\/\//i.test(documentPath)) return documentPath;
  return `${getPublicApiOrigin() || "http://127.0.0.1:8000"}${documentPath}`;
}

/** Primary project document plus `/api/v1/files/` rows for this project (same merge as admin). */
async function fetchMergedProjectDocumentsForEmployee(
  projectId: number,
): Promise<ProjectFileRow[]> {
  const [project, allFiles] = await Promise.all([
    fetchApiProject(projectId),
    fetchAllPages<ApiProjectFile>("/api/v1/files/").catch(() => []),
  ]);
  return mergeProjectDocuments(
    project,
    allFiles.filter((f) => Number(f.project) === projectId),
  );
}

function mergeTaskAndProjectDocuments(
  taskDocs: EmployeeManagedTask["documents"],
  projectFiles: ProjectFileRow[],
): EmployeeManagedTask["documents"] {
  const byKey = new Map<string, EmployeeManagedTask["documents"][number]>();

  const pushPath = (
    pathOrUrl: string,
    preferred?: EmployeeManagedTask["documents"][number],
  ) => {
    const trimmed = pathOrUrl.trim();
    if (!trimmed) return;
    const url = documentHref(trimmed);
    const key = url.split("?")[0].toLowerCase();
    if (byKey.has(key)) return;
    byKey.set(
      key,
      preferred ?? {
        name: fileNameFromPath(trimmed),
        url,
        type: toDocumentType(trimmed),
      },
    );
  };

  for (const d of taskDocs) {
    pushPath(d.url, { ...d, url: documentHref(d.url) });
  }
  for (const pf of projectFiles) {
    pushPath(pf.url, {
      name: pf.displayName,
      url: pf.url,
      type: toDocumentType(pf.url),
    });
  }

  return [...byKey.values()];
}

const isNearDeadline = (deadline: string) => {
  if (!deadline || deadline === "-") return false;
  const parsedDeadline = new Date(deadline);
  if (Number.isNaN(parsedDeadline.getTime())) return false;
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfDeadline = new Date(
    parsedDeadline.getFullYear(),
    parsedDeadline.getMonth(),
    parsedDeadline.getDate(),
  );
  const diffMs = startOfDeadline.getTime() - startOfToday.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 2;
};

export default function EmployeeTasksPage() {
  return (
    <Suspense
      fallback={<p className="p-4 text-sm text-gray-500 md:p-6">Loading…</p>}
    >
      <EmployeeTasksPageContent />
    </Suspense>
  );
}

function EmployeeTasksPageContent() {
  const {
    loading,
    myTasks,
    startTask,
    pauseTask,
    stopTask,
    completeTask,
    requestDeadlineChange,
    canTransition,
  } = useEmployeeTasks();
  const { showToast } = useToast();
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [isDeadlineModalOpen, setIsDeadlineModalOpen] = useState(false);
  const [isSubmittingDeadlineRequest, setIsSubmittingDeadlineRequest] =
    useState(false);
  const [selectedProjectName, setSelectedProjectName] = useState("");
  const [docsModalProjectId, setDocsModalProjectId] = useState<number | null>(
    null,
  );
  const [docsModalTaskDocs, setDocsModalTaskDocs] = useState<
    EmployeeManagedTask["documents"]
  >([]);
  const [docsModalList, setDocsModalList] = useState<
    EmployeeManagedTask["documents"]
  >([]);
  const [docsModalLoading, setDocsModalLoading] = useState(false);
  const [docsModalFetchError, setDocsModalFetchError] = useState<string | null>(
    null,
  );
  const [deadlineTaskId, setDeadlineTaskId] = useState<string | null>(null);
  const [requestedDeadline, setRequestedDeadline] = useState("");
  const [deadlineReason, setDeadlineReason] = useState("");
  const [projectModalId, setProjectModalId] = useState<number | null>(null);

  const highlightRowId = useNotificationTableHighlight(
    loading,
    "taskId",
    myTasks.length,
  );

  const openProjectDocuments = (task: EmployeeManagedTask) => {
    setSelectedProjectName(task.project);
    const rawPid = task.projectId?.trim() ?? "";
    const pid =
      rawPid !== "" && !Number.isNaN(Number(rawPid)) ? Number(rawPid) : null;
    setDocsModalProjectId(pid);
    setDocsModalTaskDocs(task.documents);
    setDocsModalFetchError(null);
    setDocsModalList(mergeTaskAndProjectDocuments(task.documents, []));
    setDocsModalLoading(pid != null);
    setIsDocsModalOpen(true);
  };

  useEffect(() => {
    if (!isDocsModalOpen || docsModalProjectId == null) {
      if (!isDocsModalOpen) {
        setDocsModalLoading(false);
      }
      return;
    }

    let cancelled = false;
    setDocsModalFetchError(null);

    void (async () => {
      try {
        const projectFiles =
          await fetchMergedProjectDocumentsForEmployee(docsModalProjectId);
        if (cancelled) return;
        setDocsModalList(
          mergeTaskAndProjectDocuments(docsModalTaskDocs, projectFiles),
        );
      } catch (e) {
        if (!cancelled) {
          setDocsModalFetchError(
            e instanceof Error ? e.message : "Could not load project documents",
          );
          setDocsModalList(
            mergeTaskAndProjectDocuments(docsModalTaskDocs, []),
          );
        }
      } finally {
        if (!cancelled) setDocsModalLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isDocsModalOpen, docsModalProjectId, docsModalTaskDocs]);

  const handleDownload = (file: EmployeeManagedTask["documents"][number]) => {
    const anchor = document.createElement("a");
    anchor.href = file.url;
    anchor.download = file.name;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleStop = (taskId: string) => {
    stopTask(taskId);
  };

  const resetDeadlineForm = () => {
    setRequestedDeadline("");
    setDeadlineReason("");
  };

  const handleDeadlineModalClose = () => {
    setIsDeadlineModalOpen(false);
    setDeadlineTaskId(null);
    resetDeadlineForm();
  };

  const handleDeadlineRequestSubmit = async () => {
    if (!deadlineTaskId || !requestedDeadline) {
      showToast("Please select a deadline date", "error");
      return;
    }
    setIsSubmittingDeadlineRequest(true);
    const isSuccess = await requestDeadlineChange(
      deadlineTaskId,
      requestedDeadline,
      deadlineReason || "Need more time to complete task.",
    );
    setIsSubmittingDeadlineRequest(false);
    if (!isSuccess) return;
    handleDeadlineModalClose();
    showToast("Mail sent successfully", "success");
  };

  const handleComplete = (
    taskId: string,
    taskStatus: EmployeeManagedTask["status"],
  ) => {
    const alreadyCompleted = taskStatus === "Completed";
    Modal.confirm({
      title: alreadyCompleted
        ? "Send completion mail again?"
        : "Mark task as completed?",
      content: alreadyCompleted
        ? "This will resend completion notification mail."
        : "If timer is running, stop task first and then complete.",
      okText: alreadyCompleted ? "Send Mail" : "Complete",
      cancelText: "Cancel",
      onOk: () => {
        completeTask(taskId);
      },
    });
  };

  const columns: ColumnsType<EmployeeManagedTask> = [
    {
      title: "Project",
      key: "project",
      width: 190,
      align: "center",
      onHeaderCell: () => ({ style: singleLineHeaderStyle }),
      onCell: () => ({ style: singleLineCellStyle }),
      render: (_, record) => {
        const rawPid = record.projectId?.trim() ?? "";
        const projectNumericId =
          rawPid !== "" && !Number.isNaN(Number(rawPid))
            ? Number(rawPid)
            : null;
        return projectNumericId != null ? (
          <div className="flex min-w-0 justify-center">
            <button
              type="button"
              className={employeeProjectLinkTableClass}
              onClick={() => setProjectModalId(projectNumericId)}
              aria-label={`View project details: ${record.project}`}
            >
              {record.project}
            </button>
          </div>
        ) : (
          <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-cs-text">
            {record.project}
          </span>
        );
      },
    },
    {
      title: "Milestone",
      dataIndex: "milestone",
      key: "milestone",
      width: 170,
      align: "center",
      onHeaderCell: () => ({ style: singleLineHeaderStyle }),
      onCell: () => ({ style: singleLineCellStyle }),
      render: (value: string) => (
        <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
          {value}
        </span>
      ),
    },
    {
      title: "Task Name",
      dataIndex: "task",
      key: "task",
      width: 260,
      align: "center",
      onHeaderCell: () => ({ style: singleLineHeaderStyle }),
      onCell: () => ({ style: singleLineCellStyle }),
      render: (value: string) => (
        <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
          {value}
        </span>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 150,
      align: "center",
      onHeaderCell: () => ({ style: singleLineHeaderStyle }),
      onCell: () => ({ style: singleLineCellStyle }),
      render: (_, record) => (
        <span
          className={`${statusBadgeLayoutClass} max-w-full ${statusClassMap[record.status]}`}
        >
          {record.status}
        </span>
      ),
    },
    {
      title: "Expected Deadline",
      key: "expectedDate",
      width: 140,
      align: "center",
      onHeaderCell: () => ({ style: singleLineHeaderStyle }),
      onCell: () => ({ style: singleLineCellStyle }),
      render: (_, record) => (
        <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
          {formatExpectedEndDate(record.deadline)}
        </span>
      ),
    },
    {
      title: "Assigned By",
      dataIndex: "assignedBy",
      key: "assignedBy",
      align: "center",
      width: 140,
      onHeaderCell: () => ({ style: singleLineHeaderStyle }),
      onCell: () => ({ style: singleLineCellStyle }),
      render: (value: string) => (
        <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
          {value}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 320,
      align: "center",
      onHeaderCell: () => ({ style: singleLineHeaderStyle }),
      onCell: () => ({ style: singleLineCellStyle }),
      render: (_, record) => {
        const canStart = canTransition(record.status, "In Progress");
        const canPause = canTransition(record.status, "Paused");
        const canStop = canTransition(record.status, "Stopped");
        const canComplete = canTransition(record.status, "Completed");
        const disableAllActions = record.status === "Blocked";
        const showDeadlineRequest = isNearDeadline(record.deadline);
        const openRequestDeadlineModal = () => {
          setDeadlineTaskId(record.id);
          resetDeadlineForm();
          setIsDeadlineModalOpen(true);
        };

        const primaryAction = (() => {
          if (record.status === "Completed") {
            return {
              label: "Completed",
              icon: <Check className="size-4" />,
              onClick: () => {},
              disabled: true,
              variant: "secondary" as const,
              className: "h-8 px-3 text-xs",
            };
          }
          if (record.status === "In Progress") {
            return {
              label: "Stop",
              icon: <StopCircle className="size-4" />,
              onClick: () => handleStop(record.id),
              disabled: disableAllActions || !canStop,
              variant: "ghost" as const,
              className:
                "h-8 px-3 text-xs !border !border-red-700 !bg-red-600 !text-white [&_svg]:!text-white hover:!bg-red-700 hover:!text-white hover:!border-red-800",
            };
          }
          const resumeLabel =
            record.status === "Paused" || record.status === "Stopped"
              ? "Resume"
              : "Start";
          return {
            label: resumeLabel,
            icon: <PlayCircle className="size-4" />,
            onClick: () => startTask(record.id),
            disabled: disableAllActions || !canStart,
            variant: "default" as const,
            className: "h-8 px-3 text-xs",
          };
        })();

        const secondaryMenuItems: MenuProps["items"] = (() => {
          const items: MenuProps["items"] = [];

          items.push({
            key: "documents",
            label: "Project documents",
            icon: <FolderOpen className="size-4" />,
            disabled: disableAllActions,
            onClick: () => openProjectDocuments(record),
          });

          if (canPause) {
            items.push({
              key: "pause",
              label: "Pause",
              icon: <PauseCircle className="size-4" />,
              disabled: disableAllActions || !canPause,
              onClick: () => pauseTask(record.id),
            });
          }
          if (canStop && record.status !== "In Progress") {
            const stopDisabled = disableAllActions || !canStop;
            items.push({
              key: "stop",
              label: "Stop",
              icon: <StopCircle className="size-4 text-red-800" />,
              disabled: stopDisabled,
              className: cn(
                MORE_MENU_STOP_ITEM_CLASS,
                stopDisabled && "!opacity-50",
              ),
              onClick: () => handleStop(record.id),
            });
          }
          if (canComplete) {
            const completeDisabled = disableAllActions || !canComplete;
            items.push({
              key: "complete",
              label: "Complete",
              icon: <Check className="size-4 text-green-800" />,
              disabled: completeDisabled,
              className: cn(
                MORE_MENU_COMPLETE_ITEM_CLASS,
                completeDisabled && "!opacity-50",
              ),
              onClick: () => handleComplete(record.id, record.status),
            });
          }
          if (showDeadlineRequest) {
            items.push({
              key: "deadline",
              label: "Request Deadline",
              icon: <FileText className="size-4" />,
              disabled: disableAllActions,
              onClick: openRequestDeadlineModal,
            });
          }
          return items;
        })();

        return (
          <div className="flex justify-end gap-2">
            <Button
              variant={primaryAction.variant}
              className={primaryAction.className}
              disabled={primaryAction.disabled}
              onClick={primaryAction.onClick}
            >
              {primaryAction.icon}
              {primaryAction.label}
            </Button>
            <Dropdown
              trigger={["click"]}
              menu={{ items: secondaryMenuItems }}
              disabled={secondaryMenuItems.length === 0}
            >
              <Button
                variant="secondary"
                className="h-8 px-3 text-xs"
                disabled={secondaryMenuItems.length === 0}
              >
                More
                <ChevronDown className="size-4" />
              </Button>
            </Dropdown>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="space-y-1">
        <h2 className="h2 font-semibold text-cs-heading">My Tasks</h2>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border-1 border-gray-100 bg-white shadow-sm">
        {loading ? (
          <p className="px-4 py-3 text-sm text-gray-500 md:px-6">
            Loading tasks…
          </p>
        ) : null}
        <Table<EmployeeManagedTask>
          className="w-full [&_.ant-table]:bg-white"
          rowKey="id"
          columns={columns}
          dataSource={myTasks}
          pagination={{ pageSize: 6 }}
          scroll={{ x: 1280 }}
          rowClassName={(record) =>
            highlightRowId && record.id === highlightRowId
              ? "!bg-sky-100/90 transition-colors duration-300"
              : "hover:bg-gray-50/60"
          }
        />
      </div>

      <ProjectDetailModal
        open={projectModalId != null}
        projectId={projectModalId}
        onClose={() => setProjectModalId(null)}
      />

      <Modal
        title="Project Documents"
        open={isDocsModalOpen}
        onCancel={() => {
          setIsDocsModalOpen(false);
          setDocsModalProjectId(null);
          setDocsModalTaskDocs([]);
          setDocsModalList([]);
          setDocsModalFetchError(null);
          setDocsModalLoading(false);
        }}
        footer={null}
      >
        <div className="space-y-3">
          <p className="p1 text-cs-text">
            {selectedProjectName
              ? `Files uploaded for ${selectedProjectName}`
              : "No project selected"}
          </p>

          {docsModalLoading ? (
            <p className="text-sm text-gray-500">Loading project files…</p>
          ) : null}

          {docsModalFetchError ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {docsModalFetchError} Showing task attachments only.
            </p>
          ) : null}

          {docsModalList.length > 0 ? (
            <ul className="max-h-[min(360px,50vh)] space-y-2 overflow-y-auto pr-1">
              {docsModalList.map((doc, idx) => (
                <li
                  key={`${doc.url}-${idx}`}
                  className="rounded-lg border border-cs-border px-3 py-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <FileText className="size-4 shrink-0 text-cs-primary-100" />
                      <div className="min-w-0">
                        <p className="p1 truncate font-medium text-cs-heading">
                          {doc.name || fileNameFromPath(doc.url)}
                        </p>
                        <p className="p1 uppercase text-cs-text">{doc.type}</p>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      className="h-8 shrink-0 px-3 text-xs"
                      onClick={() => handleDownload(doc)}
                    >
                      <Download className="size-4" />
                      Download
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {!docsModalLoading && docsModalList.length === 0 ? (
            <p className="rounded-lg border border-dashed border-cs-border p-3 p1 text-cs-text">
              No documents available for this project yet.
            </p>
          ) : null}
        </div>
      </Modal>

      <Modal
        title="Request Task Deadline Change"
        centered
        open={isDeadlineModalOpen}
        onCancel={handleDeadlineModalClose}
        onOk={() => {
          void handleDeadlineRequestSubmit();
        }}
        okText="Send Request"
        confirmLoading={isSubmittingDeadlineRequest}
        okButtonProps={{
          disabled: !requestedDeadline || isSubmittingDeadlineRequest,
        }}
        cancelButtonProps={{ disabled: isSubmittingDeadlineRequest }}
      >
        <div className="space-y-3">
          <label className="block text-sm text-cs-heading">
            New Deadline
            <input
              type="date"
              value={requestedDeadline}
              onChange={(e) => setRequestedDeadline(e.target.value)}
              className="mt-1 w-full rounded-md border border-cs-border px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm text-cs-heading">
            Reason
            <textarea
              value={deadlineReason}
              onChange={(e) => setDeadlineReason(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-md border border-cs-border px-3 py-2 text-sm"
              placeholder="Add reason for deadline extension"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}
