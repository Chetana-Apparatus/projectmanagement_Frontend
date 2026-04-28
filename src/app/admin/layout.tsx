import DashboardLayout from "@/components/common/layout/DashboardLayout";
import AdminAuthGuard from "@/components/guards/AdminAuthGuard";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminAuthGuard>
      <DashboardLayout userRole="admin">{children}</DashboardLayout>
    </AdminAuthGuard>
  );
}
