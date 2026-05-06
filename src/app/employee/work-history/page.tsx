"use client";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Suspense, useMemo, useState } from "react";
import ProjectDetailModal from "@/components/common/work-tracking/ProjectDetailModal";
import { useEmployeeTasks } from "@/features/employee-tasks/EmployeeTasksProvider";
import {
  type EmployeeManagedTask,
  employeeProjectLinkTableClass,
  statusBadgeLayoutClass,
  statusClassMap,
} from "@/features/employee-tasks/status";

function formatExpectedEndDate(value: string) {
  if (!value || value === "-") return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
}

export default function EmployeeWorkHistoryPage() {
  return (
    <Suspense
      fallback={<p className="p-4 text-sm text-gray-500 md:p-6">Loading…</p>}
    >
      <EmployeeWorkHistoryPageContent />
    </Suspense>
  );
}

function EmployeeWorkHistoryPageContent() {
  const { historyTasks } = useEmployeeTasks();
  const [projectModalId, setProjectModalId] = useState<number | null>(null);

  const columns = useMemo<ColumnsType<EmployeeManagedTask>>(
    () => [
      {
        title: "Project Name",
        key: "project",
        align: "center",
        render: (_, record) => {
          const rawPid = record.projectId?.trim() ?? "";
          const projectNumericId =
            rawPid !== "" && !Number.isNaN(Number(rawPid))
              ? Number(rawPid)
              : null;
          return projectNumericId != null ? (
            <div className="flex justify-center">
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
            <span className="text-cs-text">{record.project}</span>
          );
        },
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
        title: "Expected End Date",
        key: "expectedDate",
        align: "center",
        render: (_, record) => formatExpectedEndDate(record.deadline),
      },
      {
        title: "Assigned By",
        dataIndex: "assignedBy",
        key: "assignedBy",
        align: "center",
      },
    ],
    [],
  );

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
