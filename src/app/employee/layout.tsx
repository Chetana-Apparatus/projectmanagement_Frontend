import DashboardLayout from "@/components/common/layout/DashboardLayout";
import DashboardRoleGuard from "@/components/guards/DashboardRoleGuard";
import { EmployeeTasksProvider } from "@/features/employee-tasks/EmployeeTasksProvider";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardRoleGuard segment="employee">
      <DashboardLayout userRole="Employee">
        <EmployeeTasksProvider>{children}</EmployeeTasksProvider>
      </DashboardLayout>
    </DashboardRoleGuard>
  );
}
