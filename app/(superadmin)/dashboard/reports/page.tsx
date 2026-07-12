import { requirePermission } from "@/lib/requirePermission";
import { PERMISSIONS } from "@/lib/permissions";
import dynamic from "next/dynamic";

const ReportsClient = dynamic(() => import("./client"));

const ReportsPage = async () => {
  await requirePermission(PERMISSIONS.VIEW_REPORTS);

  return <ReportsClient />;
};

export default ReportsPage;
