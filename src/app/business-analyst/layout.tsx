import DashboardLayout from "@/components/common/layout/DashboardLayout";
import AuthGuard from "@/components/guards/AuthGuard";

const BA_ONLY = ["BA"] as const;

export default function BusinessAnalystLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={BA_ONLY}>
      <DashboardLayout userRole="BA">{children}</DashboardLayout>
    </AuthGuard>
  );
}
