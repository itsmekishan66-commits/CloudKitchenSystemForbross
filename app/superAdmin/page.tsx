import DashboardLayout from "./DashboardLayout";
import SuperAdminContent from "./SuperAdminContent";

export default async function SuperAdminPage() {
  return (
    <DashboardLayout>
      <SuperAdminContent />
    </DashboardLayout>
  );
}
