"use client";

import { Modal, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  Download,
  FileText,
  PauseCircle,
  PlayCircle,
  Square,
} from "lucide-react";
import { type CSSProperties, useState } from "react";
import Card from "@/components/common/card/Card";
import Button from "@/components/ui/Button";
import { useEmployeeTasks } from "@/features/employee-tasks/EmployeeTasksProvider";
import {
  type EmployeeManagedTask,
  statusClassMap,
} from "@/features/employee-tasks/status";

const singleLineHeaderStyle: CSSProperties = { whiteSpace: "nowrap" };
const singleLineCellStyle: CSSProperties = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export default function EmployeeTasksPage() {
  const {
    myTasks,
    startTask,
    pauseTask,
    stopTask,
    completeTask,
    canTransition,
  } = useEmployeeTasks();
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [selectedProjectName, setSelectedProjectName] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<
    EmployeeManagedTask["documents"][number] | null
  >(null);

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
    Modal.confirm({
      title: "Stop this task?",
      content: "This task will be moved to Work History.",
      okText: "Yes, Stop",
      cancelText: "Cancel",
      onOk: () => {
        stopTask(taskId);
      },
    });
  };

  const columns: ColumnsType<EmployeeManagedTask> = [
    {
      title: "Project Name",
      key: "project",
      width: 190,
      onHeaderCell: () => ({ style: singleLineHeaderStyle }),
      onCell: () => ({ style: singleLineCellStyle }),
      render: (_, record) =>
        record.documents.length > 0 ? (
          <button
            type="button"
            className="max-w-full cursor-pointer text-left text-blue-600 hover:underline"
            onClick={() => openProjectDocuments(record)}
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
      align: "right",
      width: 320,
      onHeaderCell: () => ({ style: singleLineHeaderStyle }),
      onCell: () => ({ style: singleLineCellStyle }),
      render: (_, record) => {
        const canStart = canTransition(record.status, "In Progress");
        const canPause = canTransition(record.status, "Paused");
        const canStop = canTransition(record.status, "Completed");
        const canComplete = canTransition(record.status, "Completed");
        const disableAllActions = record.status === "Completed";

        return (
          <div className="flex flex-nowrap justify-end gap-2">
            <Button
              className="h-8 px-3 text-xs"
              disabled={disableAllActions || !canStart}
              onClick={() => startTask(record.id)}
            >
              <PlayCircle className="size-4" />
              Start
            </Button>
            <Button
              variant="secondary"
              className="h-8 px-3 text-xs"
              disabled={disableAllActions || !canPause}
              onClick={() => pauseTask(record.id)}
            >
              <PauseCircle className="size-4" />
              Pause
            </Button>
            <Button
              variant="ghost"
              className="h-8 border border-gray-300 bg-transparent px-3 text-xs text-rose-600 hover:border-gray-400 hover:text-rose-700"
              disabled={disableAllActions || !canStop}
              onClick={() => handleStop(record.id)}
            >
              <Square className="size-4" />
              Stop
            </Button>
            <Button
              variant="secondary"
              className="h-8 px-3 text-xs"
              disabled={disableAllActions || !canComplete}
              onClick={() => completeTask(record.id)}
            >
              Complete
            </Button>
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
          <Table<EmployeeManagedTask>
            rowKey="id"
            columns={columns}
            dataSource={myTasks}
            pagination={{ pageSize: 6 }}
            scroll={{ x: 1200 }}
            rowClassName={() => "hover:bg-gray-50/60"}
          />
        </div>
      </Card>

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
    </div>
  );
}
