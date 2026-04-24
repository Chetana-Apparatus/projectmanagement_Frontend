import DashboardLayout from "@/components/common/layout/DashboardLayout";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout userRole="Employee">{children}</DashboardLayout>;
}
