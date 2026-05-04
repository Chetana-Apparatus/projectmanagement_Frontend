"use client";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import Card from "@/components/common/card/Card";
import { useEmployeeTasks } from "@/features/employee-tasks/EmployeeTasksProvider";
import {
  type EmployeeManagedTask,
  statusBadgeLayoutClass,
  statusClassMap,
} from "@/features/employee-tasks/status";

const columns: ColumnsType<EmployeeManagedTask> = [
  {
    title: "Project Name",
    dataIndex: "project",
    key: "project",
    align: "center",
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
    title: "Deadline",
    dataIndex: "deadline",
    key: "deadline",
    align: "center",
  },
  {
    title: "Assigned By",
    dataIndex: "assignedBy",
    key: "assignedBy",
    align: "center",
  },
];

export default function EmployeeWorkHistoryPage() {
  const { historyTasks } = useEmployeeTasks();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="space-y-1">
        <h2 className="h2 font-semibold text-cs-heading">Work History</h2>
        <p className="p1 text-cs-text">Completed and auto-stopped tasks</p>
      </div>

      <Card className="items-start justify-start rounded-2xl shadow-sm">
        <div className="w-full space-y-4">
          <Table<EmployeeManagedTask>
            rowKey="id"
            columns={columns}
            dataSource={historyTasks}
            pagination={{ pageSize: 8 }}
            scroll={{ x: 900 }}
          />
        </div>
      </Card>
    </div>
  );
}
