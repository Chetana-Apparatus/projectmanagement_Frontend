import DashboardLayout from "@/components/common/layout/DashboardLayout";
import { EmployeeTasksProvider } from "@/features/employee-tasks/EmployeeTasksProvider";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout userRole="Employee">
      <EmployeeTasksProvider>{children}</EmployeeTasksProvider>
    </DashboardLayout>
  );
}
