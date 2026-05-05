import DashboardLayout from "@/components/common/layout/DashboardLayout";
import AuthGuard from "@/components/guards/AuthGuard";
import { EmployeeTasksProvider } from "@/features/employee-tasks/EmployeeTasksProvider";

const EMPLOYEE_ONLY = ["EMPLOYEE"] as const;

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={EMPLOYEE_ONLY}>
      <DashboardLayout userRole="Employee">
        <EmployeeTasksProvider>{children}</EmployeeTasksProvider>
      </DashboardLayout>
    </AuthGuard>
  );
}
