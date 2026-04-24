import DashboardLayout from "@/components/common/layout/DashboardLayout";

export default function BusinessAnalystLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout userRole="BA">{children}</DashboardLayout>;
}
