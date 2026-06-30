import { requirePermission } from "@/lib/requirePermission";
import { PERMISSIONS } from "@/lib/permissions";
import ReportsClient from "./client";

const ReportsPage = async () => {
  await requirePermission(PERMISSIONS.VIEW_REPORTS);

  return <ReportsClient />;
};

export default ReportsPage;
