import { requirePermission } from "@/lib/requirePermission";
import { PERMISSIONS } from "@/lib/permissions";
import dynamic from "next/dynamic";

const AccountingOverview = dynamic(() => import("./_client"));

const Page = async () => {
  await requirePermission(PERMISSIONS.VIEW_ACCOUNTING);
  return <AccountingOverview />;
};

export default Page;
