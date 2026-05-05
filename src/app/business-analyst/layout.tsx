import DashboardLayout from "@/components/common/layout/DashboardLayout";
import DashboardRoleGuard from "@/components/guards/DashboardRoleGuard";

export default function BusinessAnalystLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardRoleGuard segment="business-analyst">
      <DashboardLayout userRole="BA">{children}</DashboardLayout>
    </DashboardRoleGuard>
  );
}
