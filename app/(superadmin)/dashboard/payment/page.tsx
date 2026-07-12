import { requirePermission } from "@/lib/requirePermission";
import { PERMISSIONS } from "@/lib/permissions";
import dynamic from "next/dynamic";

const PaymentPage = dynamic(() => import("./_client"));

const Page = async () => {
  await requirePermission(PERMISSIONS.VIEW_PAYMENTS);
  return <PaymentPage />;
};

export default Page;
