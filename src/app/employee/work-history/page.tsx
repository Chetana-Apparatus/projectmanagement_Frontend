"use client";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import ProjectDetailModal from "@/components/common/work-tracking/ProjectDetailModal";
import { useEmployeeTasks } from "@/features/employee-tasks/EmployeeTasksProvider";
import {
  type EmployeeManagedTask,
  statusBadgeLayoutClass,
  statusClassMap,
} from "@/features/employee-tasks/status";

export default function EmployeeWorkHistoryPage() {
  const { historyTasks } = useEmployeeTasks();
  const [projectModalId, setProjectModalId] = useState<number | null>(null);

  const columns: ColumnsType<EmployeeManagedTask> = [
    {
      title: "Project Name",
      key: "project",
      align: "center",
      render: (_, record) =>
        record.projectId ? (
          <button
            type="button"
            className="max-w-full cursor-pointer text-left !text-blue-600 underline underline-offset-2 hover:!text-blue-800"
            onClick={() => setProjectModalId(Number(record.projectId))}
          >
            <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
              {record.project}
            </span>
          </button>
        ) : (
          <span>{record.project}</span>
        ),
    },
    {
      title: "Milestone",
      dataIndex: "milestone",
      key: "milestone",
      align: "center",
    },
    { title: "Task Name", dataIndex: "task", key: "task", align: "center" },
    {
      title: "Status",
      key: "status",
      align: "center",
      render: (_, record) => (
        <span
          className={`${statusBadgeLayoutClass} ${statusClassMap[record.status]}`}
        >
          {record.status}
        </span>
      ),
    },
    {
      title: "Expected Date",
      dataIndex: "deadline",
      key: "expectedDate",
      align: "center",
    },
    {
      title: "Assigned By",
      dataIndex: "assignedBy",
      key: "assignedBy",
      align: "center",
    },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="space-y-1">
        <h2 className="h2 font-semibold text-cs-heading">Work History</h2>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border-1 border-gray-100 bg-white shadow-sm">
        <Table<EmployeeManagedTask>
          className="w-full [&_.ant-table]:bg-white"
          rowKey="id"
          columns={columns}
          dataSource={historyTasks}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 900 }}
        />
      </div>

      <ProjectDetailModal
        open={projectModalId != null}
        projectId={projectModalId}
        onClose={() => setProjectModalId(null)}
      />
    </div>
  );
}
