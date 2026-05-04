"use client";

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
import { type CSSProperties, type ReactNode, Suspense, useState } from "react";
import Card from "@/components/common/card/Card";
import { useToast } from "@/components/common/toast/ToastProvider";
import ProjectDetailModal from "@/components/common/work-tracking/ProjectDetailModal";
import Button from "@/components/ui/Button";
import { useEmployeeTasks } from "@/features/employee-tasks/EmployeeTasksProvider";
import {
  type EmployeeManagedTask,
  statusClassMap,
} from "@/features/employee-tasks/status";
import { useNotificationTableHighlight } from "@/hooks/useNotificationTableHighlight";
import { clampProgress, formatProgressLabel } from "@/lib/progress-display";

const singleLineHeaderStyle: CSSProperties = { whiteSpace: "nowrap" };
const singleLineCellStyle: CSSProperties = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

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
  const [selectedDocument, setSelectedDocument] = useState<
    EmployeeManagedTask["documents"][number] | null
  >(null);
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
    setSelectedDocument(task.documents[0] ?? null);
    setIsDocsModalOpen(true);
  };

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
      title: "Project Name",
      key: "project",
      width: 190,
      align: "center",
      onHeaderCell: () => ({ style: singleLineHeaderStyle }),
      onCell: () => ({ style: singleLineCellStyle }),
      render: (_, record) =>
        record.projectId ? (
          <button
            type="button"
            className="max-w-full cursor-pointer text-left text-blue-600 hover:underline"
            onClick={() => setProjectModalId(Number(record.projectId))}
          >
            <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
              {record.project}
            </span>
          </button>
        ) : (
          <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-cs-text">
            {record.project}
          </span>
        ),
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
      title: "Progress",
      key: "progressPercent",
      width: 90,
      align: "center",
      onHeaderCell: () => ({ style: singleLineHeaderStyle }),
      onCell: () => ({ style: singleLineCellStyle }),
      render: (_, record) => {
        const raw = clampProgress(record.progressPercent);
        if (raw <= 0) {
          return <span className="text-sm text-gray-500">—</span>;
        }
        return (
          <span className="text-sm font-medium tabular-nums text-cs-text">
            {formatProgressLabel(raw)}
          </span>
        );
      },
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
          className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${statusClassMap[record.status]}`}
        >
          {record.status}
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
          if (record.status === "Stopped") {
            return {
              label: "Complete",
              icon: <Check className="size-4" />,
              onClick: () => handleComplete(record.id, record.status),
              disabled: disableAllActions || !canComplete,
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
                "h-8 border border-red-300 bg-transparent px-3 text-xs text-red-600 hover:border-red-400 hover:text-red-700",
            };
          }
          return {
            label: "Start",
            icon: <PlayCircle className="size-4" />,
            onClick: () => startTask(record.id),
            disabled: disableAllActions || !canStart,
            variant: "default" as const,
            className: "h-8 px-3 text-xs",
          };
        })();

        const secondaryMenuItems = (() => {
          const items: {
            key: string;
            label: string;
            icon: ReactNode;
            disabled: boolean;
            onClick: () => void;
          }[] = [];

          items.push({
            key: "documents",
            label: "Project documents",
            icon: <FolderOpen className="size-4" />,
            disabled: disableAllActions,
            onClick: () => openProjectDocuments(record),
          });

          if (canStart) {
            items.push({
              key: "start",
              label:
                record.status === "Paused" || record.status === "Stopped"
                  ? "Resume"
                  : "Start",
              icon: <PlayCircle className="size-4" />,
              disabled: disableAllActions || !canStart,
              onClick: () => startTask(record.id),
            });
          }
          if (canPause) {
            items.push({
              key: "pause",
              label: "Pause",
              icon: <PauseCircle className="size-4" />,
              disabled: disableAllActions || !canPause,
              onClick: () => pauseTask(record.id),
            });
          }
          if (canStop) {
            items.push({
              key: "stop",
              label: "Stop",
              icon: <StopCircle className="size-4" />,
              disabled: disableAllActions || !canStop,
              onClick: () => handleStop(record.id),
            });
          }
          if (canComplete) {
            items.push({
              key: "complete",
              label: "Complete",
              icon: <Check className="size-4" />,
              disabled: disableAllActions || !canComplete,
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
        <p className="p1 text-cs-text">Manage and track your assigned tasks</p>
      </div>

      <Card className="items-start justify-start rounded-2xl shadow-sm">
        <div className="w-full space-y-4">
          {loading ? (
            <p className="text-sm text-gray-500">Loading tasks…</p>
          ) : null}
          <Table<EmployeeManagedTask>
            rowKey="id"
            columns={columns}
            dataSource={myTasks}
            pagination={{ pageSize: 6 }}
            scroll={{ x: 1200 }}
            rowClassName={(record) =>
              highlightRowId && record.id === highlightRowId
                ? "!bg-sky-100/90 transition-colors duration-300"
                : "hover:bg-gray-50/60"
            }
          />
        </div>
      </Card>

      <ProjectDetailModal
        open={projectModalId != null}
        projectId={projectModalId}
        onClose={() => setProjectModalId(null)}
      />

      <Modal
        title="Project Documents"
        open={isDocsModalOpen}
        onCancel={() => setIsDocsModalOpen(false)}
        footer={null}
      >
        <div className="space-y-3">
          <p className="p1 text-cs-text">
            {selectedProjectName
              ? `Files uploaded for ${selectedProjectName}`
              : "No project selected"}
          </p>

          {selectedDocument ? (
            <div className="rounded-lg border border-cs-border px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-cs-primary-100" />
                  <div>
                    <p className="p1 font-medium text-cs-heading">
                      {selectedDocument.name}
                    </p>
                    <p className="p1 uppercase text-cs-text">
                      {selectedDocument.type}
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  className="h-8 px-3 text-xs"
                  onClick={() => handleDownload(selectedDocument)}
                >
                  <Download className="size-4" />
                  Download
                </Button>
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-cs-border p-3 p1 text-cs-text">
              No documents available for this project yet.
            </p>
          )}
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
